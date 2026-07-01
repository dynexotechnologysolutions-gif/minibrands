"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";
import { ActionResponse } from "./seller-register.action";
import * as z from "zod";

const UnpublishSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
});

export async function unpublishProduct(
  input: z.infer<typeof UnpublishSchema>
): Promise<ActionResponse<{ productId: string }>> {
  try {
    // 1. Session check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "You must be logged in to unpublish products" },
      };
    }

    const userId = session.user.id;

    // 2. Input validation
    const validation = UnpublishSchema.safeParse(input);
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

    // 3. Fetch product to verify ownership
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          include: {
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

    // 4. Update status to unpublished (does not clear publishedAt per specs)
    await prisma.product.update({
      where: { id: productId },
      data: {
        isPublished: false,
      },
    });

    // 5. PostHog tracking
    trackEvent(userId, "product_unpublished", {
      sellerId: product.sellerId,
      productId,
    });

    return {
      success: true,
      data: {
        productId,
      },
    };
  } catch (error: any) {
    captureAndLogError(error, "unpublishProduct", { input });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred during unpublishing",
      },
    };
  }
}
