"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { createRazorpayOrder } from "@/lib/razorpay";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";
import { ActionResponse } from "./seller-register.action";
import { CheckoutSessionPayload } from "./checkout-session.action";

export async function createCheckoutOrder(input: {
  sessionId: string;
  addressId: string;
}): Promise<ActionResponse<{ orderId: string; razorpayOrderId: string; razorpayKeyId: string; amount: number }>> {
  const { sessionId, addressId } = input;
  try {
    // 1. Session verification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "You must be logged in to create orders." },
      };
    }

    const userId = session.user.id;

    // Fetch userProfile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: { seller: { include: { verification: true } } },
    });

    if (!userProfile) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "User profile not found." },
      };
    }

    // 2. Fetch checkout session from Redis
    const sessionKey = `checkout-session:${sessionId}`;
    const sessionRaw = await redis.get(sessionKey);
    if (!sessionRaw) {
      return {
        success: false,
        error: { code: "EXPIRED", message: "Your checkout session has expired. Please restart checkout." },
      };
    }

    const checkoutSession = (
      typeof sessionRaw === "string" ? JSON.parse(sessionRaw) : sessionRaw
    ) as CheckoutSessionPayload;

    if (checkoutSession.products.length === 0) {
      return {
        success: false,
        error: { code: "EMPTY", message: "No items in this checkout session." },
      };
    }

    // 3. Fetch primary product to verify seller status
    const firstProduct = await prisma.product.findUnique({
      where: { id: checkoutSession.products[0].productId, isDeleted: false },
      include: {
        seller: {
          include: { verification: true },
        },
      },
    });

    if (!firstProduct || !firstProduct.isPublished) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Product is no longer available." },
      };
    }

    const verification = firstProduct.seller.verification;
    const isVerified =
      verification &&
      (verification.kycStatus === "auto_approved" || verification.kycStatus === "approved") &&
      verification.bankVerified;

    if (!isVerified) {
      return {
        success: false,
        error: {
          code: "SELLER_NOT_VERIFIED",
          message: "Purchasing is disabled as the boutique status has changed.",
        },
      };
    }

    // 4. Calculate prices and commission server-side
    let totalAmount = 0;
    for (const p of checkoutSession.products) {
      // Re-fetch product price from database for security
      const dbProduct = await prisma.product.findUnique({
        where: { id: p.productId, isDeleted: false },
      });
      if (!dbProduct || !dbProduct.isPublished) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: `Product is no longer available.` },
        };
      }
      totalAmount += dbProduct.price * p.quantity;
    }

    const commissionAmount = Math.round(totalAmount * 0.08);

    // 5. Create Order and OrderItems in database transaction
    const order = await prisma.$transaction(async (tx) => {
      const dbOrder = await tx.order.create({
        data: {
          buyerId: userProfile.id,
          sellerId: firstProduct.sellerId,
          addressId: addressId,
          status: "created",
          totalAmount,
          commissionAmount,
        },
      });

      for (const p of checkoutSession.products) {
        const dbProduct = await prisma.product.findUnique({
          where: { id: p.productId },
        });
        await tx.orderItem.create({
          data: {
            orderId: dbOrder.id,
            productId: p.productId,
            variantId: p.variantId,
            quantity: p.quantity,
            unitPrice: dbProduct?.price || p.price,
          },
        });
      }

      return dbOrder;
    });

    // 6. Fire initial checkout started events
    trackEvent(userId, "checkout_started", {
      orderId: order.id,
      totalAmount,
      itemCount: checkoutSession.products.length,
      mode: checkoutSession.mode,
    });

    trackEvent(userId, "order_created", {
      orderId: order.id,
      status: "created",
      mode: checkoutSession.mode,
    });

    // 7. Call Razorpay API to generate corresponding order
    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder(totalAmount, order.id);
    } catch (err: any) {
      captureAndLogError(err, "orderCreate_RazorpayFailed", { orderId: order.id });
      // Soft-cancel database order to prevent orphaned records
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "cancelled" },
      });
      return {
        success: false,
        error: {
          code: "PAYMENT_INIT_FAILED",
          message: "Failed to initialize payment with Razorpay. Please try again.",
        },
      };
    }

    // Update order with razorpayOrderId
    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    // 8. Delete the temporary checkout session from Redis
    await redis.del(sessionKey);

    return {
      success: true,
      data: {
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mockkey",
        amount: totalAmount,
      },
    };
  } catch (error: any) {
    captureAndLogError(error, "createCheckoutOrder", { sessionId });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred during order creation.",
      },
    };
  }
}
