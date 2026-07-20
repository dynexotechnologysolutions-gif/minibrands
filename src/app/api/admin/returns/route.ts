import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await verifyAdminSession("manage_returns");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";

    const whereClause: any = {};
    if (search.trim()) {
      whereClause.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { orderId: { contains: search, mode: "insensitive" } },
        { buyer: { user: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    if (status !== "ALL") {
      whereClause.status = status;
    }

    const returns = await prisma.returnRequest.findMany({
      where: whereClause,
      include: {
        buyer: { include: { user: true } },
        order: { include: { seller: true } },
        refund: true,
        evidence: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = returns.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      buyerName: r.buyer.user.name || "Buyer",
      buyerEmail: r.buyer.user.email,
      buyerAbuseScore: r.buyer.abuseScore,
      sellerName: r.order.seller.businessName,
      status: r.status,
      reason: r.reason,
      comment: r.comment,
      refundAmount: r.refundAmount / 100,
      inspectionResult: r.inspectionResult,
      evidenceCount: r.evidence.length,
      createdAt: r.createdAt.toISOString(),
      refund: r.refund
        ? {
            id: r.refund.id,
            status: r.refund.status,
            razorpayRefundId: r.refund.razorpayRefundId,
          }
        : null,
    }));

    return NextResponse.json({ returns: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to query returns." }, { status: 403 });
  }
}
