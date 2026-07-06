"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ReviewCard from "./ReviewCard";

interface ReviewSummary {
  averageRating: number;
  reviewCount: number;
  distribution: Record<number, number>; // { 5: 10, 4: 5, ... }
}

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  photoUrls: string[];
  createdAt: string;
  buyer: { user: { name: string | null } };
}

interface ReviewGalleryProps {
  productId?: string;
  sellerId?: string;
  initialSummary: ReviewSummary;
  initialReviews: ReviewItem[];
}

const PAGE_SIZE = 6;

/**
 * Review gallery with rating summary, distribution bars, and paginated review list.
 * Uses TanStack Query for cursor-based pagination.
 */
export default function ReviewGallery({
  productId,
  sellerId,
  initialSummary,
  initialReviews,
}: ReviewGalleryProps) {
  const [page, setPage] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", productId || sellerId, page],
    queryFn: async () => {
      const url = productId
        ? `/api/products/${productId}/reviews?page=${page}&limit=${PAGE_SIZE}`
        : `/api/sellers/${sellerId}/reviews?page=${page}&limit=${PAGE_SIZE}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load reviews");
      return res.json() as Promise<{
        reviews: ReviewItem[];
        hasMore: boolean;
        total: number;
      }>;
    },
    initialData: page === 0 ? { reviews: initialReviews, hasMore: initialReviews.length >= PAGE_SIZE, total: initialSummary.reviewCount } : undefined,
    staleTime: 0,
  });

  const summary = initialSummary;
  const reviews = data?.reviews ?? [];
  const hasMore = data?.hasMore ?? false;

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScroll();

    container.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [reviews]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (summary.reviewCount === 0) {
    return (
      <div className="py-xl text-center">
        <span className="material-symbols-outlined text-[48px] text-border-gray">grade</span>
        <p className="font-body-md text-secondary mt-sm">No reviews yet. Be the first to review this item.</p>
      </div>
    );
  }

  const maxDistValue = Math.max(...Object.values(summary.distribution), 1);

  const getBarColorClass = (star: number) => {
    if (star >= 4) return "bg-success-green";
    if (star === 3) return "bg-accent-yellow";
    return "bg-error-red";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-xl">
      {/* Left Column: Average Breakdown */}
      <div className="md:col-span-4 space-y-md">
        <div className="flex items-center gap-md sm:gap-lg">
          {/* Large average score */}
          <div className="text-center shrink-0">
            <div className="text-3xl sm:text-4xl font-black text-on-surface flex items-center justify-center gap-1">
              <span>{summary.averageRating.toFixed(1)}</span>
              <span 
                className="material-symbols-outlined text-xl sm:text-2xl text-accent-yellow"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
            </div>
            <div className="text-body-sm font-body-sm text-text-muted mt-1">
              {summary.reviewCount.toLocaleString()} Ratings
            </div>
          </div>

          {/* Rating Progress Bars */}
          <div className="flex-grow space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star] ?? 0;
              const pct = maxDistValue > 0 ? (count / maxDistValue) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-xs sm:gap-sm">
                  <span className="text-body-sm w-5 text-left shrink-0">{star}★</span>
                  <div className="flex-grow h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getBarColorClass(star)}`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-body-sm w-8 text-right shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Review Cards list / Carousel */}
      <div className="md:col-span-8 space-y-md min-w-0">
        {/* Customer Reviews Header & Carousel Controls */}
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-label-bold text-secondary uppercase tracking-wider">
            Customer Reviews ({reviews.length})
          </span>
          {reviews.length > 2 && (
            <div className="flex gap-sm">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="w-8 h-8 rounded-full border border-border-gray flex items-center justify-center hover:bg-surface-container cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-opacity focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Previous reviews"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="w-8 h-8 rounded-full border border-border-gray flex items-center justify-center hover:bg-surface-container cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-opacity focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Next reviews"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          )}
        </div>

        {/* Carousel container */}
        {reviews.length > 2 ? (
          <div 
            ref={scrollContainerRef}
            className="flex gap-md sm:gap-lg overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar pb-sm max-w-full"
          >
            {reviews.map((review) => (
              <div 
                key={review.id} 
                className="snap-start shrink-0 w-full sm:w-[calc(50%-12px)]"
              >
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-lg">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-lg pt-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border-b border-border-gray/30 pb-lg space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-4 bg-surface-container rounded" />
                  <div className="w-32 h-4 bg-surface-container rounded" />
                </div>
                <div className="w-full h-12 bg-surface-container rounded" />
                <div className="w-24 h-3 bg-surface-container rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !isLoading && (
          <div className="pt-md">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="w-full text-center border border-border-gray hover:bg-surface-container py-md rounded font-bold text-body-sm transition-colors cursor-pointer"
            >
              Load More Reviews
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
