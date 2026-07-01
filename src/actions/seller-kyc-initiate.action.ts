"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initiateKycSession } from "@/lib/signzy";
import { captureAndLogError } from "@/lib/sentry";
import { ActionResponse } from "./seller-register.action";

export async function initiateKyc(): Promise<ActionResponse<{ signzyRedirectUrl: string }>> {
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
          message: "You must be logged in to perform KYC",
        },
      };
    }

    const userId = session.user.id;

    // 2. Role verification
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: { seller: { include: { verification: true } } },
    });

    if (!userProfile || userProfile.role !== "SELLER" || !userProfile.seller) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN_ROLE",
          message: "Only registered sellers can perform identity verification",
        },
      };
    }

    const seller = userProfile.seller;
    const verification = seller.verification;

    if (!verification) {
      return {
        success: false,
        error: {
          code: "STATE_ERROR",
          message: "Seller verification record was not found.",
        },
      };
    }

    // 3. Initiate Signzy KYC session
    const { referenceId, redirectUrl } = await initiateKycSession(seller.id);

    // 4. Persist reference ID in DB
    await prisma.sellerVerification.update({
      where: { id: verification.id },
      data: {
        signzyReferenceId: referenceId,
        kycStatus: "pending", // Reset to pending if retrying
      },
    });

    return {
      success: true,
      data: {
        signzyRedirectUrl: redirectUrl,
      },
    };
  } catch (error: any) {
    captureAndLogError(error, "initiateKyc");
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred during KYC initialization",
      },
    };
  }
}
