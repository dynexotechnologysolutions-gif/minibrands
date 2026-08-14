import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { validateSessionAndRole } from "@/lib/auth-services/guard";
import { RedirectService } from "@/lib/auth-services/redirect.service";
import SellerReturnQueueClient from "./SellerReturnQueueClient";

import SellerLayout from "@/components/seller/SellerLayout";

export default async function SellerReturnQueuePage() {
  const reqHeaders = await headers();
  const authResult = await validateSessionAndRole(reqHeaders, Role.SELLER);

  if (authResult.state === "NO_COOKIE" || authResult.state === "INVALID_SESSION") {
    redirect("/seller/login");
  }

  if (authResult.state === "EXPIRED_SESSION") {
    redirect("/session-expired?redirectTo=%2Fseller%2Freturns");
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

  const sellerId = seller.id;

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

  const sellerInfo = {
    id: seller.id,
    businessName: seller.businessName,
    storeName: seller.storeName,
    isKycVerified: seller.verification?.kycStatus === "approved" || seller.verification?.kycStatus === "auto_approved",
    userEmail: userProfile.user.email,
  };

  return (
    <SellerLayout sellerInfo={sellerInfo}>
      <SellerReturnQueueClient returns={formattedReturns} />
    </SellerLayout>
  );
}
