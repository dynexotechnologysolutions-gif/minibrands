import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  DollarSign,
  ShoppingBag,
  Store,
  Users,
  Package,
  ShieldCheck,
  RotateCcw,
  Star,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FounderDashboardPage() {
  // ── Direct Prisma queries — no HTTP, no auth round-trip ──────────────────
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
    recentAuditLogs,
  ] = await Promise.all([
    prisma.order.findMany({
      include: {
        seller: true,
        buyer: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
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
    prisma.auditLog.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // ── Financial Metrics (paise → INR) ─────────────────────────────────────
  const paidOrders = orders.filter((o) => o.status !== "cancelled");
  const totalGmv = paidOrders.reduce((s, o) => s + o.totalAmount, 0) / 100;
  const todayGmv = todayOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.totalAmount, 0) / 100;
  const thirtyDayGmv = thirtyDayOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.totalAmount, 0) / 100;
  const commissionEarned = paidOrders.reduce((s, o) => s + (o.commissionAmount || 0), 0) / 100;

  // ── Escrow Metrics ───────────────────────────────────────────────────────
  const pendingEscrow = orders
    .filter((o) => ["shipped", "delivered", "confirmed", "paid"].includes(o.status))
    .reduce((s, o) => s + (o.totalAmount - (o.commissionAmount || 0)), 0) / 100;

  const releasedEscrow = orders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + (o.totalAmount - (o.commissionAmount || 0)), 0) / 100;

  // ── Order Counts ─────────────────────────────────────────────────────────
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const pendingOrders = orders.filter((o) => ["created", "paid", "confirmed"].includes(o.status)).length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;

  // ── Inventory ────────────────────────────────────────────────────────────
  const lowStock = variants.filter((v) => v.stockCount > 0 && v.stockCount <= 10).length;
  const outOfStock = variants.filter((v) => v.stockCount === 0).length;

  // ── KYC / Sellers ────────────────────────────────────────────────────────
  const pendingKyc = sellerVerifications.filter((v) => v.kycStatus === "pending").length;
  const verifiedSellers = sellerVerifications.filter((v) => ["approved", "auto_approved"].includes(v.kycStatus)).length;

  // ── Reviews / Trust ──────────────────────────────────────────────────────
  const totalReviews = reviews.length;
  const averageRating = totalReviews
    ? Number((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1))
    : 5.0;
  const approvedVerifs = sellerVerifications.filter((v) => ["approved", "auto_approved"].includes(v.kycStatus));
  const trustScoreAverage = approvedVerifs.length
    ? Number((approvedVerifs.reduce((s, v) => s + (v.trustScore || 95), 0) / approvedVerifs.length).toFixed(1))
    : 95.0;

  // ── Returns ──────────────────────────────────────────────────────────────
  const pendingReturns = returns.filter((r) => !["RETURN_COMPLETED", "REJECTED"].includes(r.status)).length;

  // ── Revenue Trend (bar chart data) ───────────────────────────────────────
  const revenueTrend = [
    { name: "30-Day GMV", gmv: thirtyDayGmv, commission: thirtyDayGmv * 0.1 },
    { name: "Today GMV", gmv: todayGmv, commission: todayGmv * 0.1 },
    { name: "All-Time GMV", gmv: totalGmv, commission: commissionEarned },
  ];

  // ── Activity Feed ────────────────────────────────────────────────────────
  const activityFeed = [
    ...recentAuditLogs.map((log) => ({
      id: log.id,
      title: log.action.replace(/_/g, " "),
      description: log.reason || `Action by ${log.actorEmail}`,
      timestamp: log.createdAt.toISOString(),
    })),
    ...orders.slice(0, 10).map((o) => ({
      id: `ord-${o.id}`,
      title: `New Order #${o.id.slice(0, 8)}`,
      description: `Placed by ${o.buyer.user.name || "Buyer"} for ₹${(o.totalAmount / 100).toLocaleString("en-IN")}`,
      timestamp: o.createdAt.toISOString(),
    })),
    ...returns.slice(0, 5).map((r) => ({
      id: `ret-${r.id}`,
      title: `Return Requested #${r.id.slice(0, 8)}`,
      description: `Refund claim ₹${(r.refundAmount / 100).toLocaleString("en-IN")}`,
      timestamp: r.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 30);

  // ── Recent Orders Table ──────────────────────────────────────────────────
  const recentOrders = orders.slice(0, 8).map((o) => ({
    id: o.id,
    buyerName: o.buyer.user.name || "Buyer",
    sellerName: o.seller.businessName,
    totalAmount: o.totalAmount / 100,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  }));

  // ── Shorthand metrics object ─────────────────────────────────────────────
  const m = {
    totalGmv,
    todayGmv,
    thirtyDayGmv,
    commissionEarned,
    pendingEscrow,
    releasedEscrow,
    completedOrders,
    pendingOrders,
    cancelledOrders,
    pendingKyc,
    verifiedSellers,
    pendingReturns,
    activeSellers: sellers.length,
    buyerCount: buyers.length,
    productCount: products.length,
    lowStock,
    outOfStock,
    averageRating,
    totalReviews,
    trustScoreAverage,
  };

  // ── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-surface to-surface-container-low p-6 rounded-3xl border border-border-gray/70 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Executive Command Center</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-on-surface tracking-tight">
            Marketplace Performance Overview
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Real-time telemetry across sellers, buyers, escrow, orders, and compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/kyc-queue"
            className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-extrabold flex items-center gap-2 hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Review KYC ({m.pendingKyc})</span>
          </Link>
          <Link
            href="/admin/finance"
            className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-border-gray/70 text-on-surface text-xs font-bold hover:bg-surface-container transition-all"
          >
            <span>Escrow Ledger</span>
          </Link>
        </div>
      </div>

      {/* Primary Financial & Escrow KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total GMV */}
        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Total GMV</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-display font-extrabold text-2xl text-on-surface">
            ₹{m.totalGmv.toLocaleString("en-IN")}
          </h3>
          <div className="flex items-center gap-1 text-[11px] text-success-green font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>30d GMV: ₹{m.thirtyDayGmv.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Net Commission */}
        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Net Commission</span>
            <div className="p-2 rounded-xl bg-success-green/10 text-success-green">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-display font-extrabold text-2xl text-on-surface">
            ₹{m.commissionEarned.toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-text-muted font-medium">Marketplace Take-rate</p>
        </div>

        {/* Pending Escrow */}
        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Pending Escrow</span>
            <div className="p-2 rounded-xl bg-accent-yellow/10 text-accent-yellow">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-display font-extrabold text-2xl text-on-surface">
            ₹{m.pendingEscrow.toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-text-muted font-medium">Held for Delivery Confirmation</p>
        </div>

        {/* Released Escrow */}
        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Released Escrow</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-display font-extrabold text-2xl text-on-surface">
            ₹{m.releasedEscrow.toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-text-muted font-medium">Disbursed to Merchants</p>
        </div>
      </div>

      {/* Secondary Operational KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-border-gray/60">
          <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Active Sellers</p>
          <p className="text-lg font-extrabold text-on-surface mt-1">{m.activeSellers}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-border-gray/60">
          <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Buyers</p>
          <p className="text-lg font-extrabold text-on-surface mt-1">{m.buyerCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-border-gray/60">
          <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Catalog Products</p>
          <p className="text-lg font-extrabold text-on-surface mt-1">{m.productCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-border-gray/60">
          <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Average Rating</p>
          <p className="text-lg font-extrabold text-on-surface mt-1 flex items-center gap-1">
            <Star className="w-4 h-4 fill-accent-yellow text-accent-yellow" />
            <span>{m.averageRating}</span>
          </p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-border-gray/60">
          <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Trust Score Avg</p>
          <p className="text-lg font-extrabold text-success-green mt-1">{m.trustScoreAverage}%</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-border-gray/60">
          <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Low / Out Stock</p>
          <p className="text-lg font-extrabold text-error-red mt-1">
            {m.lowStock} / {m.outOfStock}
          </p>
        </div>
      </div>

      {/* Analytics Trends & Activity Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Visualizer */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-extrabold text-base text-on-surface">
                Revenue & GMV Trajectory
              </h3>
              <p className="text-xs text-text-muted">Weekly GMV breakdown and marketplace earnings</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary">
              Live Feed
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {revenueTrend.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-on-surface">{item.name}</span>
                  <span className="text-primary">₹{item.gmv.toLocaleString("en-IN")}</span>
                </div>
                <div className="h-2.5 rounded-full bg-surface-container overflow-hidden flex">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, totalGmv > 0 ? (item.gmv / totalGmv) * 100 * 3 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Cards & Live Alerts */}
        <div className="p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4">
          <h3 className="font-display font-extrabold text-base text-on-surface">
            Operational Action Queue
          </h3>

          <div className="space-y-3">
            <Link
              href="/admin/kyc-queue"
              className="p-3.5 rounded-2xl bg-surface-container-low border border-border-gray/50 flex items-center justify-between hover:border-primary transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                    Pending KYC Reviews
                  </h4>
                  <p className="text-[11px] text-text-muted">{m.pendingKyc} merchants waiting approval</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/admin/returns"
              className="p-3.5 rounded-2xl bg-surface-container-low border border-border-gray/50 flex items-center justify-between hover:border-primary transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-error-red/10 text-error-red">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                    Return & Dispute Queue
                  </h4>
                  <p className="text-[11px] text-text-muted">{m.pendingReturns} active return requests</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/admin/products"
              className="p-3.5 rounded-2xl bg-surface-container-low border border-border-gray/50 flex items-center justify-between hover:border-primary transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent-yellow/10 text-accent-yellow">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                    Inventory & Stock Alerts
                  </h4>
                  <p className="text-[11px] text-text-muted">{m.lowStock} products low stock</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          {/* Real-time Activity Feed List */}
          <div className="pt-4 border-t border-border-gray/40 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Live Marketplace Activity Feed
            </h4>

            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {activityFeed.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">No recent activity yet.</p>
              ) : (
                activityFeed.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-xl bg-surface-container-lowest border border-border-gray/40 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between font-bold text-on-surface">
                      <span>{act.title}</span>
                      <span className="text-[10px] text-text-muted font-normal">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted">{act.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Directory Preview Table */}
      <div className="p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-extrabold text-base text-on-surface">
              Recent Orders Directory
            </h3>
            <p className="text-xs text-text-muted">Latest transactional activity across Velvet Lane</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-gray/60 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4">Seller</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray/40 text-xs font-medium">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">#{ord.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 text-on-surface">{ord.buyerName}</td>
                    <td className="py-3 px-4 text-text-muted">{ord.sellerName}</td>
                    <td className="py-3 px-4 font-bold text-on-surface">₹{ord.totalAmount.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === "completed"
                            ? "bg-success-green/10 text-success-green border border-success-green/20"
                            : ord.status === "cancelled"
                            ? "bg-error-red/10 text-error-red border border-error-red/20"
                            : ord.status === "confirmed" || ord.status === "paid"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-surface-container text-on-surface border border-border-gray/50"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
