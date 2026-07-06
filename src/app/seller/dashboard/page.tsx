import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
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
  title: "Seller Hub Dashboard | Velvet Lane",
  description: "Merchant overview of catalog stock, sales orders, returns, and store performance.",
};

export default async function SellerDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login?role=seller");
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      seller: {
        include: {
          verification: true,
          products: {
            where: { isDeleted: false },
            include: { variants: true },
          },
        },
      },
    },
  });

  if (!userProfile || userProfile.role !== "SELLER" || !userProfile.seller) {
    redirect("/login?role=seller");
  }

  const seller = userProfile.seller;
  const verification = seller.verification;
  const products = seller.products || [];

  // Parallel database queries for real counts
  const [totalOrdersCount, newOrdersCount, returnsCount, recentOrders] = await Promise.all([
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
  ]);

  // Inventory stats calculation
  let totalVariantItems = 0;
  let healthyStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  products.forEach((product) => {
    product.variants.forEach((v) => {
      totalVariantItems++;
      if (v.stockCount === 0) outOfStockCount++;
      else if (v.stockCount <= 10) lowStockCount++;
      else healthyStockCount++;
    });
  });

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
    isKycVerified: verification?.kycStatus === "approved" || verification?.kycStatus === "auto_approved",
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
                Product Catalog ({products.length})
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
