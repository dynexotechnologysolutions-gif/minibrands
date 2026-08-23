import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redis, getUserReservations } from "@/lib/redis";
import CartClient from "./CartClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shopping Cart | Velvet Lane",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CartPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    const cookieStore = await cookies();
    const guestCartId = cookieStore.get("mb-guest-cart")?.value;
    const cartItems = [];

    if (guestCartId) {
      const guestKeys = await redis.keys(`guest-reservation:${guestCartId}:*`);
      if (guestKeys.length > 0) {
        const pipeline = redis.pipeline();
        guestKeys.forEach((key) => pipeline.get(key));
        const results = await pipeline.exec();

        // Parse guest items and collect IDs for batch fetch
        const guestItems: Array<{
          productId: string;
          variantId: string;
          quantity: number;
          createdAt: string;
        }> = [];
        const productIds: string[] = [];
        const variantIds: string[] = [];

        for (const val of results) {
          if (!val) continue;
          const item = typeof val === "string" ? JSON.parse(val) : val;
          guestItems.push({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            createdAt: item.createdAt,
          });
          productIds.push(item.productId);
          variantIds.push(item.variantId);
        }

        // Batch fetch products and variants
        const uniqueProductIds = [...new Set(productIds)];
        const uniqueVariantIds = [...new Set(variantIds)];

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

  if (!userProfile) {
    redirect("/login?redirectTo=/cart");
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

  let sellerHref = "/login?role=seller";
  if (userProfile.role === "SELLER") {
    const ver = userProfile.seller?.verification;
    const isVerified =
      ver &&
      (ver.kycStatus === "auto_approved" || ver.kycStatus === "approved") &&
      ver.bankVerified;
    sellerHref = isVerified ? "/seller/dashboard" : "/seller/onboarding";
  }

  return (
    <CartClient
      initialItems={cartItems}
      userProfile={userProfile}
      cartCount={cartCount}
      sellerHref={sellerHref}
    />
  );
}
