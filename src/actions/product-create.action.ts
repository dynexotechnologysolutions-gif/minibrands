"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductCreateSchema, ProductCreateInput } from "@/schemas/product.schema";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";
import { ActionResponse } from "./seller-register.action";

export async function createProduct(
  input: ProductCreateInput
): Promise<ActionResponse<{ productId: string }>> {
  try {
    // 1. Session check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "You must be logged in to create products" },
      };
    }

    const userId = session.user.id;

    // 2. Fetch UserProfile and Seller details to verify role & status
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        seller: {
          include: {
            verification: true,
          },
        },
      },
    });

    if (
      !userProfile ||
      userProfile.role !== "SELLER" ||
      !userProfile.seller ||
      !userProfile.seller.verification
    ) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Only registered sellers can list products" },
      };
    }

    const seller = userProfile.seller;
    const verification = seller.verification;
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
          message: "Complete seller identity and bank verification before listing products.",
        },
      };
    }

    // 3. Input validation
    const validation = ProductCreateSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Invalid product data",
        },
      };
    }

    const {
      name,
      shortDescription,
      fullDescription,
      category,
      subcategory,
      tags,
      price,
      images,
      variants,
      aiGenerated,
    } = validation.data;

    // 4. Create product with variants and images in transaction
    const product = await prisma.$transaction(async (tx) => {
      return await tx.product.create({
        data: {
          sellerId: seller.id,
          name,
          shortDescription,
          fullDescription,
          category,
          subcategory: subcategory || null,
          tags,
          price,
          aiGenerated,
          images: {
            create: images.map((img, idx) => ({
              url: img.url,
              cloudinaryPublicId: img.cloudinaryPublicId,
              sortOrder: idx,
            })),
          },
          variants: {
            create: variants.map((v) => ({
              size: v.size,
              stockCount: v.stockCount,
            })),
          },
        },
      });
    });

    // 5. PostHog tracking
    trackEvent(userId, "product_created", {
      sellerId: seller.id,
      productId: product.id,
      aiGenerated,
      imageCount: images.length,
      variantCount: variants.length,
    });

    return {
      success: true,
      data: {
        productId: product.id,
      },
    };
  } catch (error: any) {
    captureAndLogError(error, "createProduct", { input });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred during product creation",
      },
    };
  }
}
