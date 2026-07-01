"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEligibleToPublish } from "@/lib/product-validation";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";
import { ActionResponse } from "./seller-register.action";
import * as z from "zod";

const PublishSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
});

export async function publishProduct(
  input: z.infer<typeof PublishSchema>
): Promise<ActionResponse<{ productId: string }>> {
  try {
    // 1. Session check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "You must be logged in to publish products" },
      };
    }

    const userId = session.user.id;

    // 2. Input validation
    const validation = PublishSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Invalid input",
        },
      };
    }

    const { productId } = validation.data;

    // 3. Fetch product with images and variants to verify ownership & eligibility
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        variants: true,
        seller: {
          include: {
            verification: true,
            userProfile: true,
          },
        },
      },
    });

    if (!product) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Product not found" },
      };
    }

    // Ownership check
    if (product.seller.userProfile.userId !== userId) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You do not own this product" },
      };
    }

    // Verification check
    const verification = product.seller.verification;
    const isVerified =
      verification &&
      (verification.kycStatus === "auto_approved" ||
        verification.kycStatus === "approved" ||
        verification.kycStatus === "manual_review") &&
      verification.bankVerified;

    if (!isVerified) {
      return {
        success: false,
        error: {
          code: "SELLER_NOT_VERIFIED",
          message: "Complete seller verification before publishing products.",
        },
      };
    }

    // 4. Run eligibility check
    const eligibility = isEligibleToPublish(product);
    if (!eligibility.eligible) {
      return {
        success: false,
        error: {
          code: "NOT_PUBLISH_READY",
          message: eligibility.reason || "Add at least one photo and one size with stock to publish.",
        },
      };
    }

    // 5. Update state to published
    await prisma.product.update({
      where: { id: productId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    const daysSinceCreated = Math.round(
      (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 6. PostHog tracking
    trackEvent(userId, "product_published", {
      sellerId: product.sellerId,
      productId,
      daysSinceCreated,
    });

    return {
      success: true,
      data: {
        productId,
      },
    };
  } catch (error: any) {
    captureAndLogError(error, "publishProduct", { input });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred during publishing",
      },
    };
  }
}
