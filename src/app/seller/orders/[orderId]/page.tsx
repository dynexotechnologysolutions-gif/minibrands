import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SellerOrderDetailClient from "./SellerOrderDetailClient";

import SellerLayout from "@/components/seller/SellerLayout";

export async function generateMetadata({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return {
    title: `Order ${orderId.slice(0, 8).toUpperCase()} | Seller Dashboard — Velvet Lane`,
  };
}

export default async function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login?role=seller");
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    include: { seller: { include: { verification: true } }, user: true },
  });

  if (!userProfile || userProfile.role !== "SELLER" || !userProfile.seller) {
    redirect("/login?role=seller");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
          },
          variant: true,
        },
      },
      address: true,
      buyer: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  if (!order || order.sellerId !== userProfile.seller.id) {
    notFound();
  }

  const serialized = {
    id: order.id,
    status: order.status,
    orderStatus: order.orderStatus,
    totalAmount: order.totalAmount,
    subtotal: order.subtotal,
    shipping: order.shipping,
    commissionAmount: order.commissionAmount,
    createdAt: order.createdAt.toISOString(),
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    icarryOrderId: order.icarryOrderId,
    icarryAwbNumber: order.icarryAwbNumber,
    icarryLabelUrl: order.icarryLabelUrl,
    trackingUrl: order.trackingUrl,
    escrowReleaseAt: order.escrowReleaseAt?.toISOString() ?? null,
    buyerName: order.buyer.user.name ?? "Unknown",
    address: {
      fullName: order.address.fullName,
      phone: order.address.phone,
      line1: order.address.line1,
      line2: order.address.line2 ?? null,
      city: order.address.city,
      pincode: order.address.pincode,
    },
    items: order.items.map((item) => ({
      id: item.id,
      name: item.product.name,
      size: item.variant.size,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      image: item.product.images[0]?.url ?? "",
    })),
  };

  const sellerInfo = {
    id: userProfile.seller.id,
    businessName: userProfile.seller.businessName,
    storeName: userProfile.seller.storeName,
    isKycVerified:
      userProfile.seller.verification?.kycStatus === "approved" ||
      userProfile.seller.verification?.kycStatus === "auto_approved",
    userEmail: userProfile.user.email,
  };

  return (
    <SellerLayout sellerInfo={sellerInfo}>
      <SellerOrderDetailClient
        order={serialized}
        sellerName={userProfile.seller.businessName}
      />
    </SellerLayout>
  );
}
