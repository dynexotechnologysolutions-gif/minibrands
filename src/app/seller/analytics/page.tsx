import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SellerLayout from "@/components/seller/SellerLayout";
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, RotateCcw } from "lucide-react";

export const metadata = {
  title: "Sales Analytics | Seller Hub — Velvet Lane",
  description: "Track store revenue, conversion rate, orders, and sales trends.",
};

export default async function SellerAnalyticsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login?role=seller");
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      seller: {
        include: {
          verification: true,
        },
      },
    },
  });

  if (!userProfile || userProfile.role !== "SELLER" || !userProfile.seller) {
    redirect("/login?role=seller");
  }

  const seller = userProfile.seller;

  // Aggregate orders and revenue from database
  const orders = await prisma.order.findMany({
    where: { sellerId: seller.id },
    select: {
      totalAmount: true,
      status: true,
      createdAt: true,
    },
  });

  const totalRevenuePaise = orders
    .filter((o) => o.status === "paid" || o.status === "delivered" || o.status === "completed")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalOrdersCount = orders.length;
  const avgOrderValuePaise = totalOrdersCount > 0 ? totalRevenuePaise / totalOrdersCount : 0;

  const sellerInfo = {
    id: seller.id,
    businessName: seller.businessName,
    storeName: seller.storeName,
    isKycVerified: seller.verification?.kycStatus === "approved" || seller.verification?.kycStatus === "auto_approved",
    userEmail: userProfile.user.email,
  };

  return (
    <SellerLayout sellerInfo={sellerInfo}>
      {/* Title Header */}
      <div className="border-b border-border-gray/40 pb-md">
        <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface">
          Sales & Financial Analytics
        </h1>
        <p className="text-body-sm text-text-muted mt-1">
          Monitor your boutique revenue, average order values, and fulfillment metrics.
        </p>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-base">
        <div className="bg-surface-container-lowest border border-border-gray p-lg rounded-xl shadow-xs">
          <div className="flex justify-between items-start mb-sm">
            <span className="text-text-muted font-label-bold text-label-bold uppercase">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-success-green" />
          </div>
          <div className="text-3xl font-black text-on-surface">
            ₹{(totalRevenuePaise / 100).toLocaleString("en-IN")}
          </div>
          <p className="text-body-sm text-success-green mt-xs flex items-center gap-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Completed orders revenue</span>
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-border-gray p-lg rounded-xl shadow-xs">
          <div className="flex justify-between items-start mb-sm">
            <span className="text-text-muted font-label-bold text-label-bold uppercase">Total Orders</span>
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-black text-on-surface">
            {totalOrdersCount}
          </div>
          <p className="text-body-sm text-text-muted mt-xs">All time order count</p>
        </div>

        <div className="bg-surface-container-lowest border border-border-gray p-lg rounded-xl shadow-xs">
          <div className="flex justify-between items-start mb-sm">
            <span className="text-text-muted font-label-bold text-label-bold uppercase">Average Order Value</span>
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-black text-on-surface">
            ₹{(avgOrderValuePaise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-body-sm text-text-muted mt-xs">Per transaction average</p>
        </div>
      </div>
    </SellerLayout>
  );
}
