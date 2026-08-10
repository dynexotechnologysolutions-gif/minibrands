/**
 * processSuccessfulPayment.ts
 *
 * Authoritative unified payment processor.
 * Both /api/payments/verify (client callback) and /api/webhooks/razorpay (server webhook)
 * MUST delegate to this single function for order creation.
 *
 * Idempotency: The function checks for an existing order with the same razorpayOrderId.
 * If already fulfilled, it returns the existing orderId without duplicating records.
 */

import { prisma } from "@/lib/prisma";
import { redis, deleteMatchingReservation } from "@/lib/redis";
import { GuestOrderService } from "@/lib/guest-order.service";

export interface ProcessPaymentResult {
  success: boolean;
  orderId?: string;
  guestToken?: string;
  alreadyProcessed?: boolean;
  error?: string;
}

export async function processSuccessfulPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string
): Promise<ProcessPaymentResult> {
  try {
    // 1. Idempotency check: check if the order exists in the DB
    const existingOrder = await prisma.order.findUnique({
      where: { razorpayOrderId },
      include: {
        items: true,
        buyer: true,
      },
    });

    if (existingOrder) {
      if (existingOrder.status === "paid" || existingOrder.paymentStatus === "paid") {
        console.log(`[processSuccessfulPayment] Order already fully processed for ${razorpayOrderId}`);
        return {
          success: true,
          orderId: existingOrder.id,
          alreadyProcessed: true,
        };
      }

      // Order exists but is not paid (i.e. authenticated checkout order created via server action in "created" status)
      console.log(`[processSuccessfulPayment] Fulfilling existing unpaid order ${existingOrder.id} for ${razorpayOrderId}`);
      
      const result = await prisma.$transaction(
        async (tx) => {
          // Update Order status
          const dbOrder = await tx.order.update({
            where: { id: existingOrder.id },
            data: {
              status: "paid",
              paymentStatus: "paid",
              razorpayPaymentId,
            },
          });

          // Decrement stock count for each variant in the order
          for (const item of existingOrder.items) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stockCount: { decrement: item.quantity },
              },
            });
          }

          // Create the Payment record
          await tx.payment.create({
            data: {
              razorpayPaymentId,
              razorpayOrderId,
              amount: existingOrder.totalAmount,
              paymentMethod: "razorpay",
              status: "captured",
            },
          });

          return { orderId: existingOrder.id };
        },
        { maxWait: 15000, timeout: 30000 }
      );

      // Clean up reservation from Redis (outside transaction to avoid database blocking)
      if (existingOrder.buyerId) {
        for (const item of existingOrder.items) {
          await deleteMatchingReservation(
            existingOrder.buyerId,
            item.productId,
            item.variantId,
            item.quantity
          );
        }
      }

      return {
        success: true,
        orderId: result.orderId,
      };
    }

    // 2. Fetch pending order payload from Redis (Guest checkout path)
    const pendingOrderRaw = await redis.get(`pending-order:${razorpayOrderId}`);
    if (!pendingOrderRaw) {
      return {
        success: false,
        error: "Payment verification window expired or order already processed",
      };
    }

    const pendingOrder =
      typeof pendingOrderRaw === "string" ? JSON.parse(pendingOrderRaw) : pendingOrderRaw;

    // 3. Transactional order creation
    const result = await prisma.$transaction(
      async (tx) => {
        let dbOrder;
        let rawGuestToken: string | undefined;

        if (pendingOrder.isGuest === true) {
          rawGuestToken = GuestOrderService.generateGuestToken();
          const hash = GuestOrderService.hashGuestToken(rawGuestToken);

          dbOrder = await tx.order.create({
            data: {
              buyerId: null,
              sellerId: pendingOrder.sellerId,
              addressId: null,
              status: "paid",
              subtotal: pendingOrder.subtotal,
              shipping: pendingOrder.shipping,
              tax: pendingOrder.tax,
              totalAmount: pendingOrder.totalAmount,
              commissionAmount: Math.round(pendingOrder.totalAmount * 0.08),
              paymentStatus: "paid",
              orderStatus: "confirmed",
              razorpayOrderId,
              razorpayPaymentId,

              // Guest-specific fields
              guestEmail: pendingOrder.guestEmail,
              guestPhone: pendingOrder.guestPhone,
              guestName: pendingOrder.guestName,
              guestShippingAddress: pendingOrder.guestShippingAddress,
              guestTokenHash: hash,
              guestTokenCreatedAt: new Date(),
              guestTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
          });
        } else {
          dbOrder = await tx.order.create({
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
              razorpayOrderId,
              razorpayPaymentId,
            },
          });
        }

        // Create OrderItem records and decrement stock
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

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockCount: { decrement: item.quantity },
            },
          });
        }

        // Create the Payment record
        await tx.payment.create({
          data: {
            razorpayPaymentId,
            razorpayOrderId,
            amount: pendingOrder.totalAmount,
            paymentMethod: "razorpay",
            status: "captured",
          },
        });

        return { orderId: dbOrder.id, guestToken: rawGuestToken };
      },
      { maxWait: 15000, timeout: 30000 }
    );

    // 4. Post-transaction cleanup of Redis keys
    const redisPipeline = redis.pipeline();

    if (pendingOrder.isGuest === true) {
      // Clear guest cart reservation keys
      if (pendingOrder.guestCartId) {
        const guestReservationKeys = await redis.keys(
          `guest-reservation:${pendingOrder.guestCartId}:*`
        );
        guestReservationKeys.forEach((key) => redisPipeline.del(key));

        // Also clear the catalog hash
        redisPipeline.del(`guest-cart:${pendingOrder.guestCartId}`);
      }
      // Clear guest checkout session if present
      if (pendingOrder.sessionId) {
        redisPipeline.del(`guest-checkout-session:${pendingOrder.sessionId}`);
      }
    } else {
      // Authenticated checkout session
      if (pendingOrder.sessionId) {
        redisPipeline.del(`checkout-session:${pendingOrder.sessionId}`);
      }
      // Individual reservation keys
      for (const item of pendingOrder.products) {
        if (item.reservationId) {
          redisPipeline.del(`reservation:${item.reservationId}`);
        }
      }
      // Buy Now single reservation
      if (pendingOrder.reservationId) {
        redisPipeline.del(`reservation:${pendingOrder.reservationId}`);
      }
    }

    // Remove the pending order
    redisPipeline.del(`pending-order:${razorpayOrderId}`);
    await redisPipeline.exec();

    return {
      success: true,
      orderId: result.orderId,
      guestToken: result.guestToken,
    };
  } catch (error: any) {
    console.error("[processSuccessfulPayment ERROR]", error);
    return { success: false, error: error.message || "Payment processing failed" };
  }
}
