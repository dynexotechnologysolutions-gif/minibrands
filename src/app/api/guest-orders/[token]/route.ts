import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GuestOrderService } from "@/lib/guest-order.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const tokenHash = GuestOrderService.hashGuestToken(token);

    const order = await prisma.order.findUnique({
      where: { guestTokenHash: tokenHash },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check token expiration
    if (order.guestTokenExpiresAt && order.guestTokenExpiresAt < new Date()) {
      return NextResponse.json({ error: "Access token has expired" }, { status: 403 });
    }

    // Strict response minimization to protect PII
    const minimizedOrder = {
      orderRef: order.razorpayOrderId || `ORD-${order.id.substring(0, 8).toUpperCase()}`,
      status: order.status,
      totalAmount: order.totalAmount,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.unitPrice,
      })),
      guestName: order.guestName,
      guestEmail: order.guestEmail,
      createdAt: order.createdAt,
      isClaimed: order.buyerId !== null,
    };

    return NextResponse.json(minimizedOrder);
  } catch (error: any) {
    console.error("[Get Guest Order API Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
