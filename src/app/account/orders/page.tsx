import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserReservations } from "@/lib/redis";
import OrdersClient from "../../orders/OrdersClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Orders | MiniBrands",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OrdersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login?redirectTo=/account/orders");
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      seller: { include: { verification: true } },
    },
  });

  if (!userProfile) {
    redirect("/login?redirectTo=/account/orders");
  }

  // Fetch all orders placed by this buyer (capped at 100 for safety)
  const orders = await prisma.order.findMany({
    where: { buyerId: userProfile.id },
    select: {
      id: true,
      status: true,
      orderStatus: true,
      totalAmount: true,
      createdAt: true,
      seller: {
        select: {
          businessName: true,
        },
      },
      items: {
        select: {
          id: true,
          productId: true,
          variantId: true,
          unitPrice: true,
          quantity: true,
          product: {
            select: {
              name: true,
              images: {
                take: 1,
                orderBy: { sortOrder: "asc" },
                select: {
                  url: true,
                },
              },
            },
          },
          variant: {
            select: {
              size: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const formattedOrders = orders.map((order) => ({
    id: order.id,
    status: order.status,
    orderStatus: order.orderStatus,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
    sellerName: order.seller.businessName,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      price: item.unitPrice,
      quantity: item.quantity,
      image: item.product.images[0]?.url || "/placeholder.jpg",
      size: item.variant.size,
    })),
  }));

  // Fetch cart count from Redis
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
    <OrdersClient
      initialOrders={formattedOrders}
      userProfile={userProfile}
      cartCount={cartCount}
      sellerHref={sellerHref}
    />
  );
}
