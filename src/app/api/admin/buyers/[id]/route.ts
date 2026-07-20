import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminSession("manage_buyers");
    const { id } = await params;

    const buyer = await prisma.userProfile.findUnique({
      where: { id },
      include: {
        user: true,
        addresses: { where: { isDeleted: false } },
        orders: {
          include: { seller: true, items: { include: { product: true } } },
          orderBy: { createdAt: "desc" },
        },
        reviewsGiven: {
          include: { product: true, seller: true },
          orderBy: { createdAt: "desc" },
        },
        returnRequests: {
          include: { order: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!buyer) {
      return NextResponse.json({ error: "Buyer profile not found." }, { status: 404 });
    }

    const detail = {
      id: buyer.id,
      userId: buyer.userId,
      name: buyer.user.name,
      email: buyer.user.email,
      image: buyer.user.image,
      role: buyer.role,
      abuseScore: buyer.abuseScore,
      returnCount: buyer.returnCount,
      refundCount: buyer.refundCount,
      disputeCount: buyer.disputeCount,
      isSuspended: buyer.isSuspended,
      suspendedReason: buyer.suspendedReason,
      lastLoginAt: buyer.lastLoginAt,
      createdAt: buyer.createdAt.toISOString(),
      addresses: buyer.addresses,
      orders: buyer.orders.map((o) => ({
        id: o.id,
        sellerName: o.seller.businessName,
        totalAmount: o.totalAmount / 100,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
      reviews: buyer.reviewsGiven.map((r) => ({
        id: r.id,
        productName: r.product.name,
        sellerName: r.seller.businessName,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
      returns: buyer.returnRequests.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        refundAmount: r.refundAmount / 100,
        status: r.status,
        reason: r.reason,
        createdAt: r.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({ buyer: detail });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to query buyer detail." }, { status: 403 });
  }
}
