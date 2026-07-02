"use server";

/**
 * review-create.action.ts — Buyer submits a product/seller review.
 * Requires: BUYER role, order ownership, order in delivered/completed status.
 * Rate-limited: 5 reviews per user per hour (Redis).
 * Atomic: Review creation + Product rating recalculation in single Prisma $transaction.
 */

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";
import { z } from "zod";
import { ActionResponse } from "@/actions/seller-register.action";

// ── Validation Schema ──────────────────────────────────────────────────────────

const ReviewSchema = z.object({
  orderId: z.string().uuid("Invalid order ID."),
  productId: z.string().uuid("Invalid product ID."),
  rating: z.number().int().min(1, "Minimum rating is 1.").max(5, "Maximum rating is 5."),
  comment: z.string().max(500, "Comment must be under 500 characters.").optional(),
  photoUrls: z
    .array(z.string().url("Invalid photo URL."))
    .max(3, "Maximum 3 photos allowed.")
    .optional()
    .default([]),
});

export type ReviewCreateInput = z.infer<typeof ReviewSchema>;

interface ReviewResult {
  reviewId: string;
  newAverageRating: number;
  newReviewCount: number;
}

const RATE_LIMIT_WINDOW_SECONDS = 3600; // 1 hour
const RATE_LIMIT_MAX = 5;

export async function createReviewAction(
  input: ReviewCreateInput
): Promise<ActionResponse<ReviewResult>> {
  try {
    // ── Input validation ────────────────────────────────────────────────────────
    const parseResult = ReviewSchema.safeParse(input);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0];
      return { success: false, error: { code: "VALIDATION_ERROR", message: firstError.message } };
    }
    const { orderId, productId, rating, comment, photoUrls } = parseResult.data;

    // ── Auth: authenticated user required ───────────────────────────────────────
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in." } };
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return { success: false, error: { code: "FORBIDDEN", message: "User profile not found." } };
    }

    // ── Redis rate-limit ────────────────────────────────────────────────────────
    const rateLimitKey = `rate-limit:review:${userProfile.id}`;
    const count = await redis.incr(rateLimitKey);
    if (count === 1) {
      await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
    }
    if (count > RATE_LIMIT_MAX) {
      return {
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many reviews. Please wait before submitting another." },
      };
    }

    // ── Order validation + duplicate check + atomic review create ───────────────
    const result = await prisma.$transaction(async (tx) => {
      // Fetch order with ownership check
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { seller: true },
      });

      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (order.buyerId !== userProfile.id) throw new Error("FORBIDDEN");

      const deliveredStatuses: string[] = ["delivered", "completed"];
      if (!deliveredStatuses.includes(order.status)) {
        throw new Error(`INVALID_ORDER_STATUS:${order.status}`);
      }

      // Verify product belongs to this order
      const orderItem = await tx.orderItem.findFirst({
        where: { orderId, productId },
      });
      if (!orderItem) throw new Error("PRODUCT_NOT_IN_ORDER");

      // Duplicate review check
      const existing = await tx.review.findUnique({ where: { orderId } });
      if (existing) throw new Error("REVIEW_ALREADY_EXISTS");

      // Create the review
      const review = await tx.review.create({
        data: {
          orderId,
          buyerId: userProfile.id,
          sellerId: order.sellerId,
          productId,
          rating,
          comment: comment ?? null,
          photoUrls: photoUrls ?? [],
          isVisible: true,
        },
      });

      // Recalculate product average rating atomically
      const aggregate = await tx.review.aggregate({
        where: { productId, isVisible: true },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const newAvg = aggregate._avg.rating ?? rating;
      const newCount = aggregate._count.rating;

      await tx.product.update({
        where: { id: productId },
        data: {
          averageRating: newAvg,
          reviewCount: newCount,
        },
      });

      return { review, newAvg, newCount };
    });

    // Revalidate paths to clear Next.js caches so new review and ratings show up immediately
    revalidatePath(`/products/${productId}`);
    revalidatePath(`/sellers/${result.review.sellerId}`);
    revalidatePath(`/account/orders/${orderId}`);

    trackEvent(session.user.id, "review_submitted", {
      orderId,
      productId,
      rating,
      hasPhotos: (photoUrls?.length ?? 0) > 0,
    });

    trackEvent(session.user.id, "seller_rating_updated", {
      productId,
      newAverageRating: result.newAvg,
      newReviewCount: result.newCount,
    });

    return {
      success: true,
      data: {
        reviewId: result.review.id,
        newAverageRating: result.newAvg,
        newReviewCount: result.newCount,
      },
    };
  } catch (err: any) {
    if (err.message === "ORDER_NOT_FOUND") {
      return { success: false, error: { code: "NOT_FOUND", message: "Order not found." } };
    }
    if (err.message === "FORBIDDEN") {
      return { success: false, error: { code: "FORBIDDEN", message: "You do not own this order." } };
    }
    if (err.message?.startsWith("INVALID_ORDER_STATUS")) {
      return { success: false, error: { code: "INVALID_ORDER_STATUS", message: "Reviews can only be submitted for delivered or completed orders." } };
    }
    if (err.message === "PRODUCT_NOT_IN_ORDER") {
      return { success: false, error: { code: "PRODUCT_NOT_IN_ORDER", message: "This product was not part of your order." } };
    }
    if (err.message === "REVIEW_ALREADY_EXISTS") {
      return { success: false, error: { code: "REVIEW_ALREADY_EXISTS", message: "You have already reviewed this order." } };
    }

    captureAndLogError(err, "createReview", { input });
    return { success: false, error: { code: "INTERNAL_ERROR", message: err.message || "Failed to submit review." } };
  }
}
