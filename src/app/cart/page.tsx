import React from "react";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redis, getUserReservations } from "@/lib/redis";
import { getRequestSessionAndProfile } from "@/lib/request-auth";
import CartClient from "./CartClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shopping Cart | MiniBrands",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CartPage() {
  const { session, userProfile, sellerHref } = await getRequestSessionAndProfile();

  if (!session || !session.user || !userProfile) {
    const cookieStore = await cookies();
    const guestCartId = cookieStore.get("mb-guest-cart")?.value;
    const cartItems = [];

    if (guestCartId) {
      // Use guest-cart hash for fast O(1) index lookup without keyspace scanning
      const cartData = await redis.hgetall(`guest-cart:${guestCartId}`);

      if (cartData && Object.keys(cartData).length > 0) {
        const variantIds = Object.keys(cartData);
        const pipeline = redis.pipeline();
        variantIds.forEach((vid) => pipeline.get(`guest-reservation:${guestCartId}:${vid}`));
        const results = await pipeline.exec();

        // Parse guest items and collect IDs for batch fetch
        const guestItems: Array<{
          productId: string;
          variantId: string;
          quantity: number;
          createdAt: string;
        }> = [];
        const productIds: string[] = [];
        const activeVariantIds: string[] = [];

        results.forEach((val, idx) => {
          if (!val) return;
          const item = typeof val === "string" ? JSON.parse(val) : val;
          const variantId = variantIds[idx];
          guestItems.push({
            productId: item.productId,
            variantId: item.variantId || variantId,
            quantity: item.quantity,
            createdAt: item.createdAt || new Date().toISOString(),
          });
          productIds.push(item.productId);
          activeVariantIds.push(item.variantId || variantId);
        });

        // Batch fetch products and variants
        const uniqueProductIds = [...new Set(productIds)];
        const uniqueVariantIds = [...new Set(activeVariantIds)];

        const [products, variants] = await Promise.all([
          uniqueProductIds.length > 0
            ? prisma.product.findMany({
                where: {
                  id: { in: uniqueProductIds },
                  isDeleted: false,
                  isPublished: true,
                },
                include: {
                  images: { orderBy: { sortOrder: "asc" } },
                  seller: true,
                },
              })
            : [],
          uniqueVariantIds.length > 0
            ? prisma.productVariant.findMany({
                where: { id: { in: uniqueVariantIds } },
              })
            : [],
        ]);

        const productMap = new Map(products.map((p) => [p.id, p]));
        const variantMap = new Map(variants.map((v) => [v.id, v]));

        for (const item of guestItems) {
          const product = productMap.get(item.productId);
          const variant = variantMap.get(item.variantId);
          if (!product || !variant) continue;

          cartItems.push({
            id: `${guestCartId}:${item.variantId}`,
            productId: product.id,
            variantId: variant.id,
            quantity: item.quantity,
            price: product.price,
            createdAt: item.createdAt,
            name: product.name,
            image: product.images[0]?.url || "/placeholder.jpg",
            sellerName: product.seller.businessName,
            sellerId: product.sellerId,
            size: variant.size,
          });
        }
      }
    }

    return (
      <main className="min-h-screen bg-background">
        <CartClient
          initialItems={cartItems}
          userProfile={null}
          cartCount={cartItems.reduce((acc, curr) => acc + curr.quantity, 0)}
          sellerHref="/login?role=seller"
        />
      </main>
    );
  }

  // Fetch active reservations
  const reservations = await getUserReservations(userProfile.id);

  // Batch fetch products and variants for all reservations
  const productIds = [...new Set(reservations.map((r) => r.productId).filter(Boolean))];
  const variantIds = [...new Set(reservations.map((r) => r.variantId).filter(Boolean))];

  const [products, variants] = await Promise.all([
    productIds.length > 0
      ? prisma.product.findMany({
          where: {
            id: { in: productIds },
            isDeleted: false,
            isPublished: true,
          },
          include: {
            images: { orderBy: { sortOrder: "asc" } },
            seller: true,
          },
        })
      : [],
    variantIds.length > 0
      ? prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
        })
      : [],
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  // Reconstruct cart items from maps
  const cartItems = [];
  for (const res of reservations) {
    const product = productMap.get(res.productId);
    const variant = variantMap.get(res.variantId);
    if (!product || !variant) continue;

    cartItems.push({
      id: res.id, // reservationId
      productId: res.productId,
      variantId: res.variantId,
      quantity: res.quantity,
      createdAt: res.createdAt,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url || "/placeholder.jpg",
      sellerName: product.seller.businessName,
      sellerId: product.sellerId,
      size: variant.size,
    });
  }

  const cartCount = reservations.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <CartClient
      initialItems={cartItems}
      userProfile={userProfile}
      cartCount={cartCount}
      sellerHref={sellerHref}
    />
  );
}
