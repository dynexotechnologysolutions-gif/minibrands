/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { validateSessionAndRole } from "@/lib/auth-services/guard";
import { RedirectService } from "@/lib/auth-services/redirect.service";
import SellerOrderDetailClient from "./SellerOrderDetailClient";

import SellerLayout from "@/components/seller/SellerLayout";

export async function generateMetadata({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return {
    title: `Order ${orderId.slice(0, 8).toUpperCase()} | Seller Dashboard — MiniBrands`,
  };
}

export default async function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const reqHeaders = await headers();
  const authResult = await validateSessionAndRole(reqHeaders, Role.SELLER);

  if (authResult.state === "NO_COOKIE" || authResult.state === "INVALID_SESSION") {
    redirect("/seller/login");
  }

  if (authResult.state === "EXPIRED_SESSION") {
    redirect(`/session-expired?redirectTo=%2Fseller%2Forders%2F${orderId}`);
  }

  if (authResult.state === "ROLE_MISMATCH") {
    const userRole = authResult.userProfile?.role;
    const safeUrl = RedirectService.getFallbackForRole(userRole);
    redirect(safeUrl);
  }

  const userProfile = authResult.userProfile!;
  const seller = userProfile.seller;

  if (!seller || seller.status === "DRAFT") {
    redirect("/seller/onboarding");
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
    buyerName: order.buyer?.user?.name ?? order.guestName ?? "Guest Buyer",
    address: order.address
      ? {
          fullName: order.address.fullName,
          phone: order.address.phone,
          line1: order.address.line1,
          line2: order.address.line2 ?? null,
          city: order.address.city,
          pincode: order.address.pincode,
        }
      : {
          fullName: (order.guestShippingAddress as any)?.name || order.guestName || "Customer",
          phone: (order.guestShippingAddress as any)?.phone || order.guestPhone || "",
          line1: (order.guestShippingAddress as any)?.line1 || "",
          line2: (order.guestShippingAddress as any)?.line2 || null,
          city: (order.guestShippingAddress as any)?.city || "",
          pincode: (order.guestShippingAddress as any)?.postalCode || "",
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
