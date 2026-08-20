"use client";

import React from "react";

const CarouselRowSkeleton = () => (
  <div className="mt-8 sm:mt-12">
    <div className="h-6 w-44 rounded bg-vl-border/80 animate-pulse motion-reduce:animate-none" />
    <div className="mt-1 h-3.5 w-64 rounded bg-vl-border/60 animate-pulse motion-reduce:animate-none" />
    <div className="-mx-4 mt-5 flex gap-4 overflow-hidden px-4 md:mx-0 md:px-0">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="w-[65%] shrink-0 md:w-1/4"
        >
          <div className="aspect-[16/10] w-full rounded-vl-card bg-vl-border/50 animate-pulse motion-reduce:animate-none" />
          <div className="mt-3 h-4 w-3/4 rounded bg-vl-border/80 animate-pulse motion-reduce:animate-none" />
          <div className="mt-2 h-3 w-1/2 rounded bg-vl-border/60 animate-pulse motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  </div>
);

export default function StoresLoading() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white font-sans text-vl-ink">
      <div aria-hidden="true" className="hidden md:block h-20 w-full border-b border-vl-border bg-white" />
      <div
        aria-hidden="true"
        className="md:hidden fixed inset-x-0 top-0 z-50 h-[calc(4.25rem+env(safe-area-inset-top))] border-b border-vl-border bg-white shadow-vl-soft"
      />

      <main className="w-full overflow-x-hidden pb-[76px] pt-[calc(119px+env(safe-area-inset-top))] md:pb-0 md:pt-0">
        <div className="vl-section-shell">
          {/* Hero */}
          <div className="pt-3 sm:pt-10">
            <div className="h-8 w-56 rounded bg-vl-border/80 animate-pulse motion-reduce:animate-none sm:h-9 sm:w-64" />
            <div className="mt-2 h-4 w-72 rounded bg-vl-border/60 animate-pulse motion-reduce:animate-none sm:w-96" />
            <div className="mt-5 h-12 w-full rounded-vl-control bg-vl-border/50 animate-pulse motion-reduce:animate-none" />
            <div className="mt-4 flex gap-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-11 w-24 rounded-full bg-vl-border/60 animate-pulse motion-reduce:animate-none"
                />
              ))}
            </div>
          </div>

          {/* Featured brand */}
          <div className="mt-8 sm:mt-12">
            <div className="h-6 w-40 rounded bg-vl-border/80 animate-pulse motion-reduce:animate-none" />
            <div className="mt-5 grid overflow-hidden rounded-vl-card border border-vl-border bg-vl-card md:grid-cols-[1.1fr_1fr]">
              <div className="p-5 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl bg-vl-border/60 animate-pulse motion-reduce:animate-none" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-40 rounded bg-vl-border/80 animate-pulse motion-reduce:animate-none" />
                    <div className="h-3.5 w-24 rounded bg-vl-border/60 animate-pulse motion-reduce:animate-none" />
                  </div>
                </div>
                <div className="mt-5 h-3.5 w-52 rounded bg-vl-border/60 animate-pulse motion-reduce:animate-none" />
                <div className="mt-3 h-4 w-full rounded bg-vl-border/60 animate-pulse motion-reduce:animate-none" />
                <div className="mt-2 h-4 w-4/5 rounded bg-vl-border/60 animate-pulse motion-reduce:animate-none" />
                <div className="mt-6 flex gap-2">
                  <div className="h-11 w-32 rounded-vl-control bg-vl-border/70 animate-pulse motion-reduce:animate-none" />
                  <div className="h-11 w-28 rounded-vl-control bg-vl-border/50 animate-pulse motion-reduce:animate-none" />
                </div>
              </div>
              <div className="relative hidden min-h-[240px] bg-vl-border/40 md:block animate-pulse motion-reduce:animate-none" />
            </div>
          </div>

          <CarouselRowSkeleton />
          <CarouselRowSkeleton />
          <CarouselRowSkeleton />

          {/* The Edit */}
          <div className="mt-8 sm:mt-12">
            <div className="h-6 w-40 rounded bg-vl-border/80 animate-pulse motion-reduce:animate-none" />
            <div className="mt-5 flex gap-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-11 w-36 rounded-vl-control bg-vl-border/60 animate-pulse motion-reduce:animate-none"
                />
              ))}
            </div>
          </div>

          {/* All Brands */}
          <section className="mt-8 sm:mt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="h-6 w-36 rounded bg-vl-border/80 animate-pulse motion-reduce:animate-none" />
                <div className="mt-1 h-3.5 w-48 rounded bg-vl-border/60 animate-pulse motion-reduce:animate-none" />
              </div>
              <div className="h-11 w-32 rounded-vl-control bg-vl-border/60 animate-pulse motion-reduce:animate-none" />
            </div>
            <div className="mt-4 h-12 w-full rounded-vl-control bg-vl-border/50 animate-pulse motion-reduce:animate-none" />
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="overflow-hidden rounded-vl-card border border-vl-border bg-vl-card">
                  <div className="aspect-[16/10] w-full bg-vl-border/50 animate-pulse motion-reduce:animate-none" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-3/4 rounded bg-vl-border/80 animate-pulse motion-reduce:animate-none" />
                    <div className="h-3.5 w-1/2 rounded bg-vl-border/60 animate-pulse motion-reduce:animate-none" />
                    <div className="mt-3 h-11 w-full rounded-vl-control bg-vl-border/50 animate-pulse motion-reduce:animate-none" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <div
        aria-hidden="true"
        className="md:hidden fixed inset-x-0 bottom-0 z-50 h-[calc(env(safe-area-inset-bottom)+56px)] rounded-t-[20px] border-t border-vl-border bg-white shadow-vl-soft"
      />
    </div>
  );
}