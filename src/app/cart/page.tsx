import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserReservations } from "@/lib/redis";
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
    redirect("/login?redirectTo=/cart");
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

  // Fetch database details for each reservation
  const cartItems = [];
  for (const res of reservations) {
    const product = await prisma.product.findUnique({
      where: { id: res.productId, isDeleted: false },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        seller: true,
        variants: {
          where: { id: res.variantId },
        },
      },
    });

    const variant = product?.variants[0];

    if (product && variant) {
      cartItems.push({
        id: res.id, // reservationId
        productId: res.productId,
        variantId: res.variantId,
        quantity: res.quantity,
        createdAt: res.createdAt,
        name: product.name,
        price: product.price,
        size: variant.size,
        image: product.images[0]?.url || "/placeholder.jpg",
        sellerName: product.seller.businessName,
        sellerId: product.sellerId,
      });
    }
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
