import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-logger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAdminSession("approve_kyc");
    const { id } = await params;

    const seller = await prisma.seller.findUnique({
      where: { id },
      include: { verification: true, userProfile: { include: { user: true } } },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found." }, { status: 404 });
    }

    const previousStatus = seller.verification?.kycStatus || "pending";
    const previousSellerStatus = (seller as { status?: string }).status || "unknown";

    const { updatedVerification } = await prisma.$transaction(async (tx) => {
      await tx.seller.update({
        where: { id },
        data: { status: "APPROVED" as const, verifiedAt: new Date() },
      });

      const verification = await tx.sellerVerification.upsert({
        where: { sellerId: id },
        update: {
          kycStatus: "approved",
          trustScore: 95,
          bankVerified: true,
          rejectionReason: null,
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

      return { updatedVerification: verification };
    });

    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.profile.role,
      action: "APPROVE_SELLER_KYC",
      targetType: "SellerVerification",
      targetId: updatedVerification.id,
      oldValue: { kycStatus: previousStatus, sellerStatus: previousSellerStatus },
      newValue: { kycStatus: "approved", trustScore: 95, bankVerified: true, sellerStatus: "APPROVED" },
      reason: "Manual admin approval verified by Founder Hub.",
    });

    return NextResponse.json({
      success: true,
      message: `KYC approved for ${seller.businessName}.`,
      verification: updatedVerification,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to approve KYC." }, { status: 403 });
  }
}
