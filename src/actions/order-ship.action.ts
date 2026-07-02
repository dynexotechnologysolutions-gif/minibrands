"use server";

/**
 * order-ship.action.ts — Seller marks an order as shipped.
 * Transition: confirmed → shipped
 * Optionally accepts AWB override (manual input from seller).
 */

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";
import { sendMessage, TEMPLATES } from "@/lib/whatsapp";
import { getTrackingUrl } from "@/lib/icarry";
import { ActionResponse } from "@/actions/seller-register.action";

interface ShipResult {
  trackingUrl?: string;
  awbNumber?: string;
}

export async function shipOrderAction(
  orderId: string,
  trackingIdOverride?: string
): Promise<ActionResponse<ShipResult>> {
  try {
    // ── Auth: SELLER role required ──────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in." } };
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: { seller: true },
    });

    if (!userProfile || userProfile.role !== "SELLER" || !userProfile.seller) {
      return { success: false, error: { code: "FORBIDDEN", message: "Only sellers can ship orders." } };
    }

    // ── Ownership + Status check + Update inside a single transaction ──────────
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { buyer: { include: { user: true } } },
      });

      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (order.sellerId !== userProfile.seller!.id) throw new Error("FORBIDDEN");
      if (order.status !== "confirmed") throw new Error(`INVALID_STATUS:${order.status}`);

      const awbNumber = trackingIdOverride?.trim() || order.icarryAwbNumber;
      const trackingUrl = awbNumber ? getTrackingUrl(awbNumber) : null;

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: "shipped",
          orderStatus: "shipped",
          ...(trackingIdOverride?.trim() && {
            icarryAwbNumber: trackingIdOverride.trim(),
            trackingUrl,
          }),
        },
        include: { buyer: { include: { user: true } } },
      });
    });

    const awbNumber = trackingIdOverride?.trim() || updatedOrder.icarryAwbNumber;
    const trackingUrl = awbNumber ? getTrackingUrl(awbNumber) : undefined;

    trackEvent(session.user.id, "shipment_created", {
      orderId,
      sellerId: userProfile.seller.id,
      hasTrackingOverride: Boolean(trackingIdOverride),
    });

    // ── Non-blocking: WhatsApp notification to buyer ───────────────────────────
    void sendMessage(
      updatedOrder.buyer.user.email,
      TEMPLATES.ORDER_SHIPPED,
      [
        updatedOrder.buyer.user.name?.split(" ")[0] ?? "Customer",
        orderId.slice(0, 8),
        trackingUrl ?? "Track your package in the app",
      ]
    );

    return {
      success: true,
      data: {
        trackingUrl: trackingUrl ?? undefined,
        awbNumber: awbNumber ?? undefined,
      },
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
      return { success: false, error: { code: "INVALID_STATUS", message: `Order cannot be shipped from status: ${currentStatus}.` } };
    }

    captureAndLogError(err, "orderShip", { orderId });
    return { success: false, error: { code: "INTERNAL_ERROR", message: err.message || "Failed to ship order." } };
  }
}
