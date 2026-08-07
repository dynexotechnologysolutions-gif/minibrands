"use client";

import React from "react";

const ProductCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft">
    {/* Aspect ratio wrapper for product image */}
    <div className="relative aspect-[3/4] overflow-hidden bg-vl-surface">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-vl-border via-[#F5F5F8] to-vl-border bg-[length:200%_100%]" />
    </div>
    <div className="flex flex-col gap-2.5 p-3 sm:p-4">
      {/* Brand/Seller */}
      <div className="h-3 w-1/4 rounded animate-pulse bg-vl-border/60" />
      {/* Title */}
      <div className="h-4 w-3/4 rounded animate-pulse bg-vl-border/80" />
      {/* Size and info */}
      <div className="h-3.5 w-1/3 rounded animate-pulse bg-vl-border/60" />
      {/* Price */}
      <div className="h-4 w-1/4 rounded animate-pulse bg-vl-border/80 mt-1" />
      {/* Action button skeleton */}
      <div className="h-10 w-full rounded-vl-control animate-pulse bg-vl-border/80 mt-2" />
    </div>
  </div>
);

export default function WishlistLoading() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink selection:bg-vl-primary/20 pb-20 lg:pb-10">
      {/* Placeholder Desktop Header */}
      <div 
        className="hidden md:block w-full h-20 bg-white border-b border-[#ECECEC]/80"
        aria-hidden="true"
      />

      {/* Placeholder Mobile Header */}
      <div 
        className="md:hidden fixed top-0 left-0 right-0 z-50 h-[calc(4.25rem+env(safe-area-inset-top))] bg-white border-b border-[#ECECEC]/80 shadow-sm"
        aria-hidden="true"
      />

      {/* Main content container mirroring WishlistClient's structure */}
      <main className="vl-section-shell flex w-full flex-grow flex-col pt-[calc(5.75rem+env(safe-area-inset-top))] sm:pt-[calc(6.25rem+env(safe-area-inset-top))] md:pt-8 lg:pt-10 pb-6 sm:pb-8 lg:pb-10">
        
        {/* Title and stats bar placeholder */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-8">
          <div className="space-y-2">
            {/* Title */}
            <div className="h-8 w-48 sm:h-9 sm:w-64 rounded animate-pulse bg-vl-border/80" />
            {/* Subtitle */}
            <div className="h-3.5 w-72 sm:w-96 rounded animate-pulse bg-vl-border/60" />
          </div>
          {/* Badge count */}
          <div className="h-7 w-20 rounded-full animate-pulse bg-vl-border/60 w-fit" />
        </div>

        {/* Product Grid Placeholder */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {Array.from({ length: 4 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>

        {/* Recently Viewed Carousel Placeholder */}
        <section className="border-t border-vl-border pt-10 mt-auto">
          {/* Section title */}
          <div className="h-6 w-48 rounded animate-pulse bg-vl-border/80 mb-6" />
          
          {/* Recommended Product Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex flex-col overflow-hidden rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft">
                <div className="relative aspect-[3/4] overflow-hidden bg-vl-surface">
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-vl-border via-[#F5F5F8] to-vl-border bg-[length:200%_100%]" />
                </div>
                <div className="flex flex-col gap-2.5 p-3 sm:p-4">
                  <div className="h-3 w-1/4 rounded animate-pulse bg-vl-border/60" />
                  <div className="h-4 w-3/4 rounded animate-pulse bg-vl-border/80" />
                  <div className="h-4 w-1/4 rounded animate-pulse bg-vl-border/80 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Placeholder Mobile Bottom Navigation */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[calc(env(safe-area-inset-bottom)+56px)] bg-white border-t border-[#ECECEC] rounded-t-[20px] shadow-[0_-8px_24px_rgba(17,24,39,0.06)]"
        aria-hidden="true"
      />
    </div>
  );
}
