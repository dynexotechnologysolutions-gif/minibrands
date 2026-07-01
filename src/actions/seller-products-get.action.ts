"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { captureAndLogError } from "@/lib/sentry";
import { ActionResponse } from "./seller-register.action";

export async function getSellerProducts(): Promise<ActionResponse<any[]>> {
  try {
    // 1. Session check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "You must be logged in to view your products" },
      };
    }

    const userId = session.user.id;

    // 2. Fetch UserProfile and Seller details to verify role
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: { seller: true },
    });

    if (!userProfile || userProfile.role !== "SELLER" || !userProfile.seller) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Only registered sellers can access the dashboard" },
      };
    }

    // 3. Fetch products where isDeleted is false
    const products = await prisma.product.findMany({
      where: {
        sellerId: userProfile.seller.id,
        isDeleted: false,
      },
      include: {
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        variants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: products,
    };
  } catch (error: any) {
    captureAndLogError(error, "getSellerProducts");
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred while fetching products",
      },
    };
  }
}
