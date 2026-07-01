"use server";

import { prisma } from "@/lib/prisma";
import { deleteMatchingReservation } from "@/lib/redis";
import { trackEvent } from "@/lib/posthog";
import { ActionResponse } from "./seller-register.action";

export async function mockConfirmPayment(
  orderId: string
): Promise<ActionResponse<{ success: boolean }>> {
  // STRICT GATE: Throw error immediately if in production
  if (process.env.NODE_ENV === "production") {
    return {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Mock payment confirmation is strictly disabled in production.",
      },
    };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        items: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Order not found." },
      };
    }

    if (order.status !== "created") {
      return {
        success: true,
        data: { success: true },
      };
    }

    // Process payment success idempotently
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "paid",
          razorpayPaymentId: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
        },
      });

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

    // Delete reservation
    for (const item of order.items) {
      await deleteMatchingReservation(
        order.buyerId,
        item.productId,
        item.variantId,
        item.quantity
      );
    }

    // Track analytics event
    trackEvent(order.buyer.userId, "payment_completed", {
      orderId: order.id,
      totalAmount: order.totalAmount,
      commissionAmount: order.commissionAmount,
      sellerId: order.sellerId,
      environment: "sandbox_mock",
    });

    console.log(`[NOTIFICATION_EVENT] ORDER_PAID (MOCK): {"orderId": "${order.id}", "buyerId": "${order.buyerId}", "totalAmount": ${order.totalAmount}}`);

    return {
      success: true,
      data: { success: true },
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to process mock payment confirmation.",
      },
    };
  }
}
