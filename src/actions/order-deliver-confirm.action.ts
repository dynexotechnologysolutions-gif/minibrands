"use server";

/**
 * order-deliver-confirm.action.ts — Buyer confirms delivery of their order.
 * Transition: shipped → delivered
 * Sets escrowReleaseAt = now() + 7 days to begin escrow countdown.
 */

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";
import { sendMessage, TEMPLATES } from "@/lib/whatsapp";
import { ActionResponse } from "@/actions/seller-register.action";

interface DeliverResult {
  escrowReleaseAt: string;
}

const ESCROW_WINDOW_DAYS = 7;

export async function confirmDeliveryAction(
  orderId: string
): Promise<ActionResponse<DeliverResult>> {
  try {
    // ── Auth: any authenticated user required ───────────────────────────────────
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in." } };
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return { success: false, error: { code: "FORBIDDEN", message: "User profile not found." } };
    }

    // ── Ownership + Status check + Update inside a single transaction ──────────
    const escrowReleaseAt = new Date(
      Date.now() + ESCROW_WINDOW_DAYS * 24 * 60 * 60 * 1000
    );

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          seller: {
            include: { userProfile: { include: { user: true } } },
          },
          buyer: { include: { user: true } },
        },
      });

      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (order.buyerId !== userProfile.id) throw new Error("FORBIDDEN");
      if (order.status !== "shipped") throw new Error(`INVALID_STATUS:${order.status}`);

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: "delivered",
          orderStatus: "delivered",
          escrowReleaseAt,
        },
        include: {
          seller: { include: { userProfile: { include: { user: true } } } },
          buyer: { include: { user: true } },
        },
      });
    });

    trackEvent(session.user.id, "delivery_confirmed", {
      orderId,
      buyerId: userProfile.id,
      escrowReleaseAt: escrowReleaseAt.toISOString(),
    });

    trackEvent(session.user.id, "escrow_countdown_started", {
      orderId,
      releaseAt: escrowReleaseAt.toISOString(),
      windowDays: ESCROW_WINDOW_DAYS,
    });

    // ── Non-blocking: WhatsApp to buyer + seller ───────────────────────────────
    const buyerName = updatedOrder.buyer.user.name?.split(" ")[0] ?? "Customer";
    const sellerName = updatedOrder.seller.businessName;
    const releaseFormatted = escrowReleaseAt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    void sendMessage(
      updatedOrder.buyer.user.email,
      TEMPLATES.DELIVERY_CONFIRMED,
      [buyerName, orderId.slice(0, 8), releaseFormatted]
    );

    void sendMessage(
      updatedOrder.seller.userProfile.user.email,
      TEMPLATES.DELIVERY_CONFIRMED,
      [sellerName, orderId.slice(0, 8), releaseFormatted]
    );

    return {
      success: true,
      data: { escrowReleaseAt: escrowReleaseAt.toISOString() },
    };
  } catch (err: any) {
    if (err.message === "ORDER_NOT_FOUND") {
      return { success: false, error: { code: "NOT_FOUND", message: "Order not found." } };
    }
    if (err.message === "FORBIDDEN") {
      return { success: false, error: { code: "FORBIDDEN", message: "You do not own this order." } };
    }
    if (err.message?.startsWith("INVALID_STATUS")) {
      const currentStatus = err.message.split(":")[1] ?? "unknown";
      return { success: false, error: { code: "INVALID_STATUS", message: `Order cannot be confirmed from status: ${currentStatus}. Only shipped orders can be marked as delivered.` } };
    }

    captureAndLogError(err, "confirmDelivery", { orderId });
    return { success: false, error: { code: "INTERNAL_ERROR", message: err.message || "Failed to confirm delivery." } };
  }
}
