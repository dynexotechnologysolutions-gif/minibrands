"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { ActionResponse } from "./seller-register.action";

export async function updateCartItemQuantity(
  reservationId: string,
  newQuantity: number
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    if (newQuantity < 1 || newQuantity > 5) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Quantity must be between 1 and 5." },
      };
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "You must be logged in to modify your cart." },
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

    const reservationKey = `reservation:${reservationId}`;
    const reservationRaw = await redis.get(reservationKey);

    if (!reservationRaw) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Reservation not found or expired." },
      };
    }

    const reservation = (
      typeof reservationRaw === "string" ? JSON.parse(reservationRaw) : reservationRaw
    ) as {
      userProfileId: string;
      productId: string;
      variantId: string;
      quantity: number;
      createdAt: string;
    };

    if (reservation.userProfileId !== userProfile.id) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You do not own this reservation." },
      };
    }

    // Check product variant stock count
    const product = await prisma.product.findUnique({
      where: { id: reservation.productId, isDeleted: false },
      include: {
        variants: {
          where: { id: reservation.variantId },
        },
      },
    });

    const variant = product?.variants[0];
    if (!variant) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Product variant not found." },
      };
    }

    // Calculate other reserved stock for this variant (excluding this reservation)
    let otherReserved = 0;
    const keys = await redis.keys("reservation:*");
    if (keys.length > 0) {
      const pipeline = redis.pipeline();
      keys.forEach((key) => pipeline.get(key));
      const results = await pipeline.exec();

      keys.forEach((key, idx) => {
        if (key !== reservationKey) {
          const val = results[idx];
          if (val) {
            const data = typeof val === "string" ? JSON.parse(val) : val;
            if (data && data.variantId === reservation.variantId) {
              otherReserved += Number(data.quantity) || 0;
            }
          }
        }
      });
    }

    const availableStock = variant.stockCount - otherReserved;
    if (availableStock < newQuantity) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_STOCK",
          message: `Only ${availableStock} units are available in stock.`,
        },
      };
    }

    // Update reservation quantity in Redis
    reservation.quantity = newQuantity;

    // Get TTL to preserve existing remaining time
    const ttl = await redis.ttl(reservationKey);
    const finalTtl = ttl > 0 ? ttl : 900;

    await redis.set(reservationKey, JSON.stringify(reservation), { ex: finalTtl });

    return {
      success: true,
      data: { success: true },
    };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: error.message || "Failed to update quantity." },
    };
  }
}
