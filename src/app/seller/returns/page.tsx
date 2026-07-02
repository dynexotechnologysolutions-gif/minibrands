import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import SellerReturnQueueClient from "./SellerReturnQueueClient";

export default async function SellerReturnQueuePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login?role=seller");
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      seller: true,
    },
  });

  if (!userProfile || userProfile.role !== "SELLER" || !userProfile.seller) {
    redirect("/seller/dashboard");
  }

  const sellerId = userProfile.seller.id;

  const returnRequests = await prisma.returnRequest.findMany({
    where: {
      order: {
        sellerId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      buyer: {
        include: {
          user: true,
        },
      },
      order: true,
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

  const formattedReturns = returnRequests.map((r) => ({
    id: r.id,
    orderId: r.orderId,
    buyerName: r.buyer.user.name || "Buyer",
    buyerEmail: r.buyer.user.email,
    buyerAbuseScore: r.buyer.abuseScore,
    status: r.status,
    reason: r.reason,
    comment: r.comment,
    refundMethod: r.refundMethod,
    refundAmount: r.refundAmount,
    pickupCourier: r.pickupCourier,
    pickupTrackingId: r.pickupTrackingId,
    pickupDate: r.pickupDate ? r.pickupDate.toISOString() : null,
    inspectionNotes: r.inspectionNotes,
    inspectionResult: r.inspectionResult,
    restockDecision: r.restockDecision,
    createdAt: r.createdAt.toISOString(),
    items: r.items.map((i) => ({
      id: i.id,
      name: i.orderItem.product.name,
      image: i.orderItem.product.images[0]?.url || "/placeholder.jpg",
      size: i.orderItem.variant.size,
      quantity: i.quantity,
      unitPrice: i.orderItem.unitPrice,
    })),
    evidence: r.evidence.map((ev) => ({
      id: ev.id,
      url: ev.url,
      type: ev.type,
    })),
    history: r.statusHistory.map((h) => ({
      id: h.id,
      previousStatus: h.previousStatus,
      newStatus: h.newStatus,
      actorRole: h.actorRole,
      comment: h.comment,
      createdAt: h.createdAt.toISOString(),
    })),
    refund: r.refund
      ? {
          id: r.refund.id,
          razorpayRefundId: r.refund.razorpayRefundId,
          amount: r.refund.amount,
          status: r.refund.status,
        }
      : null,
  }));

  return (
    <div className="min-h-screen bg-surface py-xl px-base max-w-6xl mx-auto">
      <SellerReturnQueueClient returns={formattedReturns} />
    </div>
  );
}
