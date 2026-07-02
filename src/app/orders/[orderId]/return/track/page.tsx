import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import ReturnTrackerClient from "./ReturnTrackerClient";

interface ReturnTrackerPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function BuyerReturnTrackerPage({ params }: ReturnTrackerPageProps) {
  const { orderId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect(`/login?redirectTo=/orders/${orderId}/return/track`);
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!userProfile) {
    redirect(`/login?redirectTo=/orders/${orderId}/return/track`);
  }

  const returnRequest = await prisma.returnRequest.findUnique({
    where: { orderId },
    include: {
      order: {
        include: {
          seller: true,
        },
      },
      items: {
        include: {
          orderItem: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
              variant: true,
            },
          },
        },
      },
      evidence: true,
      statusHistory: {
        orderBy: {
          createdAt: "asc",
        },
      },
      refund: true,
    },
  });

  if (!returnRequest) {
    redirect(`/orders/${orderId}/return`);
  }

  if (returnRequest.buyerId !== userProfile.id) {
    notFound();
  }

  const formattedReturn = {
    id: returnRequest.id,
    orderId: returnRequest.orderId,
    status: returnRequest.status,
    reason: returnRequest.reason,
    comment: returnRequest.comment,
    refundMethod: returnRequest.refundMethod,
    refundAmount: returnRequest.refundAmount,
    pickupCourier: returnRequest.pickupCourier,
    pickupTrackingId: returnRequest.pickupTrackingId,
    pickupDate: returnRequest.pickupDate ? returnRequest.pickupDate.toISOString() : null,
    inspectionNotes: returnRequest.inspectionNotes,
    inspectionResult: returnRequest.inspectionResult,
    createdAt: returnRequest.createdAt.toISOString(),
    sellerName: returnRequest.order.seller.businessName,
    items: returnRequest.items.map((item) => ({
      id: item.id,
      name: item.orderItem.product.name,
      image: item.orderItem.product.images[0]?.url || "/placeholder.jpg",
      size: item.orderItem.variant.size,
      quantity: item.quantity,
      unitPrice: item.orderItem.unitPrice,
    })),
    evidence: returnRequest.evidence.map((ev) => ({
      id: ev.id,
      url: ev.url,
      type: ev.type,
    })),
    history: returnRequest.statusHistory.map((h) => ({
      id: h.id,
      previousStatus: h.previousStatus,
      newStatus: h.newStatus,
      actorRole: h.actorRole,
      comment: h.comment,
      createdAt: h.createdAt.toISOString(),
    })),
    refund: returnRequest.refund
      ? {
          id: returnRequest.refund.id,
          razorpayRefundId: returnRequest.refund.razorpayRefundId,
          amount: returnRequest.refund.amount,
          status: returnRequest.refund.status,
          initiatedAt: returnRequest.refund.initiatedAt.toISOString(),
          processedAt: returnRequest.refund.processedAt ? returnRequest.refund.processedAt.toISOString() : null,
        }
      : null,
  };

  return (
    <div className="min-h-screen bg-surface py-xl px-base max-w-4xl mx-auto">
      <ReturnTrackerClient returnData={formattedReturn} />
    </div>
  );
}
