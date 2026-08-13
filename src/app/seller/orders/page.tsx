/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { validateSessionAndRole } from "@/lib/auth-services/guard";
import { RedirectService } from "@/lib/auth-services/redirect.service";
import { prisma } from "@/lib/prisma";
import SellerOrdersClient from "./SellerOrdersClient";

import SellerLayout from "@/components/seller/SellerLayout";

export const metadata = {
  title: "Orders | Seller Dashboard — Velvet Lane",
  description: "Manage and fulfil customer orders for your boutique on Velvet Lane.",
};

export default async function SellerOrdersPage() {
  const reqHeaders = await headers();
  const authResult = await validateSessionAndRole(reqHeaders, Role.SELLER);

  if (authResult.state === "NO_COOKIE" || authResult.state === "INVALID_SESSION") {
    redirect("/seller/login");
  }

  if (authResult.state === "EXPIRED_SESSION") {
    redirect("/session-expired?redirectTo=%2Fseller%2Forders");
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

  const orders = await prisma.order.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
      address: { select: { city: true, fullName: true } },
      buyer: { include: { user: { select: { name: true } } } },
    },
  });

  const serialized = orders.map((o) => ({
    id: o.id,
    status: o.status,
    orderStatus: o.orderStatus,
    totalAmount: o.totalAmount,
    createdAt: o.createdAt.toISOString(),
    buyerName: o.buyer?.user?.name ?? o.guestName ?? "Guest Buyer",
    city: o.address?.city ?? (o.guestShippingAddress as any)?.city ?? "",
    recipientName: o.address?.fullName ?? (o.guestShippingAddress as any)?.name ?? o.guestName ?? "",
    itemCount: o.items.length,
    firstItemName: o.items[0]?.product.name ?? "—",
    icarryAwbNumber: o.icarryAwbNumber ?? null,
    icarryLabelUrl: o.icarryLabelUrl ?? null,
    trackingUrl: o.trackingUrl ?? null,
  }));

  const sellerInfo = {
    id: seller.id,
    businessName: seller.businessName,
    storeName: seller.storeName,
    isKycVerified: seller.verification?.kycStatus === "approved" || seller.verification?.kycStatus === "auto_approved",
    userEmail: userProfile.user.email,
  };

  return (
    <SellerLayout sellerInfo={sellerInfo}>
      <SellerOrdersClient orders={serialized} sellerName={seller.businessName} />
    </SellerLayout>
  );
}
