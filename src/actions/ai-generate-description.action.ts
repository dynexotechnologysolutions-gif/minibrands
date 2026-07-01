"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProductDescription, AiProductDescription } from "@/lib/claude-vision";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";
import { ActionResponse } from "./seller-register.action";
import * as z from "zod";

const AiGenerateSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1, "At least one image is required").max(6, "Maximum of 6 images"),
  keywords: z.array(z.string()).optional(),
});

export async function aiGenerateDescription(
  input: z.infer<typeof AiGenerateSchema>
): Promise<ActionResponse<AiProductDescription>> {
  const start = Date.now();
  let sellerId = "unknown";

  try {
    // 1. Session verification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "You must be logged in to use the AI assistant" },
      };
    }

    const userId = session.user.id;

    // 2. Fetch seller details & verify active status
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
        error: {
          code: "FORBIDDEN",
          message: "Only registered sellers can perform this action",
        },
      };
    }

    sellerId = userProfile.seller.id;
    const verification = userProfile.seller.verification;
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
          message: "Complete seller verification before listing products",
        },
      };
    }

    // 3. Validate input parameters
    const validation = AiGenerateSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Invalid input parameters",
        },
      };
    }

    const { imageUrls, keywords = [] } = validation.data;

    // 4. Execute AI call with a hard timeout (14 seconds limit)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI vision request timed out")), 14000)
    );

    const description = await Promise.race([
      generateProductDescription(imageUrls, keywords),
      timeoutPromise,
    ]);

    const latencyMs = Date.now() - start;
    trackEvent(userId, "ai_description_generated", {
      sellerId,
      success: true,
      latencyMs,
      imageCount: imageUrls.length,
    });

    return {
      success: true,
      data: description,
    };
  } catch (error: any) {
    captureAndLogError(error, "aiGenerateDescription", { input });
    const latencyMs = Date.now() - start;
    
    // Attempt tracking even on failure
    try {
      trackEvent(sellerId, "ai_description_generated", {
        sellerId,
        success: false,
        latencyMs,
        error: error.message || "Unknown error",
      });
    } catch {}

    return {
      success: false,
      error: {
        code: "AI_GENERATION_FAILED",
        message: "AI description generation failed. You can write your description manually.",
      },
    };
  }
}
