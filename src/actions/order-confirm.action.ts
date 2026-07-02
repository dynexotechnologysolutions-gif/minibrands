"use server";

/**
 * order-confirm.action.ts — Seller confirms a paid order.
 * Transition: paid → confirmed
 * Non-blocking iCarry shipment creation after the DB commit.
 */

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";
import { sendMessage, TEMPLATES } from "@/lib/whatsapp";
import { createShipment, getLabelUrl, getTrackingUrl, ICarryShipmentError } from "@/lib/icarry";
import { ActionResponse } from "@/actions/seller-register.action";

interface ConfirmResult {
  icarryOrderId?: string;
  awbNumber?: string;
  labelUrl?: string;
  trackingUrl?: string;
}

export async function confirmOrderAction(
  orderId: string
): Promise<ActionResponse<ConfirmResult>> {
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
      return { success: false, error: { code: "FORBIDDEN", message: "Only sellers can confirm orders." } };
    }

    // ── Ownership + Status check inside a transaction ──────────────────────────
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          address: true,
          buyer: { include: { user: true } },
        },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (order.sellerId !== userProfile.seller!.id) {
        throw new Error("FORBIDDEN");
      }

      if (order.status !== "paid") {
        throw new Error(`INVALID_STATUS:${order.status}`);
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: "confirmed", orderStatus: "confirmed" },
        include: {
          address: true,
          buyer: { include: { user: true } },
        },
      });
    });

    trackEvent(session.user.id, "order_confirmed", {
      orderId,
      sellerId: userProfile.seller.id,
    });

    // ── Non-blocking: WhatsApp notification to buyer ───────────────────────────
    void sendMessage(
      updatedOrder.buyer.user.email,
      TEMPLATES.ORDER_CONFIRMED,
      [updatedOrder.buyer.user.name?.split(" ")[0] ?? "Customer", orderId.slice(0, 8)]
    );

    // ── Non-blocking: iCarry shipment creation ─────────────────────────────────
    const result: ConfirmResult = {};

    try {
      const shipment = await createShipment({
        id: orderId,
        address: {
          fullName: updatedOrder.address.fullName,
          phone: updatedOrder.address.phone,
          line1: updatedOrder.address.line1,
          line2: updatedOrder.address.line2,
          city: updatedOrder.address.city,
          pincode: updatedOrder.address.pincode,
        },
      });

      result.icarryOrderId = shipment.icarryOrderId;
      result.awbNumber = shipment.awbNumber;
      result.trackingUrl = getTrackingUrl(shipment.awbNumber);

      // Non-fatal: get label URL
      try {
        result.labelUrl = await getLabelUrl(shipment.icarryOrderId);
      } catch (labelErr) {
        console.warn(`[OrderConfirm] Label URL retrieval failed for order ${orderId}. Non-fatal.`);
      }

      // Update order with iCarry fields
      await prisma.order.update({
        where: { id: orderId },
        data: {
          icarryOrderId: result.icarryOrderId,
          icarryAwbNumber: result.awbNumber,
          icarryLabelUrl: result.labelUrl ?? null,
          trackingUrl: result.trackingUrl,
        },
      });

      console.log(`[OrderConfirm] iCarry shipment booked for order ${orderId}. AWB: ${result.awbNumber}`);
    } catch (icarryErr: any) {
      // iCarry is non-blocking: DB confirm is already committed. Log + Sentry only.
      console.warn(
        `[OrderConfirm] iCarry shipment failed for order ${orderId}: ${icarryErr.message}. Order is confirmed in DB.`
      );
      captureAndLogError(icarryErr, "orderConfirm.icarryFailed", { orderId });
    }

    return { success: true, data: result };
  } catch (err: any) {
    if (err.message === "ORDER_NOT_FOUND") {
      return { success: false, error: { code: "NOT_FOUND", message: "Order not found." } };
    }
    if (err.message === "FORBIDDEN") {
      return { success: false, error: { code: "FORBIDDEN", message: "You do not own this order." } };
    }
    if (err.message?.startsWith("INVALID_STATUS")) {
      const currentStatus = err.message.split(":")[1] ?? "unknown";
      return { success: false, error: { code: "INVALID_STATUS", message: `Order cannot be confirmed from status: ${currentStatus}.` } };
    }

    captureAndLogError(err, "orderConfirm", { orderId });
    return { success: false, error: { code: "INTERNAL_ERROR", message: err.message || "Failed to confirm order." } };
  }
}
