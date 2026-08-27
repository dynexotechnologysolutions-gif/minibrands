import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserReservations } from "@/lib/redis";
import { getRequestSessionAndProfile } from "@/lib/request-auth";
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
  const { session, userProfile, sellerHref } = await getRequestSessionAndProfile();

  if (!session || !session.user || !userProfile) {
    redirect("/login?redirectTo=/account/orders");
  }

  // Fetch orders and cart count in parallel
  const [orders, allReservations] = await Promise.all([
    prisma.order.findMany({
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
    }),
    getUserReservations(userProfile.id),
  ]);

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

  const cartCount = allReservations.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <OrdersClient
      initialOrders={formattedOrders}
      userProfile={userProfile}
      cartCount={cartCount}
      sellerHref={sellerHref}
    />
  );
}
