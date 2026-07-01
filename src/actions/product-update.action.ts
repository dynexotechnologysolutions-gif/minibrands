"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductUpdateSchema, ProductUpdateInput } from "@/schemas/product.schema";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";
import { ActionResponse } from "./seller-register.action";

export async function updateProduct(
  input: ProductUpdateInput
): Promise<ActionResponse<{ productId: string }>> {
  try {
    // 1. Session check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "You must be logged in to update products" },
      };
    }

    const userId = session.user.id;

    // 2. Validate input
    const validation = ProductUpdateSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Invalid update data",
        },
      };
    }

    const { productId, ...fields } = validation.data;

    // 3. Fetch product to check existence & ownership
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
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

    // Compare seller's userProfile's userId with the current session userId
    if (product.seller.userProfile.userId !== userId) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You do not own this product" },
      };
    }

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
          message: "Complete seller identity and bank verification before updating products.",
        },
      };
    }

    // 4. Update product details, images, and variants inside transaction
    await prisma.$transaction(async (tx) => {
      // Update base fields
      await tx.product.update({
        where: { id: productId },
        data: {
          name: fields.name,
          shortDescription: fields.shortDescription,
          fullDescription: fields.fullDescription,
          category: fields.category,
          subcategory: fields.subcategory,
          tags: fields.tags,
          price: fields.price,
        },
      });

      // Synchronize images (delete old, insert new)
      if (fields.images) {
        await tx.productImage.deleteMany({ where: { productId } });
        await tx.productImage.createMany({
          data: fields.images.map((img, idx) => ({
            productId,
            url: img.url,
            cloudinaryPublicId: img.cloudinaryPublicId,
            sortOrder: idx,
          })),
        });
      }

      // Synchronize variants (delete old, insert new)
      if (fields.variants) {
        await tx.productVariant.deleteMany({ where: { productId } });
        await tx.productVariant.createMany({
          data: fields.variants.map((v) => ({
            productId,
            size: v.size,
            stockCount: v.stockCount,
          })),
        });
      }
    });

    // Determine what changed
    const fieldsChanged = Object.keys(fields);

    // 5. PostHog tracking
    trackEvent(userId, "product_updated", {
      sellerId: product.sellerId,
      productId,
      fieldsChanged,
    });

    return {
      success: true,
      data: {
        productId,
      },
    };
  } catch (error: any) {
    captureAndLogError(error, "updateProduct", { input });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred during product update",
      },
    };
  }
}
