import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { deleteMatchingReservation } from "@/lib/redis";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";

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

    // 3. Parse body and process "payment.captured" event
    const body = JSON.parse(rawBody);
    const eventType = body.event;

    if (eventType !== "payment.captured") {
      // Return 200 to acknowledge other events
      console.log(`[Razorpay Webhook] Received unhandled event type: ${eventType}`);
      return NextResponse.json({ received: true });
    }

    const paymentEntity = body.payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;
    const razorpayPaymentId = paymentEntity?.id;

    if (!razorpayOrderId) {
      console.warn("[Razorpay Webhook Warning] Webhook payment payload has no order_id.");
      return NextResponse.json({ error: "Missing order_id in payload" }, { status: 400 });
    }

    // 4. Look up database Order
    const order = await prisma.order.findUnique({
      where: { razorpayOrderId },
      include: {
        buyer: true,
        items: true,
      },
    });

    if (!order) {
      console.warn(`[Razorpay Webhook Warning] Order not found for razorpayOrderId: ${razorpayOrderId}`);
      // Return 200 so Razorpay stops retrying for invalid orders
      return NextResponse.json({ received: true });
    }

    // 5. Idempotency check: short-circuit if order is already paid or cancelled
    if (order.status !== "created" || order.razorpayPaymentId) {
      console.log(`[Razorpay Webhook Idempotency] Order ${order.id} already processed. Status: ${order.status}`);
      return NextResponse.json({ received: true });
    }

    // 6. Update database and decrement stock inside transaction
    await prisma.$transaction(async (tx) => {
      // Update Order details
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          razorpayPaymentId: razorpayPaymentId,
        },
      });

      // Decrement stock count for each variant in the order
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockCount: {
              decrement: item.quantity,
            },
          },
        });
      }
    });

    // 7. Clean up reservation from Redis (outside transaction to avoid database blocking)
    for (const item of order.items) {
      await deleteMatchingReservation(
        order.buyerId,
        item.productId,
        item.variantId,
        item.quantity
      );
    }

    // 8. Track successful payment analytics (Server-side)
    trackEvent(order.buyer.userId, "payment_completed", {
      orderId: order.id,
      totalAmount: order.totalAmount,
      commissionAmount: order.commissionAmount,
      sellerId: order.sellerId,
    });

    // 9. Log structured event for future notification hooks
    console.log(`[NOTIFICATION_EVENT] ORDER_PAID: {"orderId": "${order.id}", "buyerId": "${order.buyerId}", "totalAmount": ${order.totalAmount}}`);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    captureAndLogError(error, "RazorpayWebhookRoute", { rawBody });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
