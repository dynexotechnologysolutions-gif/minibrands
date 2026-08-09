import { NextResponse } from "next/server";
import crypto from "crypto";
import { processSuccessfulPayment } from "@/lib/process-payment";

/**
 * POST /api/payments/verify
 *
 * Client-side callback after Razorpay payment success.
 *
 * Security:
 * 1. Always verifies Razorpay HMAC signature in production.
 * 2. Delegates order creation to processSuccessfulPayment() — the single source of truth.
 * 3. Idempotent: duplicate calls return the same orderId.
 */
export async function POST(req: Request) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment confirmation parameters" }, { status: 400 });
    }

    // 1. Verify payment signature
    const isMock =
      process.env.NODE_ENV !== "production" &&
      (!process.env.RAZORPAY_KEY_ID ||
        process.env.RAZORPAY_KEY_ID.includes("mock") ||
        razorpay_order_id.startsWith("order_mock_"));

    if (!isMock) {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        console.error("[verify] RAZORPAY_KEY_SECRET is not configured.");
        return NextResponse.json({ error: "Payment verification is not configured" }, { status: 500 });
      }

      const generated = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generated !== razorpay_signature) {
        return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
      }
    }

    // 2. Delegate to unified payment processor
    const result = await processSuccessfulPayment(razorpay_order_id, razorpay_payment_id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      guestToken: result.guestToken,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (error: any) {
    console.error("[Verify Payment API Error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
