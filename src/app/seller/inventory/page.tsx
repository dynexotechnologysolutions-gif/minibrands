import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SellerLayout from "@/components/seller/SellerLayout";
import SellerKpiGrid from "@/components/seller/SellerKpiGrid";
import SellerInventoryTable from "@/components/seller/SellerInventoryTable";

export const metadata = {
  title: "Inventory Management | Velvet Lane Seller Hub",
  description: "Monitor stock levels, reorder alerts, and manage variant inventory.",
};

export default async function SellerInventoryPage() {
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
            include: {
              images: { orderBy: { sortOrder: "asc" } },
              variants: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!userProfile || userProfile.role !== "SELLER" || !userProfile.seller) {
    redirect("/login?role=seller");
  }

  const seller = userProfile.seller;
  const products = seller.products || [];

  // Flatten product variants into inventory items
  const inventoryItems: any[] = [];
  let healthyStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  products.forEach((product) => {
    product.variants.forEach((v) => {
      if (v.stockCount === 0) outOfStockCount++;
      else if (v.stockCount <= 10) lowStockCount++;
      else healthyStockCount++;

      inventoryItems.push({
        id: product.id,
        name: product.name,
        sku: `${product.name.slice(0, 3).toUpperCase()}-${v.size.toUpperCase()}-${product.id.slice(0, 4)}`,
        image: product.images[0]?.url || "/placeholder.jpg",
        variantId: v.id,
        variantSize: v.size,
        stockCount: v.stockCount,
        price: product.price,
        isPublished: product.isPublished,
        category: product.category,
        updatedAt: product.updatedAt.toISOString(),
      });
    });
  });

  const kpiData = {
    totalItems: inventoryItems.length,
    healthyStock: healthyStockCount,
    lowStock: lowStockCount,
    outOfStock: outOfStockCount,
  };

  const sellerInfo = {
    id: seller.id,
    businessName: seller.businessName,
    storeName: seller.storeName,
    isKycVerified: seller.verification?.kycStatus === "approved" || seller.verification?.kycStatus === "auto_approved",
    userEmail: userProfile.user.email,
  };

  return (
    <SellerLayout sellerInfo={sellerInfo}>
      {/* Page Title & Header Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-base">
        <div>
          <h2 className="font-headline-md text-headline-sm md:text-headline-md text-on-surface font-extrabold tracking-tight">
            Inventory Management
          </h2>
          <p className="text-body-sm md:text-body-md text-text-muted mt-1">
            Monitor stock levels and manage product variants in real time.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <SellerKpiGrid data={kpiData} />

      {/* Interactive Inventory Table */}
      <SellerInventoryTable items={inventoryItems} />
    </SellerLayout>
  );
}
