"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateSellerProfileSchema, UpdateSellerProfileInput } from "@/schemas/seller.schema";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";
import { ActionResponse } from "./seller-register.action";

export async function updateSellerProfile(
  formData: UpdateSellerProfileInput
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    // 1. Session verification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to update your store details",
        },
      };
    }

    const userId = session.user.id;

    // 2. Validate input schemas
    const validation = UpdateSellerProfileSchema.safeParse(formData);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Invalid input data",
        },
      };
    }

    const { storeName, storeDescription, storeLogo, storeBanner, category, city } = validation.data;

    // 3. Find existing UserProfile and Seller
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: { seller: true },
    });

    if (!userProfile || !userProfile.seller) {
      return {
        success: false,
        error: {
          code: "SELLER_NOT_FOUND",
          message: "No registered seller profile found for your account.",
        },
      };
    }

    const sellerId = userProfile.seller.id;

    // 4. Update Seller database record
    await prisma.seller.update({
      where: { id: sellerId },
      data: {
        storeName,
        storeDescription: storeDescription || null,
        storeLogo: storeLogo || null,
        storeBanner: storeBanner || null,
        category,
        city,
      },
    });

    // 5. Track event
    trackEvent(userId, "seller_profile_updated", {
      sellerId,
      storeName,
      category,
      city,
    });

    return {
      success: true,
      data: {
        success: true,
      },
    };
  } catch (error: any) {
    captureAndLogError(error, "updateSellerProfile", { input: formData });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred while updating profile",
      },
    };
  }
}
