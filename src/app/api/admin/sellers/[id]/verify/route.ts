import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAdminSession("manage_sellers");
    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    const seller = await prisma.seller.findUnique({
      where: { id },
      include: { userProfile: true },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found." }, { status: 404 });
    }

    const previousStatus = seller.status;

    if (action === "APPROVE") {
      const result = await prisma.$transaction(async (tx) => {
        const updatedSeller = await tx.seller.update({
          where: { id },
          data: {
            status: "APPROVED",
            verifiedAt: new Date(),
            approvedBy: session.user.email,
          },
        });

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
        message: `Seller ${seller.businessName} approved.`,
        seller: result,
      });
    } else if (action === "REJECT") {
      if (!reason || !reason.trim()) {
        return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedSeller = await tx.seller.update({
          where: { id },
          data: {
            status: "REJECTED",
            adminNotes: reason,
            rejectedAt: new Date(),
            rejectedBy: session.user.email,
          },
        });

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
        message: `Seller ${seller.businessName} rejected.`,
        seller: result,
      });
    } else {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Verify seller error:", err);
    return NextResponse.json({ error: err.message || "Failed to process verification." }, { status: 403 });
  }
}
