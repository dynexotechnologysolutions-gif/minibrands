"use client";

import React from "react";
import { ShieldCheck, Heart } from "lucide-react";
import ReviewGallery from "@/components/review/ReviewGallery";

interface StorefrontReviewsProps {
  sellerId: string;
  reviewSummary: {
    averageRating: number;
    reviewCount: number;
    distribution: Record<number, number>;
  };
  formattedInitialReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    photoUrls: string[];
    createdAt: string;
    buyer: { user: { name: string } };
  }>;
  storeDisplayName: string;
}

export default function StorefrontReviews({
  sellerId,
  reviewSummary,
  formattedInitialReviews,
  storeDisplayName,
}: StorefrontReviewsProps) {
  return (
    <div id="storefront-reviews" className="space-y-6">
      {/* Section Header */}
      <div className="flex items-end justify-between border-b border-vl-border pb-4">
        <div>
          <h2 className="font-vl-heading text-lg font-bold tracking-tight text-vl-ink">
            Customer Love
          </h2>
          <p className="text-xs text-vl-muted">
            Verified ratings and review updates from boutique buyers of {storeDisplayName}
          </p>
        </div>
      </div>

      {/* Trust Badges Strip */}
      <div className="flex flex-wrap gap-4 text-xs font-semibold text-vl-muted">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-vl-success" /> 100% Verified Purchases Only
        </span>
        <span className="inline-flex items-center gap-1">
          <Heart className="w-4 h-4 text-vl-primary" /> 98% Positive Feedback Rating
        </span>
      </div>

      {/* Render Canonical Reviews component inside Redesigned context */}
      <div className="bg-vl-card rounded-vl-card border border-vl-border p-4 sm:p-6 shadow-vl-soft">
        <ReviewGallery
          sellerId={sellerId}
          initialSummary={reviewSummary}
          initialReviews={formattedInitialReviews}
        />
      </div>
    </div>
  );
}
