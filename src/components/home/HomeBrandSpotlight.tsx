"use client";

import React, { useState, useEffect } from "react";
import BrandSpotlightCard from "./BrandSpotlightCard";

interface HomeBrandSpotlightProps {
  brands: Array<Parameters<typeof BrandSpotlightCard>[0]["brand"]>;
  userCity: string | null;
}

export default function HomeBrandSpotlight({ brands, userCity }: HomeBrandSpotlightProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mimic quick client-side hydration check to prevent layout shift
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  // Section Visibility Rule: If no brands are available, do not render anything
  if (!brands || brands.length === 0) {
    return null;
  }

  return (
    <section className="vl-section-shell mt-10 sm:mt-24" aria-labelledby="brand-spotlight-heading">
      <div className="flex items-end justify-between gap-4 mb-2">
        <div>
          <p className="mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">
            Boutique spotlight
          </p>
          <h2 id="brand-spotlight-heading" className="font-vl-heading text-xl sm:text-3xl font-bold tracking-[-0.04em] text-vl-ink">
            {userCity ? `Labels Near You in ${userCity}` : "Meet Independent Creators"}
          </h2>
        </div>
      </div>

      {isLoading ? (
        // Premium Horizontal Skeleton Loader to prevent CLS
        <div className="hide-scrollbar -mx-4 sm:-mx-6 lg:-mx-8 flex gap-6 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-[85vw] xs:w-[80vw] sm:w-[450px] lg:w-[600px] shrink-0 animate-pulse overflow-hidden rounded-vl-card border border-vl-border bg-vl-card"
            >
              <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="bg-vl-surface aspect-[4/3] lg:aspect-auto lg:h-full min-h-[220px] sm:min-h-[300px] lg:min-h-[400px]" />
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-vl-surface" />
                    <div className="space-y-1.5 flex-grow">
                      <div className="h-3 bg-vl-surface rounded w-1/2" />
                      <div className="h-2 bg-vl-surface rounded w-1/3" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 bg-vl-surface rounded w-full" />
                    <div className="h-3 bg-vl-surface rounded w-5/6" />
                  </div>
                  <div className="grid grid-cols-4 gap-2 py-3 border-y border-vl-border">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-3 bg-vl-surface rounded" />
                    ))}
                  </div>
                  <div className="h-10 bg-vl-surface rounded-vl-control" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Horizontal Scroll view of Spotlight Cards
        <div className="hide-scrollbar -mx-4 sm:-mx-6 lg:-mx-8 flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 sm:px-6 lg:px-8 pb-4 mt-6">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="brand-spotlight-fade w-[85vw] xs:w-[80vw] sm:w-[450px] lg:w-[600px] shrink-0 snap-start opacity-100 translate-y-0 transition-all duration-700 ease-out"
            >
              <BrandSpotlightCard brand={brand} userCity={userCity} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
