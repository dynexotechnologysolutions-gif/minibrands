import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await verifyAdminSession("manage_sellers");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const kycStatus = searchParams.get("kycStatus") || "ALL";

    const whereClause: any = {};
    if (search.trim()) {
      whereClause.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { storeName: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    if (kycStatus !== "ALL") {
      whereClause.verification = { kycStatus };
    }

    const sellers = await prisma.seller.findMany({
      where: whereClause,
      include: {
        userProfile: { include: { user: true } },
        verification: true,
        products: true,
        orders: true,
        reviews: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedSellers = sellers.map((s) => {
      const gmvPaise = s.orders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + o.totalAmount, 0);
      const commissionPaise = s.orders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + o.commissionAmount, 0);

      return {
        id: s.id,
        businessName: s.businessName,
        storeName: s.storeName || s.businessName,
        category: s.category,
        city: s.city,
        ownerName: s.userProfile.user.name,
        ownerEmail: s.userProfile.user.email,
        kycStatus: s.verification?.kycStatus || "pending",
        trustScore: s.verification?.trustScore || 0,
        bankVerified: s.verification?.bankVerified || false,
        productCount: s.products.length,
        orderCount: s.orders.length,
        totalGmv: gmvPaise / 100,
        totalCommission: commissionPaise / 100,
        createdAt: s.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ sellers: formattedSellers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to query sellers." }, { status: 403 });
  }
}
