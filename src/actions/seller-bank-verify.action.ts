"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BankVerifySchema } from "@/schemas/seller.schema";
import { validateBankAccount } from "@/lib/razorpay";
import { calculateTrustScore } from "@/lib/trust-score";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";
import { ActionResponse } from "./seller-register.action";

export async function verifyBank(formData: {
  accountNumber: string;
  ifsc: string;
}): Promise<ActionResponse<{ verified: boolean }>> {
  const { accountNumber, ifsc } = formData;
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
          message: "You must be logged in to verify your bank account",
        },
      };
    }

    const userId = session.user.id;

    // 2. Validate input schema
    const validation = BankVerifySchema.safeParse(formData);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Invalid bank details",
        },
      };
    }

    // 3. User verification
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: { seller: { include: { verification: true } } },
    });

    if (!userProfile || userProfile.role !== "SELLER" || !userProfile.seller) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN_ROLE",
          message: "Only registered sellers can verify a bank account",
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

    // 4. Validate bank account via Razorpay API (penny drop)
    const validationResult = await validateBankAccount(accountNumber, ifsc);

    if (!validationResult.success) {
      return {
        success: false,
        error: {
          code: "BANK_VERIFICATION_FAILED",
          message: validationResult.message || "Penny drop verification failed.",
        },
      };
    }

    // Extract last 4 digits of the account number
    const last4 = accountNumber.slice(-4);

    // 5. Update bank verification status, calculate trust score in db transaction
    await prisma.$transaction(async (tx) => {
      // Find current kycStatus
      const currentVerification = await tx.sellerVerification.findUnique({
        where: { id: verification.id },
      });

      const kycStatus = currentVerification?.kycStatus || "pending";
      const newTrustScore = calculateTrustScore({ kycStatus, bankVerified: true });

      await tx.sellerVerification.update({
        where: { id: verification.id },
        data: {
          bankAccountLast4: last4,
          bankVerified: true,
          trustScore: newTrustScore,
        },
      });
    });

    // 6. PostHog analytics track
    trackEvent(userId, "seller_bank_verified", {
      sellerId: seller.id,
      bankAccountLast4: last4,
    });

    return {
      success: true,
      data: {
        verified: true,
      },
    };
  } catch (error: any) {
    captureAndLogError(error, "verifyBank", { input: { ifsc, accountNumber: "REDACTED" } });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred during bank verification",
      },
    };
  }
}
