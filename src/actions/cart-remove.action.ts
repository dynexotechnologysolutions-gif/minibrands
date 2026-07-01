"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { ActionResponse } from "./seller-register.action";

export async function removeCartItem(
  reservationId: string
): Promise<ActionResponse<{ success: boolean }>> {
  try {
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

    if (reservationRaw) {
      const reservation = typeof reservationRaw === "string" ? JSON.parse(reservationRaw) : reservationRaw;
      if (reservation.userProfileId !== userProfile.id) {
        return {
          success: false,
          error: { code: "FORBIDDEN", message: "You do not own this reservation." },
        };
      }
      await redis.del(reservationKey);
    }

    return {
      success: true,
      data: { success: true },
    };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: error.message || "Failed to remove cart item." },
    };
  }
}
