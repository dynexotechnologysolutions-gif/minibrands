import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-logger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAdminSession("suspend_users");
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const suspend = body.suspend ?? true;
    const reason = body.reason?.trim();

    if (suspend && !reason) {
      return NextResponse.json(
        { error: "A valid suspension reason is required." },
        { status: 400 }
      );
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    const updatedProfile = await prisma.userProfile.update({
      where: { id },
      data: {
        isSuspended: suspend,
        suspendedReason: suspend ? reason : null,
      },
    });

    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.profile.role,
      action: suspend ? "SUSPEND_USER" : "UNSUSPEND_USER",
      targetType: "UserProfile",
      targetId: id,
      oldValue: { isSuspended: userProfile.isSuspended, suspendedReason: userProfile.suspendedReason },
      newValue: { isSuspended: suspend, suspendedReason: suspend ? reason : null },
      reason: suspend ? reason : "Account suspension revoked by admin.",
    });

    return NextResponse.json({
      success: true,
      message: `User ${userProfile.user.email} ${suspend ? "suspended" : "unsuspended"}.`,
      profile: updatedProfile,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update suspension state." }, { status: 403 });
  }
}
