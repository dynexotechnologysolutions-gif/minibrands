/**
 * CartMergeService
 *
 * Merges items from a guest cart (identified by guestCartId / mb-guest-cart cookie)
 * into an authenticated user's cart (Redis reservation keys).
 *
 * Rules:
 * - Only merges items from the guest-cart catalog hash, not individual reservation keys
 *   (reservations may have already expired before login).
 * - Validates each variant's real-time stock from the DB.
 * - Caps quantity per variant at MAX_QTY_PER_VARIANT (5).
 * - If the authenticated user already has a reservation for the same variant,
 *   the quantities are summed up to the cap, not replaced.
 * - After merging, the guest-cart catalog hash and all associated reservation keys
 *   are deleted.
 */

import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const MAX_QTY_PER_VARIANT = 5;
const RESERVATION_TTL_SECONDS = 900; // 15 minutes

export interface MergeResult {
  success: boolean;
  mergedCount: number;
  skippedVariants: string[];
  error?: string;
}

export async function mergeGuestCart(
  guestCartId: string,
  userId: string
): Promise<MergeResult> {
  const skippedVariants: string[] = [];
  let mergedCount = 0;

  try {
    // 1. Load guest cart catalog hash (long-lived, not tied to reservation TTL)
    const hashKey = `guest-cart:${guestCartId}`;
    const cartData = await redis.hgetall(hashKey);

    if (!cartData || Object.keys(cartData).length === 0) {
      // Nothing to merge — guest cart is empty or already expired
      return { success: true, mergedCount: 0, skippedVariants: [] };
    }

    // 2. For each variant in the guest cart, attempt to create/update an authenticated reservation
    for (const [variantId, rawValue] of Object.entries(cartData)) {
      let guestItem: { productId: string; quantity: number };

      try {
        guestItem =
          typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
      } catch {
        skippedVariants.push(variantId);
        continue;
      }

      const requestedQty = Number(guestItem.quantity) || 0;
      if (requestedQty <= 0) {
        skippedVariants.push(variantId);
        continue;
      }

      // 3. Validate stock from DB
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: {
          product: {
            include: {
              seller: { include: { verification: true } },
            },
          },
        },
      });

      if (!variant || !variant.product.isPublished || variant.product.isDeleted) {
        skippedVariants.push(variantId);
        continue;
      }

      // Check seller verification
      const verification = variant.product.seller.verification;
      const isSellerVerified =
        !!verification &&
        (verification.kycStatus === "auto_approved" ||
          verification.kycStatus === "approved") &&
        verification.bankVerified;

      if (!isSellerVerified) {
        skippedVariants.push(variantId);
        continue;
      }

      // 4. Count total currently reserved stock for this variant (all users)
      const existingReservationKey = `reservation:${userId}:${variantId}`;
      const existingRaw = await redis.get(existingReservationKey);
      let existingQty = 0;

      if (existingRaw) {
        try {
          const existing =
            typeof existingRaw === "string"
              ? JSON.parse(existingRaw)
              : existingRaw;
          existingQty = Number(existing.quantity) || 0;
        } catch {
          existingQty = 0;
        }
      }

      // 5. Calculate how many more we can add (respecting cap)
      const combinedQty = existingQty + requestedQty;
      const cappedQty = Math.min(combinedQty, MAX_QTY_PER_VARIANT);

      if (cappedQty <= existingQty) {
        // Already at or over cap — skip
        skippedVariants.push(variantId);
        continue;
      }

      const additionalQty = cappedQty - existingQty;

      // 6. Validate available stock from DB
      // Count all active reservations for this variant (auth reservations)
      const allReservationKeys = await redis.keys(`reservation:*:${variantId}`);
      let totalReserved = 0;
      if (allReservationKeys.length > 0) {
        const pipeline = redis.pipeline();
        allReservationKeys.forEach((k) => pipeline.get(k));
        const results = await pipeline.exec();
        results.forEach((val: any) => {
          if (val) {
            const parsed = typeof val === "string" ? JSON.parse(val) : val;
            if (parsed) totalReserved += Number(parsed.quantity) || 0;
          }
        });
      }

      const availableStock = variant.stockCount - totalReserved;
      if (availableStock < additionalQty) {
        // Not enough stock — merge whatever we can, or skip if nothing fits
        if (availableStock <= 0) {
          skippedVariants.push(variantId);
          continue;
        }
      }

      const finalQty = Math.min(cappedQty, existingQty + availableStock);

      if (finalQty <= existingQty) {
        skippedVariants.push(variantId);
        continue;
      }

      // 7. Write/update authenticated reservation key
      const reservationId = crypto.randomUUID();
      await redis.set(
        existingReservationKey,
        JSON.stringify({
          reservationId,
          userId,
          productId: guestItem.productId,
          variantId,
          quantity: finalQty,
          price: variant.product.price,
          createdAt: new Date().toISOString(),
        })
      );
      await redis.expire(existingReservationKey, RESERVATION_TTL_SECONDS);

      mergedCount++;
    }

    // 8. Clean up guest cart catalog hash and all guest reservation keys
    const guestReservationKeys = await redis.keys(
      `guest-reservation:${guestCartId}:*`
    );
    const pipeline = redis.pipeline();
    guestReservationKeys.forEach((k) => pipeline.del(k));
    pipeline.del(hashKey);
    await pipeline.exec();

    return { success: true, mergedCount, skippedVariants };
  } catch (error: any) {
    console.error("[CartMergeService ERROR]", error);
    return {
      success: false,
      mergedCount,
      skippedVariants,
      error: error.message || "Cart merge failed",
    };
  }
}
