import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { redis, getUserReservations } from "@/lib/redis";
import { getRequestSessionAndProfile } from "@/lib/request-auth";
import ProfileClient from "../../profile/ProfileClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Profile | MiniBrands",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProfilePage() {
  const { session, userProfile, sellerHref } = await getRequestSessionAndProfile();

  if (!session || !session.user || !userProfile) {
    redirect("/login?redirectTo=/account/profile");
  }

  const wishlistKey = `wishlist:${userProfile.id}`;

  // Execute independent statistics, wishlist IDs, recent orders, and cart count queries in parallel
  const [ordersCount, wishlistProductIds, recentOrders, allReservations] = await Promise.all([
    prisma.order.count({
      where: { buyerId: userProfile.id },
    }),
    redis.smembers(wishlistKey),
    prisma.order.findMany({
      where: { buyerId: userProfile.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    getUserReservations(userProfile.id),
  ]);

  const wishlistCount = wishlistProductIds ? wishlistProductIds.length : 0;

  // Load latest 4 wishlist products for preview if IDs exist
  let wishlistProducts: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    variantId: string;
  }> = [];
  if (wishlistProductIds && wishlistProductIds.length > 0) {
    const products = await prisma.product.findMany({
      where: {
        id: { in: wishlistProductIds },
        isDeleted: false,
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    });
    wishlistProducts = wishlistProductIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.images[0]?.url || "/placeholder.jpg",
        variantId: p.variants[0]?.id || "",
      }));
  }

  const formattedOrders = recentOrders.map((order) => {
    const firstItem = order.items[0];
    return {
      id: order.id,
      status: order.status,
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt.toISOString(),
      productName: firstItem?.product?.name || "Multiple Items",
      productImage: firstItem?.product?.images[0]?.url || "/placeholder.jpg",
    };
  });

  // Load default address
  const defaultAddress = userProfile.addresses?.find((addr) => addr.isDefault) || null;

  // Cart count
  const cartCount = allReservations.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <ProfileClient
      userProfile={userProfile}
      ordersCount={ordersCount}
      wishlistCount={wishlistCount}
      wishlistProducts={wishlistProducts}
      recentOrders={formattedOrders}
      defaultAddress={defaultAddress}
      cartCount={cartCount}
      sellerHref={sellerHref}
    />
  );
}
