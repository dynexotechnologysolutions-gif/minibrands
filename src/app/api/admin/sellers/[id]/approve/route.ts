import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-logger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAdminSession("manage_sellers");
    const { id } = await params;

    const seller = await prisma.seller.findUnique({
      where: { id },
      include: { userProfile: true },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found." }, { status: 404 });
    }

    const previousStatus = seller.status;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Seller status
      const updatedSeller = await tx.seller.update({
        where: { id },
        data: {
          status: "APPROVED",
          verifiedAt: new Date(),
          approvedBy: session.user.email,
        },
      });

      // 2. Update/upsert SellerVerification
      await tx.sellerVerification.upsert({
        where: { sellerId: id },
        update: {
          kycStatus: "approved",
          trustScore: 95,
          bankVerified: true,
          verifiedAt: new Date(),
        },
        create: {
          sellerId: id,
          kycStatus: "approved",
          trustScore: 95,
          bankVerified: true,
          verifiedAt: new Date(),
        },
      });

      // 3. Automatically publish all DRAFT products of this seller
      await tx.product.updateMany({
        where: {
          sellerId: id,
          isDeleted: false,
          status: "DRAFT",
        },
        data: {
          status: "PUBLISHED",
          isPublished: true,
          publishedAt: new Date(),
        },
      });

      return updatedSeller;
    });

    // 4. Create Audit Log
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.profile.role,
      action: "APPROVE_SELLER_KYC",
      targetType: "Seller",
      targetId: id,
      oldValue: { status: previousStatus },
      newValue: { status: "APPROVED" },
      reason: "Manual admin approval verified via Console.",
    });

    return NextResponse.json({
      success: true,
      message: `Seller ${seller.businessName} has been approved. Draft products are now published.`,
      seller: result,
    });
  } catch (err: any) {
    console.error("Approve seller error:", err);
    return NextResponse.json({ error: err.message || "Failed to approve seller." }, { status: 403 });
  }
}
