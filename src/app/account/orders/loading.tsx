"use client";

import React from "react";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-vl-border/60 rounded ${className || ""}`} />
);

export default function OrdersLoading() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink">
      {/* Header placeholder */}
      <div className="sticky top-0 z-50 w-full border-b border-[#ECECEC]/80 bg-white/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-64 hidden md:block" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <main className="vl-section-shell flex w-full flex-grow flex-col py-6 sm:py-8 lg:py-10">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-vl-card border border-vl-border bg-vl-card p-4">
              <Skeleton className="h-10 w-10 rounded-full mb-3" />
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-5 w-8" />
            </div>
          ))}
        </div>

        {/* Order cards */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-vl-card border border-vl-border bg-vl-card p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
