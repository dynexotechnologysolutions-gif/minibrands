"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis, ReservationData } from "@/lib/redis";
import { calculateCommission } from "@/lib/commission";
import { createRazorpayOrder } from "@/lib/razorpay";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";
import { ActionResponse } from "./seller-register.action";
import * as z from "zod";

const OrderCreateSchema = z.object({
  reservationId: z.string().uuid("Invalid reservation ID"),
  addressId: z.string().uuid("Invalid address ID"),
});

export async function createOrder(
  input: z.infer<typeof OrderCreateSchema>
): Promise<
  ActionResponse<{
    orderId: string;
    razorpayOrderId: string;
    razorpayKeyId: string;
    amount: number;
  }>
> {
  try {
    // 1. Session verification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "You must be logged in to checkout." },
      };
    }

    const userId = session.user.id;

    // Fetch userProfile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "User profile not found." },
      };
    }

    // 2. Validate input schemas
    const validation = OrderCreateSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Invalid input parameters",
        },
      };
    }

    const { reservationId, addressId } = validation.data;

    // 3. Fetch reservation from Redis
    const reservationKey = `reservation:${reservationId}`;
    const reservationRaw = await redis.get(reservationKey);

    if (!reservationRaw) {
      return {
        success: false,
        error: {
          code: "RESERVATION_EXPIRED",
          message: "Your cart reservation has expired. Please return to the product page and try again.",
        },
      };
    }

    const reservation = (
      typeof reservationRaw === "string" ? JSON.parse(reservationRaw) : reservationRaw
    ) as ReservationData;

    // 4. Verify reservation ownership
    if (reservation.userProfileId !== userProfile.id) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You do not own this cart reservation." },
      };
    }

    // 5. Fetch and verify Address ownership
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Selected address was not found." },
      };
    }

    if (address.userProfileId !== userProfile.id) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You do not own the selected delivery address." },
      };
    }

    // 6. Fetch and verify Product and Seller status
    const product = await prisma.product.findUnique({
      where: { id: reservation.productId, isDeleted: false },
      include: {
        seller: {
          include: {
            verification: true,
          },
        },
        variants: {
          where: { id: reservation.variantId },
        },
      },
    });

    if (!product || !product.isPublished) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "The product is no longer available." },
      };
    }

    const variant = product.variants[0];
    if (!variant) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Selected product size is no longer available." },
      };
    }

    // Re-verify seller status (strict kycStatus = auto_approved/approved and bankVerified = true)
    const verification = product.seller.verification;
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

    // 7. Calculate prices and commission server-side
    const totalAmount = product.price * reservation.quantity;
    const commissionAmount = calculateCommission(totalAmount);

    // 8. Create Order and OrderItem in database transaction
    const order = await prisma.$transaction(async (tx) => {
      const dbOrder = await tx.order.create({
        data: {
          buyerId: userProfile.id,
          sellerId: product.sellerId,
          addressId: addressId,
          status: "created",
          totalAmount,
          commissionAmount,
        },
      });

      await tx.orderItem.create({
        data: {
          orderId: dbOrder.id,
          productId: product.id,
          variantId: variant.id,
          quantity: reservation.quantity,
          unitPrice: product.price,
        },
      });

      return dbOrder;
    });

    // Fire initial checkout started events
    trackEvent(userId, "checkout_started", {
      orderId: order.id,
      totalAmount,
      itemCount: reservation.quantity,
    });

    trackEvent(userId, "order_created", {
      orderId: order.id,
      status: "created",
    });

    // 9. Call Razorpay API to generate corresponding order
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

    // Track payment initiation
    trackEvent(userId, "payment_initiated", {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
    });

    return {
      success: true,
      data: {
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
        amount: totalAmount,
      },
    };
  } catch (error: any) {
    captureAndLogError(error, "createOrder", { input });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred during checkout setup.",
      },
    };
  }
}
