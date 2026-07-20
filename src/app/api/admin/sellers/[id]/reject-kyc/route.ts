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

    const body = await request.json().catch(() => ({}));
    const reason = body.reason?.trim();

    if (!reason) {
      return NextResponse.json(
        { error: "A valid rejection reason is required." },
        { status: 400 }
      );
    }

    const seller = await prisma.seller.findUnique({
      where: { id },
      include: { verification: true },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found." }, { status: 404 });
    }

    const previousStatus = seller.verification?.kycStatus || "pending";

    const updatedVerification = await prisma.sellerVerification.upsert({
      where: { sellerId: id },
      update: {
        kycStatus: "rejected",
        rejectionReason: reason,
        verifiedAt: null,
      },
      create: {
        sellerId: id,
        kycStatus: "rejected",
        rejectionReason: reason,
      },
    });

    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.profile.role,
      action: "REJECT_SELLER_KYC",
      targetType: "SellerVerification",
      targetId: updatedVerification.id,
      oldValue: { kycStatus: previousStatus },
      newValue: { kycStatus: "rejected", rejectionReason: reason },
      reason,
    });

    return NextResponse.json({
      success: true,
      message: `KYC rejected for seller.`,
      verification: updatedVerification,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to reject KYC." }, { status: 403 });
  }
}
