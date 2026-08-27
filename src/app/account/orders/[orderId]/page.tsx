import React from "react";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserReservations } from "@/lib/redis";
import { getRequestSessionAndProfile } from "@/lib/request-auth";
import OrderDetailClient from "../../../orders/[orderId]/OrderDetailClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Details | MiniBrands",
  robots: {
    index: false,
    follow: false,
  },
};

interface OrderDetailPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const resolvedParams = await params;
  const orderId = resolvedParams.orderId;

  const { session, userProfile, sellerHref } = await getRequestSessionAndProfile();

  if (!session || !session.user || !userProfile) {
    redirect(`/login?redirectTo=/account/orders/${orderId}`);
  }

  // Query order details and active reservations in parallel
  const [order, allReservations] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        orderStatus: true,
        totalAmount: true,
        createdAt: true,
        razorpayOrderId: true,
        razorpayPaymentId: true,
        trackingUrl: true,
        icarryAwbNumber: true,
        escrowReleaseAt: true,
        guestShippingAddress: true,
        guestName: true,
        guestPhone: true,
        buyerId: true,
        seller: {
          select: {
            businessName: true,
          },
        },
        address: {
          select: {
            fullName: true,
            phone: true,
            line1: true,
            line2: true,
            city: true,
            pincode: true,
          },
        },
        review: {
          select: {
            id: true,
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
    }),
    getUserReservations(userProfile.id),
  ]);

  if (!order) {
    notFound();
  }

  // Strict ownership gate: only the buyer can view details
  if (order.buyerId !== userProfile.id) {
    redirect("/account/orders");
  }

  // Format order items for UI
  const formattedItems = order.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    name: item.product.name,
    size: item.variant.size,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    image: item.product.images[0]?.url || "/placeholder.jpg",
  }));

  const formattedOrder = {
    id: order.id,
    status: order.status,
    orderStatus: order.orderStatus,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    trackingUrl: order.trackingUrl,
    icarryAwbNumber: order.icarryAwbNumber,
    escrowReleaseAt: order.escrowReleaseAt ? order.escrowReleaseAt.toISOString() : null,
    guestShippingAddress: order.guestShippingAddress,
    guestName: order.guestName,
    guestPhone: order.guestPhone,
    sellerName: order.seller.businessName,
    hasReview: !!order.review,
    address: order.address
      ? {
          fullName: order.address.fullName,
          phone: order.address.phone,
          line1: order.address.line1,
          line2: order.address.line2,
          city: order.address.city,
          pincode: order.address.pincode,
        }
      : {
          fullName:
            (order.guestShippingAddress as { name?: string } | null)?.name ||
            order.guestName ||
            "Customer",
          phone:
            (order.guestShippingAddress as { phone?: string } | null)?.phone ||
            order.guestPhone ||
            "",
          line1:
            (order.guestShippingAddress as { line1?: string } | null)?.line1 || "",
          line2:
            (order.guestShippingAddress as { line2?: string } | null)?.line2 || null,
          city:
            (order.guestShippingAddress as { city?: string } | null)?.city || "",
          pincode:
            (order.guestShippingAddress as { postalCode?: string } | null)?.postalCode || "",
        },
    items: formattedItems,
    userProfileId: userProfile.id,
    firstProductId: order.items[0]?.productId,
  };

  const cartCount = allReservations.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <OrderDetailClient
      order={formattedOrder}
      userProfile={userProfile}
      cartCount={cartCount}
      sellerHref={sellerHref}
    />
  );
}
