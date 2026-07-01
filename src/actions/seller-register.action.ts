"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RegisterSellerSchema } from "@/schemas/seller.schema";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export async function registerSeller(formData: {
  businessName: string;
  storeName: string;
  category: string;
  city: string;
}): Promise<ActionResponse<{ sellerId: string }>> {
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
          message: "You must be logged in to register as a seller",
        },
      };
    }

    const userId = session.user.id;

    // 2. Validate input schemas
    const validation = RegisterSellerSchema.safeParse(formData);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Invalid input data",
        },
      };
    }

    const { businessName, storeName, category, city } = validation.data;

    // 3. Check for existing UserProfile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: { seller: true },
    });

    if (!userProfile) {
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "User profile was not found. Please log in again.",
        },
      };
    }

    if (userProfile.seller) {
      return {
        success: false,
        error: {
          code: "ALREADY_REGISTERED",
          message: "You have already registered as a seller.",
        },
      };
    }

    // 4. Create Seller, SellerVerification, and update UserProfile role in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create seller
      const seller = await tx.seller.create({
        data: {
          userProfileId: userProfile.id,
          businessName,
          storeName,
          category,
          city,
        },
      });

      // Create seller verification
      await tx.sellerVerification.create({
        data: {
          sellerId: seller.id,
          kycStatus: "pending",
          trustScore: 0,
        },
      });

      // Update role
      await tx.userProfile.update({
        where: { id: userProfile.id },
        data: { role: "SELLER" },
      });

      return seller;
    });

    // 5. PostHog track success event
    trackEvent(userId, "seller_registered", {
      sellerId: result.id,
      businessName,
      storeName,
      category,
      city,
    });

    return {
      success: true,
      data: {
        sellerId: result.id,
      },
    };
  } catch (error: any) {
    captureAndLogError(error, "registerSeller", { input: formData });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred during registration",
      },
    };
  }
}
