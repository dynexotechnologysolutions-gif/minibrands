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
    const body = await request.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
    }

    const seller = await prisma.seller.findUnique({
      where: { id },
      include: { userProfile: true },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found." }, { status: 404 });
    }

    const previousStatus = seller.status;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Seller status & notes
      const updatedSeller = await tx.seller.update({
        where: { id },
        data: {
          status: "REJECTED",
          adminNotes: reason,
          rejectedAt: new Date(),
          rejectedBy: session.user.email,
        },
      });

      // 2. Update/upsert SellerVerification
      await tx.sellerVerification.upsert({
        where: { sellerId: id },
        update: {
          kycStatus: "rejected",
          rejectionReason: reason,
        },
        create: {
          sellerId: id,
          kycStatus: "rejected",
          rejectionReason: reason,
        },
      });

      return updatedSeller;
    });

    // 3. Create Audit Log
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.profile.role,
      action: "REJECT_SELLER_KYC",
      targetType: "Seller",
      targetId: id,
      oldValue: { status: previousStatus },
      newValue: { status: "REJECTED", reason },
      reason: "Manual admin rejection via Console.",
    });

    return NextResponse.json({
      success: true,
      message: `Seller ${seller.businessName} has been rejected.`,
      seller: result,
    });
  } catch (err: any) {
    console.error("Reject seller error:", err);
    return NextResponse.json({ error: err.message || "Failed to reject seller." }, { status: 403 });
  }
}
