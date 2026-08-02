"use client";

import React, { useState, useEffect } from "react";
import BrandSpotlightCard from "./BrandSpotlightCard";

interface HomeBrandSpotlightProps {
  brand: Parameters<typeof BrandSpotlightCard>[0]["brand"] | null;
}

export default function HomeBrandSpotlight({ brand }: HomeBrandSpotlightProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mimic quick client-side hydration check to prevent layout shift
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  // Section Visibility Rule: If no brand data is available, do not render anything
  if (!brand) {
    return null;
  }

  return (
    <section className="vl-section-shell mt-10 sm:mt-24" aria-labelledby="brand-spotlight-heading">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">
            Boutique spotlight
          </p>
          <h2 id="brand-spotlight-heading" className="font-vl-heading text-xl sm:text-3xl font-bold tracking-[-0.04em] text-vl-ink">
            Meet Independent Creators
          </h2>
        </div>
      </div>

      {isLoading ? (
        // Premium Skeleton Loader to prevent CLS
        <div className="animate-pulse overflow-hidden rounded-vl-card border border-vl-border bg-vl-card">
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-vl-surface aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-full min-h-[260px] sm:min-h-[380px] lg:min-h-[500px]" />
            <div className="p-6 sm:p-8 lg:p-12 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-vl-surface" />
                <div className="space-y-2 flex-grow">
                  <div className="h-4 bg-vl-surface rounded w-1/3" />
                  <div className="h-3 bg-vl-surface rounded w-1/4" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-vl-surface rounded w-full" />
                <div className="h-4 bg-vl-surface rounded w-5/6" />
                <div className="h-4 bg-vl-surface rounded w-4/5" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-vl-border">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-3 bg-vl-surface rounded w-1/2" />
                    <div className="h-5 bg-vl-surface rounded w-3/4" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="h-12 bg-vl-surface rounded-vl-control flex-grow" />
                <div className="h-12 bg-vl-surface rounded-vl-control w-32" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Render Card once ready
        <div className="brand-spotlight-fade opacity-100 translate-y-0 transition-all duration-700 ease-out">
          <BrandSpotlightCard brand={brand} />
        </div>
      )}
    </section>
  );
}
