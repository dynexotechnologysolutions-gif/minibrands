import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-logger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAdminSession("manage_orders");
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const newStatus = body.status;
    const reason = body.reason?.trim() || "Admin status override.";

    if (!newStatus) {
      return NextResponse.json({ error: "Target status is required." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: newStatus,
        orderStatus: newStatus,
        escrowReleaseAt: newStatus === "completed" ? new Date() : order.escrowReleaseAt,
      },
    });

    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.profile.role,
      action: "UPDATE_ORDER_STATUS",
      targetType: "Order",
      targetId: id,
      oldValue: { status: order.status },
      newValue: { status: newStatus },
      reason,
    });

    return NextResponse.json({
      success: true,
      message: `Order status updated to '${newStatus}'.`,
      order: updatedOrder,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update order status." }, { status: 403 });
  }
}
