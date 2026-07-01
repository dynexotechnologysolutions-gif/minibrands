"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CartReserveSchema, CartReserveInput } from "@/schemas/cart.schema";
import { tryReserveStock, checkRateLimit, ReservationData } from "@/lib/redis";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";
import { ActionResponse } from "./seller-register.action";
import crypto from "crypto";

export async function reserveCartItem(
  input: CartReserveInput
): Promise<ActionResponse<{ reservationId: string; expiresAt: string }>> {
  try {
    // 1. Session verification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "You must be logged in to reserve products." },
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

    // 2. Redis Rate Limiting Check
    const isAllowed = await checkRateLimit(userProfile.id);
    if (!isAllowed) {
      return {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many reservation attempts. Please try again in a few minutes.",
        },
      };
    }

    // 3. Input Validation
    const validation = CartReserveSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Invalid input data",
        },
      };
    }

    const { productId, variantId, quantity } = validation.data;

    // 4. Fetch Product, Seller and Verification status
    const product = await prisma.product.findUnique({
      where: { id: productId, isDeleted: false },
      include: {
        seller: {
          include: {
            verification: true,
          },
        },
        variants: {
          where: { id: variantId },
        },
      },
    });

    if (!product || !product.isPublished) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Product is not available for purchase." },
      };
    }

    // Check variant exists
    const variant = product.variants[0];
    if (!variant) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Product variant not found." },
      };
    }

    // Check seller verification status (strict kycStatus = auto_approved/approved and bankVerified = true)
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
          message: "Boutique identity verification is pending. Purchases are temporarily disabled.",
        },
      };
    }

    // 5. Try Atomic Reservation in Redis
    const reservationId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 900 * 1000).toISOString(); // 15 minutes TTL

    const reservationData: ReservationData = {
      userProfileId: userProfile.id,
      productId,
      variantId,
      quantity,
      createdAt: new Date().toISOString(),
    };

    const reserveResult = await tryReserveStock(
      reservationId,
      reservationData,
      variant.stockCount
    );

    if (!reserveResult.success) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_STOCK",
          message: "The requested quantity is no longer available in stock.",
        },
      };
    }

    // 6. Track Analytics
    trackEvent(userId, "product_added_to_cart", {
      productId,
      variantId,
      sellerId: product.sellerId,
      quantity,
      price: product.price,
    });

    return {
      success: true,
      data: {
        reservationId,
        expiresAt,
      },
    };
  } catch (error: any) {
    captureAndLogError(error, "reserveCartItem", { input });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred during reservation.",
      },
    };
  }
}
