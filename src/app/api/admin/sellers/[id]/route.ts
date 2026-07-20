import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminSession("manage_sellers");
    const { id } = await params;

    const seller = await prisma.seller.findUnique({
      where: { id },
      include: {
        userProfile: { include: { user: true } },
        verification: true,
        products: {
          include: { images: true, variants: true },
        },
        orders: {
          include: {
            buyer: { include: { user: true } },
            address: true,
            returnRequest: true,
          },
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          include: { buyer: { include: { user: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found." }, { status: 404 });
    }

    const paidOrders = seller.orders.filter((o) => o.status !== "cancelled");
    const totalGmvPaise = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalCommissionPaise = paidOrders.reduce((sum, o) => sum + o.commissionAmount, 0);
    const escrowBalancePaise = seller.orders
      .filter((o) => o.status === "shipped" || o.status === "delivered" || o.status === "confirmed")
      .reduce((sum, o) => sum + (o.totalAmount - o.commissionAmount), 0);

    const returnsCount = seller.orders.filter((o) => o.returnRequest).length;
    const refundsCount = seller.orders.filter((o) => o.returnRequest?.status === "REFUNDED").length;

    const detail = {
      sellerId: seller.id,
      storeInfo: {
        businessName: seller.businessName,
        storeName: seller.storeName || seller.businessName,
        category: seller.category,
        city: seller.city,
        storeLogo: seller.storeLogo,
        storeBanner: seller.storeBanner,
        storeDescription: seller.storeDescription,
        razorpayFundAccountId: seller.razorpayFundAccountId,
        createdAt: seller.createdAt.toISOString(),
      },
      ownerDetails: {
        id: seller.userProfile.userId,
        name: seller.userProfile.user.name,
        email: seller.userProfile.user.email,
        image: seller.userProfile.user.image,
        role: seller.userProfile.role,
        isSuspended: seller.userProfile.isSuspended,
        suspendedReason: seller.userProfile.suspendedReason,
        lastLoginAt: seller.userProfile.lastLoginAt,
      },
      verificationHistory: seller.verification
        ? {
            kycStatus: seller.verification.kycStatus,
            trustScore: seller.verification.trustScore,
            bankVerified: seller.verification.bankVerified,
            bankAccountLast4: seller.verification.bankAccountLast4,
            signzyReferenceId: seller.verification.signzyReferenceId,
            faceMatchScore: seller.verification.faceMatchScore,
            rejectionReason: seller.verification.rejectionReason,
            verifiedAt: seller.verification.verifiedAt?.toISOString(),
          }
        : null,
      financials: {
        totalGmv: totalGmvPaise / 100,
        totalCommission: totalCommissionPaise / 100,
        netPayout: (totalGmvPaise - totalCommissionPaise) / 100,
        escrowBalance: escrowBalancePaise / 100,
        ordersCount: seller.orders.length,
        returnsCount,
        refundsCount,
      },
      products: seller.products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price / 100,
        isPublished: p.isPublished,
        stockCount: p.variants.reduce((sum, v) => sum + v.stockCount, 0),
        rating: p.averageRating,
        imageUrl: p.images[0]?.url || "/placeholder.png",
      })),
      orders: seller.orders.slice(0, 10).map((o) => ({
        id: o.id,
        buyerName: o.buyer.user.name,
        totalAmount: o.totalAmount / 100,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
      reviews: seller.reviews.map((r) => ({
        id: r.id,
        buyerName: r.buyer.user.name,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({ seller: detail });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch seller detail." }, { status: 403 });
  }
}
