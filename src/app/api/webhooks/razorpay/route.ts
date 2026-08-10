import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";
import { processSuccessfulPayment } from "@/lib/process-payment";

export async function POST(req: Request) {
  let rawBody = "";
  try {
    // 1. Read raw request body and signature header BEFORE any JSON parsing
    const signature = req.headers.get("x-razorpay-signature") || "";
    rawBody = await req.text();

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // 2. Validate webhook signature
    if (!webhookSecret) {
      console.error("[Razorpay Webhook Error] RAZORPAY_WEBHOOK_SECRET is not configured.");
      return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
    }

    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.warn(`[Razorpay Webhook Warning] Invalid signature. Signature: ${signature}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 3. Parse body and route by event type
    const body = JSON.parse(rawBody);
    const eventType = body.event;

    if (eventType === "refund.processed" || eventType === "refund.failed") {
      const { handleRefundWebhook } = await import("@/modules/returns/webhooks/razorpay");
      await handleRefundWebhook(eventType, body.payload?.refund);
      return NextResponse.json({ received: true });
    }

    if (eventType !== "payment.captured") {
      console.log(`[Razorpay Webhook] Received unhandled event type: ${eventType}`);
      return NextResponse.json({ received: true });
    }

    const paymentEntity = body.payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;
    const razorpayPaymentId = paymentEntity?.id;

    if (!razorpayOrderId || !razorpayPaymentId) {
      console.warn("[Razorpay Webhook Warning] Webhook payment payload has no order_id or payment_id.");
      return NextResponse.json({ error: "Missing order_id or payment_id in payload" }, { status: 400 });
    }

    // 4. Delegate payment fulfillment to processSuccessfulPayment (unified processor)
    console.log(`[Razorpay Webhook] Delegating payment fulfillment for ${razorpayOrderId} to processSuccessfulPayment.`);
    const result = await processSuccessfulPayment(razorpayOrderId, razorpayPaymentId);

    if (!result.success) {
      console.error(`[Razorpay Webhook] processSuccessfulPayment failed: ${result.error}`);
      // Return 200 to prevent Razorpay from retrying if the pending order expired
      return NextResponse.json({ received: true });
    }

    if (result.alreadyProcessed) {
      console.log(`[Razorpay Webhook Idempotency] Order for ${razorpayOrderId} was already processed.`);
      return NextResponse.json({ received: true });
    }

    // Track analytics for newly created or updated order
    if (result.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: result.orderId },
        include: { buyer: true },
      });

      if (order) {
        const buyerUserId =
          order.buyer?.userId ??
          (order.guestEmail ? `guest_${order.guestEmail}` : `guest_order_${order.id}`);
        trackEvent(buyerUserId, "payment_completed", {
          orderId: order.id,
          totalAmount: order.totalAmount,
          commissionAmount: order.commissionAmount,
          sellerId: order.sellerId,
        });
        console.log(`[NOTIFICATION_EVENT] ORDER_PAID: {"orderId": "${order.id}", "buyerId": "${order.buyerId}", "totalAmount": ${order.totalAmount}}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    captureAndLogError(error, "RazorpayWebhookRoute", { rawBody });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
