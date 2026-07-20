import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await verifyAdminSession("view_dashboard");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    // If search parameter is present, return instant global search results across entities
    if (search.trim().length >= 2) {
      const query = search.trim();

      const [sellers, buyers, products, orders, returns, kycs] = await Promise.all([
        prisma.seller.findMany({
          where: {
            OR: [
              { businessName: { contains: query, mode: "insensitive" } },
              { storeName: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 5,
        }),
        prisma.userProfile.findMany({
          where: {
            user: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
          },
          include: { user: true },
          take: 5,
        }),
        prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { category: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 5,
        }),
        prisma.order.findMany({
          where: {
            OR: [
              { id: { contains: query, mode: "insensitive" } },
              { razorpayOrderId: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 5,
        }),
        prisma.returnRequest.findMany({
          where: { id: { contains: query, mode: "insensitive" } },
          take: 5,
        }),
        prisma.sellerVerification.findMany({
          where: {
            OR: [
              { signzyReferenceId: { contains: query, mode: "insensitive" } },
              { seller: { businessName: { contains: query, mode: "insensitive" } } },
            ],
          },
          include: { seller: true },
          take: 5,
        }),
      ]);

      const searchResults = [
        ...sellers.map((s) => ({
          id: s.id,
          type: "seller" as const,
          title: s.businessName || s.storeName,
          subtitle: `Category: ${s.category} • City: ${s.city}`,
          href: `/admin/sellers/${s.id}`,
          badge: "Seller",
        })),
        ...buyers.map((b) => ({
          id: b.id,
          type: "buyer" as const,
          title: b.user.name || "Buyer",
          subtitle: b.user.email,
          href: `/admin/buyers/${b.id}`,
          badge: "Buyer",
        })),
        ...products.map((p) => ({
          id: p.id,
          type: "product" as const,
          title: p.name,
          subtitle: `₹${(p.price / 100).toLocaleString("en-IN")} • ${p.category}`,
          href: `/admin/products?id=${p.id}`,
          badge: "Product",
        })),
        ...orders.map((o) => ({
          id: o.id,
          type: "order" as const,
          title: `Order #${o.id.slice(0, 8)}`,
          subtitle: `Total: ₹${(o.totalAmount / 100).toLocaleString("en-IN")} • Status: ${o.status}`,
          href: `/admin/orders/${o.id}`,
          badge: "Order",
        })),
        ...returns.map((r) => ({
          id: r.id,
          type: "return" as const,
          title: `Return #${r.id.slice(0, 8)}`,
          subtitle: `Refund: ₹${(r.refundAmount / 100).toLocaleString("en-IN")} • Status: ${r.status}`,
          href: `/admin/returns`,
          badge: "Return",
        })),
        ...kycs.map((k) => ({
          id: k.id,
          type: "kyc" as const,
          title: `KYC: ${k.seller.businessName}`,
          subtitle: `Status: ${k.kycStatus.toUpperCase()} • Ref: ${k.signzyReferenceId || "Manual"}`,
          href: `/admin/kyc-queue`,
          badge: "KYC Queue",
        })),
      ];

      return NextResponse.json({ searchResults });
    }

    // Execute aggregate calculations across database
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      orders,
      thirtyDayOrders,
      todayOrders,
      sellers,
      sellerVerifications,
      buyers,
      products,
      reviews,
      returns,
      variants,
    ] = await Promise.all([
      prisma.order.findMany({
        include: {
          seller: true,
          buyer: { include: { user: true } },
        },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.seller.findMany({
        include: { verification: true },
      }),
      prisma.sellerVerification.findMany({
        include: { seller: true },
      }),
      prisma.userProfile.findMany(),
      prisma.product.findMany(),
      prisma.review.findMany(),
      prisma.returnRequest.findMany({
        include: {
          buyer: { include: { user: true } },
          order: { include: { seller: true } },
        },
      }),
      prisma.productVariant.findMany(),
    ]);

    // Financial Metrics (Paise to INR)
    const paidOrders = orders.filter((o) => o.status !== "cancelled");
    const totalGmvPaise = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const todayGmvPaise = todayOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const thirtyDayGmvPaise = thirtyDayOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const aovPaise = paidOrders.length ? Math.round(totalGmvPaise / paidOrders.length) : 0;
    const commissionEarnedPaise = paidOrders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);

    // Escrow Metrics
    const pendingEscrowPaise = orders
      .filter((o) => o.status === "shipped" || o.status === "delivered" || o.status === "confirmed" || o.status === "paid")
      .reduce((sum, o) => sum + (o.totalAmount - (o.commissionAmount || 0)), 0);

    const releasedEscrowPaise = orders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + (o.totalAmount - (o.commissionAmount || 0)), 0);

    // Order Breakdown
    const completedOrdersCount = orders.filter((o) => o.status === "completed").length;
    const pendingOrdersCount = orders.filter(
      (o) => o.status === "created" || o.status === "paid" || o.status === "confirmed"
    ).length;
    const cancelledOrdersCount = orders.filter((o) => o.status === "cancelled").length;
    const disputedOrdersCount = orders.filter((o) => o.status === "disputed").length;

    // Inventory Stock Alert Metrics
    const lowStockCount = variants.filter((v) => v.stockCount > 0 && v.stockCount <= 10).length;
    const outOfStockCount = variants.filter((v) => v.stockCount === 0).length;

    // KYC Metrics (Supports both approved & auto_approved)
    const pendingKycCount = sellerVerifications.filter((v) => v.kycStatus === "pending").length;
    const verifiedSellersCount = sellerVerifications.filter((v) => v.kycStatus === "approved" || v.kycStatus === "auto_approved").length;

    // Reviews & Trust Scores
    const totalReviews = reviews.length;
    const averageRating = totalReviews
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 5.0;

    const approvedVerifications = sellerVerifications.filter((v) => v.kycStatus === "approved" || v.kycStatus === "auto_approved");
    const trustScoreAverage = approvedVerifications.length
      ? Number((approvedVerifications.reduce((sum, v) => sum + (v.trustScore || 95), 0) / approvedVerifications.length).toFixed(1))
      : 95.0;

    // Formatted KPI Summary Object
    const metrics = {
      totalGmv: totalGmvPaise / 100,
      todayGmv: todayGmvPaise / 100,
      thirtyDayGmv: thirtyDayGmvPaise / 100,
      aov: aovPaise / 100,
      completedOrders: completedOrdersCount,
      pendingOrders: pendingOrdersCount,
      cancelledOrders: cancelledOrdersCount,
      disputedOrders: disputedOrdersCount,
      refundRequests: returns.length,
      pendingReturns: returns.filter((r) => r.status !== "RETURN_COMPLETED" && r.status !== "REJECTED").length,
      pendingKyc: pendingKycCount,
      verifiedSellers: verifiedSellersCount,
      activeSellers: sellers.length,
      buyerCount: buyers.length,
      productCount: products.length,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      commissionEarned: commissionEarnedPaise / 100,
      pendingEscrow: pendingEscrowPaise / 100,
      releasedEscrow: releasedEscrowPaise / 100,
      upcomingPayouts: pendingEscrowPaise / 100,
      averageRating,
      totalReviews,
      trustScoreAverage,
    };

    // Real database-driven trends & activity
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const ordersTrendMap: Record<string, { completed: number; pending: number; cancelled: number }> = {
      Mon: { completed: 0, pending: 0, cancelled: 0 },
      Tue: { completed: 0, pending: 0, cancelled: 0 },
      Wed: { completed: 0, pending: 0, cancelled: 0 },
      Thu: { completed: 0, pending: 0, cancelled: 0 },
      Fri: { completed: 0, pending: 0, cancelled: 0 },
      Sat: { completed: 0, pending: 0, cancelled: 0 },
      Sun: { completed: 0, pending: 0, cancelled: 0 },
    };

    orders.forEach((o) => {
      const dayName = days[o.createdAt.getDay()];
      if (o.status === "completed" || o.status === "delivered") {
        ordersTrendMap[dayName].completed += 1;
      } else if (o.status === "cancelled") {
        ordersTrendMap[dayName].cancelled += 1;
      } else {
        ordersTrendMap[dayName].pending += 1;
      }
    });

    const ordersTrend = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
      name: day,
      ...ordersTrendMap[day],
    }));

    const revenueTrend = [
      { name: "30-Day GMV", gmv: thirtyDayGmvPaise / 100, commission: (thirtyDayGmvPaise * 0.1) / 100 },
      { name: "Today GMV", gmv: todayGmvPaise / 100, commission: (todayGmvPaise * 0.1) / 100 },
      { name: "Total All-Time GMV", gmv: totalGmvPaise / 100, commission: commissionEarnedPaise / 100 },
    ];

    // Fetch Recent Audit Logs for Activity Feed
    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
    });

    const activityFeed = [
      ...recentAuditLogs.map((log) => ({
        id: log.id,
        title: log.action.replace(/_/g, " "),
        description: log.reason || `Action by ${log.actorEmail}`,
        timestamp: log.createdAt.toISOString(),
        type: "audit" as const,
      })),
      ...orders.slice(0, 10).map((o) => ({
        id: `ord-${o.id}`,
        title: `New Order #${o.id.slice(0, 8)}`,
        description: `Placed by ${o.buyer.user.name || "Buyer"} for ₹${(o.totalAmount / 100).toLocaleString("en-IN")}`,
        timestamp: o.createdAt.toISOString(),
        type: "order" as const,
      })),
      ...returns.slice(0, 5).map((r) => ({
        id: `ret-${r.id}`,
        title: `Return Requested #${r.id.slice(0, 8)}`,
        description: `Refund claim ₹${(r.refundAmount / 100).toLocaleString("en-IN")}`,
        timestamp: r.createdAt.toISOString(),
        type: "return" as const,
      })),
      ...sellers.slice(0, 5).map((s) => ({
        id: `sel-${s.id}`,
        title: `Seller Registered: ${s.businessName}`,
        description: `Category: ${s.category} (${s.city})`,
        timestamp: s.createdAt.toISOString(),
        type: "seller" as const,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);

    // Recent Tables
    const recentOrders = orders.slice(0, 6).map((o) => ({
      id: o.id,
      buyerName: o.buyer.user.name || "Buyer",
      sellerName: o.seller.businessName,
      totalAmount: o.totalAmount / 100,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    }));

    const recentReturns = returns.slice(0, 5).map((r) => ({
      id: r.id,
      orderId: r.orderId,
      buyerName: r.buyer.user.name || "Buyer",
      sellerName: r.order.seller.businessName,
      refundAmount: r.refundAmount / 100,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));

    const recentKycs = sellerVerifications
      .filter((v) => v.kycStatus === "pending")
      .slice(0, 5)
      .map((k) => ({
        id: k.id,
        sellerId: k.sellerId,
        businessName: k.seller.businessName,
        category: k.seller.category,
        kycStatus: k.kycStatus,
        createdAt: k.createdAt.toISOString(),
      }));

    return NextResponse.json({
      metrics,
      revenueTrend,
      ordersTrend,
      activityFeed,
      recentOrders,
      recentReturns,
      recentKycs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch dashboard data." },
      { status: err.message?.startsWith("UNAUTHORIZED") ? 401 : 403 }
    );
  }
}
