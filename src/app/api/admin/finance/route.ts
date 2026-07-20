import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await verifyAdminSession("manage_finance");

    const [orders, refunds, sellers] = await Promise.all([
      prisma.order.findMany({
        include: {
          seller: true,
          buyer: { include: { user: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.refund.findMany({
        include: {
          returnRequest: {
            include: {
              order: { include: { seller: true } },
            },
          },
        },
        orderBy: { initiatedAt: "desc" },
      }),
      prisma.seller.findMany({
        include: { verification: true },
      }),
    ]);

    const paidOrders = orders.filter((o) => o.status !== "cancelled");

    const totalGmvPaise = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const commissionPaise = paidOrders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
    const netRevenuePaise = commissionPaise; // Marketplace commission earned

    const pendingEscrowOrders = orders.filter(
      (o) => o.status === "shipped" || o.status === "delivered" || o.status === "confirmed"
    );
    const pendingEscrowPaise = pendingEscrowOrders.reduce(
      (sum, o) => sum + (o.totalAmount - o.commissionAmount),
      0
    );

    const releasedEscrowOrders = orders.filter((o) => o.status === "completed");
    const releasedEscrowPaise = releasedEscrowOrders.reduce(
      (sum, o) => sum + (o.totalAmount - o.commissionAmount),
      0
    );

    const totalRefundPaise = refunds
      .filter((r) => r.status === "processed" || r.status === "initiated")
      .reduce((sum, r) => sum + r.amount, 0);

    // Escrow Ledger & Payout Queue
    const payoutQueue = sellers.map((s) => {
      const sellerOrders = orders.filter((o) => o.sellerId === s.id && o.status === "completed");
      const pendingSellerOrders = orders.filter(
        (o) => o.sellerId === s.id && (o.status === "shipped" || o.status === "delivered")
      );

      const totalReleasedPaise = sellerOrders.reduce((sum, o) => sum + (o.totalAmount - o.commissionAmount), 0);
      const totalPendingPaise = pendingSellerOrders.reduce((sum, o) => sum + (o.totalAmount - o.commissionAmount), 0);

      return {
        sellerId: s.id,
        businessName: s.businessName,
        razorpayFundAccountId: s.razorpayFundAccountId || "NOT_CONFIGURED",
        bankVerified: s.verification?.bankVerified || false,
        bankLast4: s.verification?.bankAccountLast4 || "N/A",
        totalReleasedAmount: totalReleasedPaise / 100,
        pendingEscrowAmount: totalPendingPaise / 100,
        status: s.verification?.bankVerified ? "READY_FOR_PAYOUT" : "NEEDS_BANK_VERIFICATION",
      };
    });

    // Transaction Ledger
    const transactions = orders.slice(0, 15).map((o) => ({
      id: o.id,
      date: o.createdAt.toISOString(),
      orderId: o.id,
      sellerName: o.seller.businessName,
      buyerName: o.buyer.user.name || "Buyer",
      grossAmount: o.totalAmount / 100,
      commissionAmount: o.commissionAmount / 100,
      netPayout: (o.totalAmount - o.commissionAmount) / 100,
      paymentMethod: o.razorpayPaymentId ? "Razorpay Online" : "Escrow Standard",
      escrowStatus: o.status === "completed" ? "RELEASED" : o.status === "cancelled" ? "REFUNDED" : "HELD_IN_ESCROW",
    }));

    return NextResponse.json({
      summary: {
        totalGmv: totalGmvPaise / 100,
        netRevenue: netRevenuePaise / 100,
        commission: commissionPaise / 100,
        pendingEscrow: pendingEscrowPaise / 100,
        releasedEscrow: releasedEscrowPaise / 100,
        refundAmount: totalRefundPaise / 100,
        upcomingReleases: pendingEscrowPaise / 100,
      },
      payoutQueue,
      transactions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Finance query failed." }, { status: 403 });
  }
}
