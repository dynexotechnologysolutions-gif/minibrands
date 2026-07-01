import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import crypto from "crypto";

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
      const generated = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generated !== razorpay_signature) {
        return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
      }
    }

    // 2. Fetch pending order details from Redis
    const pendingOrderRaw = await redis.get(`pending-order:${razorpay_order_id}`);
    if (!pendingOrderRaw) {
      return NextResponse.json({ error: "Payment verification window expired or order processed" }, { status: 400 });
    }

    const pendingOrder = typeof pendingOrderRaw === "string" ? JSON.parse(pendingOrderRaw) : pendingOrderRaw;

    // 3. Create records inside Prisma Transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the main Order record
      const dbOrder = await tx.order.create({
        data: {
          buyerId: pendingOrder.userId,
          sellerId: pendingOrder.sellerId,
          addressId: pendingOrder.addressId,
          status: "paid",
          subtotal: pendingOrder.subtotal,
          shipping: pendingOrder.shipping,
          tax: pendingOrder.tax,
          totalAmount: pendingOrder.totalAmount,
          commissionAmount: Math.round(pendingOrder.totalAmount * 0.08),
          paymentStatus: "paid",
          orderStatus: "confirmed",
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        },
      });

      // Create OrderItem records and update stock count
      for (const item of pendingOrder.products) {
        await tx.orderItem.create({
          data: {
            orderId: dbOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.price,
          },
        });

        // Decrement product variant stock count
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockCount: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Create the Payment record
      await tx.payment.create({
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          amount: pendingOrder.totalAmount,
          paymentMethod: "razorpay",
          status: "captured",
        },
      });

      return dbOrder;
    });

    // 4. Remove purchased items from cart if checkout originated from Cart
    if (pendingOrder.sessionId) {
      // Delete the checkout-session from Redis
      await redis.del(`checkout-session:${pendingOrder.sessionId}`);
      
      // Delete individual reservations for products (cart items)
      for (const item of pendingOrder.products) {
        if (item.reservationId) {
          await redis.del(`reservation:${item.reservationId}`);
        }
      }
    } else if (pendingOrder.reservationId) {
      // Buy Now single item reservation cleanup
      await redis.del(`reservation:${pendingOrder.reservationId}`);
    }

    // 5. Clean up pending order from Redis
    await redis.del(`pending-order:${razorpay_order_id}`);

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error: any) {
    console.error("[Verify Payment API Error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
