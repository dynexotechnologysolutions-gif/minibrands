import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import AdminReturnConsoleClient from "./AdminReturnConsoleClient";

export default async function AdminReturnConsolePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login?role=admin");
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!userProfile || userProfile.role !== "ADMIN") {
    redirect("/");
  }

  const allReturns = await prisma.returnRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      buyer: {
        include: {
          user: true,
        },
      },
      order: {
        include: {
          seller: true,
        },
      },
      items: {
        include: {
          orderItem: {
            include: {
              product: true,
            },
          },
        },
      },
      refund: true,
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Calculate System Return Analytics Metrics
  const totalReturns = allReturns.length;
  const totalRefundedAmount = allReturns
    .filter((r) => r.status === "REFUNDED" || r.status === "RETURN_COMPLETED")
    .reduce((sum, r) => sum + r.refundAmount, 0);

  const pendingInspections = allReturns.filter(
    (r) => r.status === "DELIVERED_TO_SELLER" || r.status === "UNDER_INSPECTION"
  ).length;

  const activeDisputes = allReturns.filter(
    (r) => r.status === "DISPUTED" || r.status === "ESCALATED"
  ).length;

  const formattedReturns = allReturns.map((r) => ({
    id: r.id,
    orderId: r.orderId,
    buyerName: r.buyer.user.name || "Buyer",
    buyerEmail: r.buyer.user.email,
    buyerAbuseScore: r.buyer.abuseScore,
    sellerName: r.order.seller.businessName,
    status: r.status,
    reason: r.reason,
    comment: r.comment,
    refundAmount: r.refundAmount,
    createdAt: r.createdAt.toISOString(),
    refund: r.refund
      ? {
          id: r.refund.id,
          razorpayRefundId: r.refund.razorpayRefundId,
          status: r.refund.status,
        }
      : null,
  }));

  const metrics = {
    totalReturns,
    totalRefundedAmount,
    pendingInspections,
    activeDisputes,
  };

  return (
    <div className="min-h-screen bg-surface py-xl px-base max-w-7xl mx-auto">
      <AdminReturnConsoleClient returns={formattedReturns} metrics={metrics} />
    </div>
  );
}
