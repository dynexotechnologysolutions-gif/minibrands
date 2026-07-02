import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import ReturnWizardClient from "./ReturnWizardClient";

interface ReturnPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function BuyerReturnPage({ params }: ReturnPageProps) {
  const { orderId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect(`/login?redirectTo=/orders/${orderId}/return`);
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!userProfile) {
    redirect(`/login?redirectTo=/orders/${orderId}/return`);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
          variant: true,
        },
      },
      seller: true,
      returnRequest: true,
    },
  });

  if (!order || order.buyerId !== userProfile.id) {
    notFound();
  }

  // If already requested, redirect to tracking page
  if (order.returnRequest) {
    redirect(`/orders/${orderId}/return/track`);
  }

  const formattedOrder = {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    totalAmount: order.totalAmount,
    sellerName: order.seller.businessName,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      image: item.product.images[0]?.url || "/placeholder.jpg",
      size: item.variant.size,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      category: item.product.category,
    })),
  };

  return (
    <div className="min-h-screen bg-surface py-xl px-base max-w-4xl mx-auto">
      <ReturnWizardClient order={formattedOrder} />
    </div>
  );
}
