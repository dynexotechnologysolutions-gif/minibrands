"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionResponse } from "./seller-register.action";

export async function checkKycStatus(): Promise<ActionResponse<{ kycStatus: string; bankVerified: boolean }>> {
  try {
    // 1. Session check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to check verification status",
        },
      };
    }

    // 2. Fetch status
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: { seller: { include: { verification: true } } },
    });

    if (!userProfile || !userProfile.seller || !userProfile.seller.verification) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Seller verification details not found",
        },
      };
    }

    return {
      success: true,
      data: {
        kycStatus: userProfile.seller.verification.kycStatus,
        bankVerified: userProfile.seller.verification.bankVerified,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred while checking status",
      },
    };
  }
}
