import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redis, getUserReservations } from "@/lib/redis";
import ProfileClient from "../../profile/ProfileClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Profile | Velvet Lane",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login?redirectTo=/account/profile");
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
      addresses: {
        where: {
          isDeleted: false,
        },
      },
    },
  });

  if (!userProfile) {
    redirect("/login?redirectTo=/account/profile");
  }

  // Calculate statistics
  const ordersCount = await prisma.order.count({
    where: { buyerId: userProfile.id },
  });

  const wishlistKey = `wishlist:${userProfile.id}`;
  const wishlistProductIds = await redis.smembers(wishlistKey);
  const wishlistCount = wishlistProductIds.length;

  // Load latest 4 wishlist products for preview
  let wishlistProducts: any[] = [];
  if (wishlistProductIds.length > 0) {
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
      .filter((p): p is any => !!p)
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.images[0]?.url || "/placeholder.jpg",
        variantId: p.variants[0]?.id || "",
      }));
  }

  // Load latest 3 orders placed by this buyer
  const recentOrders = await prisma.order.findMany({
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
  });

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
  const defaultAddress = userProfile.addresses.find((addr) => addr.isDefault) || null;

  // Redis cart count
  const allReservations = await getUserReservations(userProfile.id);
  const cartCount = allReservations.reduce((acc, curr) => acc + curr.quantity, 0);

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
