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
          status: "SUSPENDED",
          suspendedAt: new Date(),
          suspendedBy: session.user.email,
        },
      });

      // 2. Update UserProfile suspend status
      await tx.userProfile.update({
        where: { id: seller.userProfileId },
        data: {
          isSuspended: true,
          suspendedReason: reason || "Suspended via Admin Console",
        },
      });

      return updatedSeller;
    });

    // 3. Create Audit Log
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.profile.role,
      action: "SUSPEND_SELLER",
      targetType: "Seller",
      targetId: id,
      oldValue: { status: previousStatus },
      newValue: { status: "SUSPENDED", reason },
      reason: "Manual admin suspension via Console.",
    });

    return NextResponse.json({
      success: true,
      message: `Seller ${seller.businessName} has been suspended.`,
      seller: result,
    });
  } catch (err: any) {
    console.error("Suspend seller error:", err);
    return NextResponse.json({ error: err.message || "Failed to suspend seller." }, { status: 403 });
  }
}
