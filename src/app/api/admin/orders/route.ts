import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await verifyAdminSession("manage_orders");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";

    const whereClause: any = {};
    if (search.trim()) {
      whereClause.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { razorpayOrderId: { contains: search, mode: "insensitive" } },
        { seller: { businessName: { contains: search, mode: "insensitive" } } },
        { buyer: { user: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    if (status !== "ALL") {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        seller: true,
        buyer: { include: { user: true } },
        address: true,
        items: { include: { product: true, variant: true } },
        returnRequest: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      buyerName: o.buyer.user.name || "Buyer",
      buyerEmail: o.buyer.user.email,
      sellerName: o.seller.businessName,
      sellerId: o.seller.id,
      status: o.status,
      paymentStatus: o.paymentStatus,
      totalAmount: o.totalAmount / 100,
      commissionAmount: o.commissionAmount / 100,
      itemCount: o.items.length,
      razorpayOrderId: o.razorpayOrderId,
      razorpayPaymentId: o.razorpayPaymentId,
      icarryAwbNumber: o.icarryAwbNumber,
      trackingUrl: o.trackingUrl,
      escrowReleaseAt: o.escrowReleaseAt?.toISOString(),
      hasReturnRequest: !!o.returnRequest,
      createdAt: o.createdAt.toISOString(),
    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch orders." }, { status: 403 });
  }
}
