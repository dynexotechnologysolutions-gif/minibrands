/**
 * POST /api/icarry/webhook/[secret]
 * iCarry v16.0 webhook handler.
 * Auth: URL secret param with timing-safe comparison.
 * Always returns 200 to prevent iCarry from retrying events.
 *
 * Handles:
 *  - "Delivered" event → mark order delivered + set escrowReleaseAt
 *  - "NDR" (Non-Delivery Report) → Sentry + Resend alert
 *  - "Weight Dispute" → Sentry + Resend alert
 *  - All others → logged and acknowledged
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { captureAndLogError } from "@/lib/sentry";
import { sendFounderAlert } from "@/lib/resend";
import crypto from "crypto";

export const maxDuration = 30;

const ESCROW_WINDOW_DAYS = 7;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
): Promise<NextResponse> {
  const { secret } = await params;

  // ── Auth: timing-safe comparison with ICARRY_WEBHOOK_SECRET ─────────────────
  const webhookSecret = process.env.ICARRY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[iCarry Webhook] ICARRY_WEBHOOK_SECRET is not configured.");
    // Always return 200 to iCarry — do not retry
    return NextResponse.json({ received: true });
  }

  let isAuthorized = false;
  try {
    const secretBuffer = Buffer.from(webhookSecret, "utf-8");
    const paramBuffer = Buffer.from(secret, "utf-8");
    if (secretBuffer.length === paramBuffer.length) {
      isAuthorized = crypto.timingSafeEqual(secretBuffer, paramBuffer);
    }
  } catch {
    isAuthorized = false;
  }

  if (!isAuthorized) {
    console.warn("[iCarry Webhook] Invalid secret. Ignoring event.");
    // Still return 200 — iCarry should not retry on auth failures
    return NextResponse.json({ received: true });
  }

  // ── Parse payload ────────────────────────────────────────────────────────────
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    console.warn("[iCarry Webhook] Failed to parse JSON body.");
    return NextResponse.json({ received: true });
  }

  const eventType: string =
    payload.event ||
    payload.event_type ||
    payload.status ||
    "UNKNOWN";

  const awbNumber: string =
    payload.awb_number || payload.awb || payload.data?.awb_number || "";

  const orderReference: string =
    payload.order_reference_id ||
    payload.reference_id ||
    payload.data?.order_reference_id ||
    "";

  console.log(
    `[iCarry Webhook] Event: "${eventType}", AWB: "${awbNumber}", Ref: "${orderReference}"`
  );

  // ── Event routing ────────────────────────────────────────────────────────────
  try {
    const upperEvent = eventType.toUpperCase().replace(/[\s_-]/g, "_");

    if (upperEvent === "DELIVERED" || upperEvent === "OUT_FOR_DELIVERY_DELIVERED") {
      await handleDelivered(orderReference, awbNumber);
    } else if (upperEvent.includes("NDR") || upperEvent.includes("NON_DELIVERY")) {
      await handleNDR(orderReference, awbNumber, payload);
    } else if (upperEvent.includes("WEIGHT_DISPUTE") || upperEvent.includes("WEIGHT")) {
      await handleWeightDispute(orderReference, awbNumber, payload);
    } else {
      console.log(`[iCarry Webhook] Unhandled event type: "${eventType}". Acknowledged.`);
    }
  } catch (err: any) {
    captureAndLogError(err, "icarryWebhook.processing", { eventType, awbNumber, orderReference });
    // Still return 200 — do not trigger retries
  }

  return NextResponse.json({ received: true });
}

// ── Event Handlers ─────────────────────────────────────────────────────────────

async function handleDelivered(orderReference: string, awbNumber: string): Promise<void> {
  if (!orderReference) {
    console.warn("[iCarry Webhook] Delivered event missing orderReference. Cannot update DB.");
    return;
  }

  // Idempotent: skip if already delivered/completed
  const order = await prisma.order.findUnique({
    where: { id: orderReference },
  });

  if (!order) {
    console.warn(`[iCarry Webhook] Order not found: ${orderReference}`);
    return;
  }

  if (order.status === "delivered" || order.status === "completed") {
    console.log(`[iCarry Webhook] Order ${orderReference} already in ${order.status}. Idempotent skip.`);
    return;
  }

  if (order.status !== "shipped") {
    console.warn(`[iCarry Webhook] Order ${orderReference} in unexpected status: ${order.status}. Cannot mark delivered via webhook.`);
    return;
  }

  const escrowReleaseAt = new Date(
    Date.now() + ESCROW_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  await prisma.order.update({
    where: { id: orderReference },
    data: {
      status: "delivered",
      orderStatus: "delivered",
      escrowReleaseAt,
    },
  });

  console.log(
    `[iCarry Webhook] Order ${orderReference} marked delivered via webhook. EscrowReleaseAt: ${escrowReleaseAt.toISOString()}`
  );
}

async function handleNDR(orderReference: string, awbNumber: string, payload: any): Promise<void> {
  const reason = payload.ndr_reason || payload.reason || "Unknown NDR reason";
  const message = `NDR for AWB ${awbNumber} (Order: ${orderReference || "N/A"}). Reason: ${reason}`;

  console.warn(`[iCarry Webhook] NDR event: ${message}`);

  captureAndLogError(
    new Error(message),
    "icarryWebhook.NDR",
    { orderReference, awbNumber, reason }
  );

  await sendFounderAlert(
    `Non-Delivery Report — AWB ${awbNumber}`,
    `<p><strong>Order Reference:</strong> ${orderReference || "N/A"}</p>
     <p><strong>AWB Number:</strong> ${awbNumber}</p>
     <p><strong>NDR Reason:</strong> ${reason}</p>
     <p>Please investigate and take action with the iCarry team.</p>`
  );
}

async function handleWeightDispute(
  orderReference: string,
  awbNumber: string,
  payload: any
): Promise<void> {
  const disputeWeight = payload.dispute_weight || payload.weight || "Unknown";
  const chargedWeight = payload.charged_weight || "Unknown";
  const message = `Weight dispute for AWB ${awbNumber} (Order: ${orderReference || "N/A"})`;

  console.warn(`[iCarry Webhook] Weight dispute: ${message}`);

  captureAndLogError(
    new Error(message),
    "icarryWebhook.WeightDispute",
    { orderReference, awbNumber, disputeWeight, chargedWeight }
  );

  await sendFounderAlert(
    `Weight Dispute — AWB ${awbNumber}`,
    `<p><strong>Order Reference:</strong> ${orderReference || "N/A"}</p>
     <p><strong>AWB Number:</strong> ${awbNumber}</p>
     <p><strong>Dispute Weight:</strong> ${disputeWeight}g</p>
     <p><strong>Charged Weight:</strong> ${chargedWeight}g</p>
     <p>Review with iCarry and adjust billing if necessary.</p>`
  );
}
