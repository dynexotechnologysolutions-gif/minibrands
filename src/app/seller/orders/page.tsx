import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SellerOrdersClient from "./SellerOrdersClient";

import SellerLayout from "@/components/seller/SellerLayout";

export const metadata = {
  title: "Orders | Seller Dashboard — Velvet Lane",
  description: "Manage and fulfil customer orders for your boutique on Velvet Lane.",
};

export default async function SellerOrdersPage() {
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

  const seller = userProfile.seller;

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
    buyerName: o.buyer.user.name ?? "Unknown",
    city: o.address.city,
    recipientName: o.address.fullName,
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
