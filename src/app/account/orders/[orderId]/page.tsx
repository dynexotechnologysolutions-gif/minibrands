import React from "react";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserReservations } from "@/lib/redis";
import OrderDetailClient from "../../../orders/[orderId]/OrderDetailClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Details | Velvet Lane",
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

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect(`/login?redirectTo=/account/orders/${orderId}`);
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      seller: { include: { verification: true } },
    },
  });

  if (!userProfile) {
    redirect(`/login?redirectTo=/account/orders/${orderId}`);
  }

  // Query order details with relations (selective fields)
  const order = await prisma.order.findUnique({
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
  });

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
    sellerName: order.seller.businessName,
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
          fullName: (order.guestShippingAddress as any)?.name || order.guestName || "Customer",
          phone: (order.guestShippingAddress as any)?.phone || order.guestPhone || "",
          line1: (order.guestShippingAddress as any)?.line1 || "",
          line2: (order.guestShippingAddress as any)?.line2 || "",
          city: (order.guestShippingAddress as any)?.city || "",
          pincode: (order.guestShippingAddress as any)?.postalCode || "",
        },
    items: formattedItems,
    // Epic 4 fields
    trackingUrl: order.trackingUrl,
    icarryAwbNumber: order.icarryAwbNumber,
    escrowReleaseAt: order.escrowReleaseAt ? order.escrowReleaseAt.toISOString() : null,
    hasReview: !!order.review,
    userProfileId: userProfile.id,
    firstProductId: order.items[0]?.productId,
  };


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
    <OrderDetailClient
      order={formattedOrder}
      userProfile={userProfile}
      cartCount={cartCount}
      sellerHref={sellerHref}
    />
  );
}
