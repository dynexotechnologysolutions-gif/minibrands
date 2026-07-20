import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminSession("manage_orders");
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        seller: { include: { userProfile: { include: { user: true } } } },
        buyer: { include: { user: true } },
        address: true,
        items: {
          include: {
            product: { include: { images: true } },
            variant: true,
          },
        },
        review: true,
        returnRequest: { include: { refund: true, evidence: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const detail = {
      id: order.id,
      status: order.status,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal / 100,
      shipping: order.shipping / 100,
      tax: order.tax / 100,
      totalAmount: order.totalAmount / 100,
      commissionAmount: order.commissionAmount / 100,
      sellerPayout: (order.totalAmount - order.commissionAmount) / 100,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      escrowReleaseAt: order.escrowReleaseAt?.toISOString(),
      icarryOrderId: order.icarryOrderId,
      icarryAwbNumber: order.icarryAwbNumber,
      icarryLabelUrl: order.icarryLabelUrl,
      trackingUrl: order.trackingUrl,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      buyer: {
        id: order.buyer.id,
        name: order.buyer.user.name,
        email: order.buyer.user.email,
        abuseScore: order.buyer.abuseScore,
      },
      seller: {
        id: order.seller.id,
        businessName: order.seller.businessName,
        category: order.seller.category,
        email: order.seller.userProfile.user.email,
      },
      address: order.address,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.product.name,
        size: item.variant.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice / 100,
        imageUrl: item.product.images[0]?.url || "/placeholder.png",
      })),
      review: order.review,
      returnRequest: order.returnRequest,
    };

    return NextResponse.json({ order: detail });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch order detail." }, { status: 403 });
  }
}
