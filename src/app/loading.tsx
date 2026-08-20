"use client";

import React from "react";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-vl-border/60 rounded ${className || ""}`} />
);

export default function HomeLoading() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-vl-surface font-vl-body text-vl-ink">
      {/* Header placeholder */}
      <div className="sticky top-0 z-50 w-full border-b border-[#ECECEC]/80 bg-white/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-64 hidden md:block" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <main className="pb-[76px] md:pb-0 pt-[108px] md:pt-0">
        {/* Hero placeholder */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>

        {/* Categories placeholder */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="flex gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-20 rounded-xl shrink-0" />
            ))}
          </div>
        </div>

        {/* Products placeholder */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-vl-card border border-vl-border bg-vl-card">
                <div className="relative aspect-[3/4] bg-vl-surface">
                  <Skeleton className="absolute inset-0" />
                </div>
                <div className="flex flex-col gap-2 p-3.5 pb-2.5">
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                  <div className="flex items-baseline gap-2 mt-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
