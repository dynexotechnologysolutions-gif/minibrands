"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionResponse } from "./seller-register.action";

export interface UpdateVariantStockInput {
  variantId: string;
  stockCount: number;
}

export async function updateVariantStockAction(
  input: UpdateVariantStockInput
): Promise<ActionResponse<any>> {
  try {
    const { variantId, stockCount } = input;

    if (stockCount < 0) {
      return {
        success: false,
        error: { code: "BAD_REQUEST", message: "Stock count cannot be negative" },
      };
    }

    // 1. Session check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "You must be logged in as a seller" },
      };
    }

    // 2. Verify Seller Profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: { seller: true },
    });

    if (!userProfile || (userProfile.role !== "SELLER" && userProfile.role !== "ADMIN") || !userProfile.seller) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Only sellers can update inventory" },
      };
    }

    // 3. Find Product Variant and check product ownership
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Product variant not found" },
      };
    }

    if (userProfile.role !== "ADMIN" && variant.product.sellerId !== userProfile.seller.id) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You are not authorized to update this variant" },
      };
    }

    // 4. Update Stock Count
    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { stockCount },
    });

    return {
      success: true,
      data: updatedVariant,
    };
  } catch (err: any) {
    console.error("[updateVariantStockAction Error]", err);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to update stock" },
    };
  }
}
