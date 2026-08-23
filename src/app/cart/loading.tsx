"use client";

import React from "react";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-vl-border/60 rounded ${className || ""}`} />
);

export default function CartLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header placeholder */}
      <div className="sticky top-0 z-50 w-full border-b border-[#ECECEC]/80 bg-white/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-64 hidden md:block" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-40 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-vl-card border border-vl-border bg-vl-card p-4">
              <Skeleton className="h-24 w-24 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <Skeleton className="h-12 w-48 rounded-vl-control" />
        </div>
      </main>
    </div>
  );
}
