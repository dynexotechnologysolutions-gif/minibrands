import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { Role } from "@prisma/client";
import { validateSessionAndRole } from "@/lib/auth-services/guard";
import { RedirectService } from "@/lib/auth-services/redirect.service";
import { prisma } from "@/lib/prisma";
import SellerLayout from "@/components/seller/SellerLayout";
import SellerKpiGrid from "@/components/seller/SellerKpiGrid";
import { 
  Package, 
  ShoppingBag, 
  RotateCcw, 
  ShieldCheck, 
  Plus, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Award
} from "lucide-react";

export const metadata = {
  title: "Seller Hub Dashboard | MiniBrands",
  description: "Merchant overview of catalog stock, sales orders, returns, and store performance.",
};

export default async function SellerDashboardPage() {
  const reqHeaders = await headers();
  const authResult = await validateSessionAndRole(reqHeaders, Role.SELLER);

  // Handle State Machine Redirection Rules
  if (authResult.state === "NO_COOKIE" || authResult.state === "INVALID_SESSION") {
    redirect("/seller/login");
  }

  if (authResult.state === "EXPIRED_SESSION") {
    redirect("/session-expired?redirectTo=%2Fseller%2Fdashboard");
  }

  if (authResult.state === "ROLE_MISMATCH") {
    const userRole = authResult.userProfile?.role;
    const safeUrl = RedirectService.getFallbackForRole(userRole);
    redirect(safeUrl);
  }

  if (authResult.state === "UNAVAILABLE") {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4 bg-slate-800 p-8 rounded-3xl border border-slate-700">
          <h2 className="text-xl font-bold text-red-400">Authentication Service Offline</h2>
          <p className="text-sm text-slate-300">We are unable to verify your session at this moment. Please refresh the page or try again later.</p>
        </div>
      </div>
    );
  }

  const userProfile = authResult.userProfile;
  const seller = userProfile?.seller;

  if (!seller) {
    redirect("/seller/onboarding");
  }

  // Redirect DRAFT status to onboarding
  if (seller.status === "DRAFT") {
    redirect("/seller/onboarding");
  }

  const verification = seller.verification;

  // Parallel database queries for counts and stats
  const [
    totalOrdersCount,
    newOrdersCount,
    returnsCount,
    recentOrders,
    productsCount,
    totalVariantItems,
    outOfStockCount,
    lowStockCount,
  ] = await Promise.all([
    prisma.order.count({ where: { sellerId: seller.id } }),
    prisma.order.count({ where: { sellerId: seller.id, status: "paid" } }),
    prisma.returnRequest.count({ where: { order: { sellerId: seller.id } } }),
    prisma.order.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        buyer: { include: { user: true } },
        items: { include: { product: true } },
      },
    }),
    prisma.product.count({ where: { sellerId: seller.id, isDeleted: false } }),
    prisma.productVariant.count({
      where: {
        product: { sellerId: seller.id, isDeleted: false }
      }
    }),
    prisma.productVariant.count({
      where: {
        product: { sellerId: seller.id, isDeleted: false },
        stockCount: 0
      }
    }),
    prisma.productVariant.count({
      where: {
        product: { sellerId: seller.id, isDeleted: false },
        stockCount: { gt: 0, lte: 10 }
      }
    }),
  ]);

  const healthyStockCount = totalVariantItems - outOfStockCount - lowStockCount;

  const kpiData = {
    totalItems: totalVariantItems,
    healthyStock: healthyStockCount,
    lowStock: lowStockCount,
    outOfStock: outOfStockCount,
  };

  const sellerInfo = {
    id: seller.id,
    businessName: seller.businessName,
    storeName: seller.storeName,
    isKycVerified: seller.status === "APPROVED",
    userEmail: userProfile.user.email,
  };

  return (
    <SellerLayout sellerInfo={sellerInfo}>
      {/* Dashboard Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-base border-b border-border-gray/40 pb-md">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Welcome back, {seller.businessName} 👋
          </h1>
          <p className="text-text-muted text-body-sm mt-1">
            Category: <span className="font-semibold text-on-surface">{seller.category}</span> &bull; Location: <span className="font-semibold text-on-surface">{seller.city}</span>
          </p>
        </div>

        <div className="flex items-center gap-sm">
          <Link
            href="/seller/products/new"
            className="px-lg py-sm bg-primary text-on-primary font-bold text-body-sm rounded-lg hover:opacity-90 transition-all flex items-center gap-xs shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Verification Status Banners */}
      {seller.status !== "APPROVED" && (
        <div className="my-base">
          {seller.status === "PENDING_VERIFICATION" && (
            <div className="p-base bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-sm text-amber-900 shadow-sm">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-body-md text-amber-950 flex items-center gap-2">
                  <span>Verification Pending</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 border border-amber-300 text-amber-800 uppercase">
                    Under Review
                  </span>
                </h3>
                <p className="text-body-sm text-amber-800 mt-1">
                  Your verification has been submitted successfully. You can continue adding products while our team reviews your documents. Products will become visible after approval.
                </p>
              </div>
            </div>
          )}

          {seller.status === "REJECTED" && (
            <div className="p-base bg-red-50 border border-red-200 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-base text-red-900 shadow-sm">
              <div className="flex items-start gap-sm">
                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-body-md text-red-950 flex items-center gap-2">
                    <span>Verification Rejected</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 border border-red-300 text-red-800 uppercase">
                      Rejected
                    </span>
                  </h3>
                  <p className="text-body-sm text-red-700 mt-1">
                    {seller.adminNotes || "Identity document verification failed. Please review your details and resubmit."}
                  </p>
                </div>
              </div>
              <Link
                href="/seller/onboarding"
                className="px-md py-sm bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-all shrink-0 cursor-pointer"
              >
                Resubmit Verification
              </Link>
            </div>
          )}

          {seller.status === "SUSPENDED" && (
            <div className="p-base bg-red-950 border border-red-800 rounded-xl flex items-start gap-sm text-red-100 shadow-sm">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-body-md text-white flex items-center gap-2">
                  <span>Account Suspended</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900 border border-red-700 text-red-100 uppercase">
                    Suspended
                  </span>
                </h3>
                <p className="text-body-sm text-red-200 mt-1">
                  Your seller account has been suspended by the administrator. Reason: {userProfile.suspendedReason || "Violation of platform policies."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary KPI Cards Grid */}
      <SellerKpiGrid data={kpiData} />

      {/* Quick Action Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-base">
        <Link
          href="/seller/products"
          className="bg-surface-container-lowest border border-border-gray hover:border-primary rounded-xl p-base shadow-xs transition-all flex justify-between items-start group"
        >
          <div className="space-y-sm">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-body-md text-on-surface group-hover:text-primary transition-colors">
                Product Catalog ({productsCount})
              </h3>
              <p className="text-body-sm text-text-muted mt-0.5">
                Manage size variants, stock counts & publish status.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors mt-1" />
        </Link>

        <Link
          href="/seller/orders"
          className="bg-surface-container-lowest border border-border-gray hover:border-primary rounded-xl p-base shadow-xs transition-all flex justify-between items-start group"
        >
          <div className="space-y-sm">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-body-md text-on-surface group-hover:text-primary transition-colors">
                Customer Orders ({totalOrdersCount})
              </h3>
              <p className="text-body-sm text-text-muted mt-0.5">
                {newOrdersCount} new paid orders awaiting fulfillment.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors mt-1" />
        </Link>

        <Link
          href="/seller/returns"
          className="bg-surface-container-lowest border border-border-gray hover:border-primary rounded-xl p-base shadow-xs transition-all flex justify-between items-start group"
        >
          <div className="space-y-sm">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-body-md text-on-surface group-hover:text-primary transition-colors">
                Returns & RMA ({returnsCount})
              </h3>
              <p className="text-body-sm text-text-muted mt-0.5">
                Inspect return requests & process Razorpay refunds.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors mt-1" />
        </Link>
      </div>

      {/* Recent Orders Preview Table */}
      <div className="bg-surface-container-lowest border border-border-gray rounded-xl p-base md:p-lg space-y-md shadow-xs">
        <div className="flex justify-between items-center border-b border-border-gray/40 pb-sm">
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Recent Customer Orders</h2>
            <p className="text-body-sm text-text-muted">Latest purchases for your store items.</p>
          </div>
          <Link href="/seller/orders" className="text-body-sm font-bold text-primary hover:underline flex items-center gap-xs">
            <span>View All Orders</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-lg text-center text-text-muted font-body-md">
            No recent customer orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border-gray text-secondary font-bold">
                  <th className="py-xs px-sm">Order ID</th>
                  <th className="py-xs px-sm">Buyer</th>
                  <th className="py-xs px-sm">Amount</th>
                  <th className="py-xs px-sm">Status</th>
                  <th className="py-xs px-sm text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray/30">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-container-low/50">
                    <td className="py-sm px-sm font-mono font-bold text-primary">#{order.id.slice(0, 8)}</td>
                    <td className="py-sm px-sm font-medium">{order.buyer?.user?.name || "Buyer"}</td>
                    <td className="py-sm px-sm font-bold text-on-surface">₹{(order.totalAmount / 100).toLocaleString("en-IN")}</td>
                    <td className="py-sm px-sm">
                      <span className="px-xs py-0.5 rounded bg-surface-container font-bold text-[10px] uppercase text-primary border border-border-gray">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-sm px-sm text-right text-text-muted text-xs">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
