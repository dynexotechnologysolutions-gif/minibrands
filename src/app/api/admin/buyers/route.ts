import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await verifyAdminSession("manage_buyers");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const whereClause: any = {};
    if (search.trim()) {
      whereClause.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const buyerProfiles = await prisma.userProfile.findMany({
      where: whereClause,
      include: {
        user: true,
        orders: true,
        reviewsGiven: true,
        returnRequests: true,
        addresses: { where: { isDeleted: false } },
      },
      orderBy: { createdAt: "desc" },
    });

    const buyers = buyerProfiles.map((b) => {
      const paidOrders = b.orders.filter((o) => o.status !== "cancelled");
      const totalSpentPaise = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      return {
        id: b.id,
        userId: b.userId,
        name: b.user.name || "Buyer",
        email: b.user.email,
        image: b.user.image,
        abuseScore: b.abuseScore,
        returnCount: b.returnCount || b.returnRequests.length,
        refundCount: b.refundCount,
        disputeCount: b.disputeCount,
        isSuspended: b.isSuspended,
        suspendedReason: b.suspendedReason,
        orderCount: b.orders.length,
        totalSpent: totalSpentPaise / 100,
        addressCount: b.addresses.length,
        createdAt: b.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ buyers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to query buyers." }, { status: 403 });
  }
}
