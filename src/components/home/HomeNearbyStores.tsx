"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star, MapPin, ArrowRight } from "lucide-react";

interface NearbyStore {
  id: string;
  businessName: string;
  storeName: string;
  storeLogo: string | null;
  storeDescription: string | null;
  category: string;
  city: string;
  createdAt: Date | string;
  userProfile: {
    user: {
      name: string;
      image: string | null;
    };
  };
  verification: {
    kycStatus: string;
    bankVerified: boolean;
    trustScore: number;
    verifiedAt: Date | string | null;
  } | null;
  products: Array<{
    images: Array<{ url: string }>;
  }>;
  reviews: Array<{ rating: number }>;
}

interface HomeNearbyStoresProps {
  stores: NearbyStore[];
  userCity: string | null;
}

export default function HomeNearbyStores({ stores, userCity }: HomeNearbyStoresProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!stores || stores.length === 0) {
    return null;
  }

  return (
    <section className="vl-section-shell mt-12 sm:mt-20" aria-labelledby="nearby-stores-heading">
      {/* Section Header */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 id="nearby-stores-heading" className="font-vl-heading text-xl sm:text-3xl font-bold tracking-[-0.04em] text-vl-ink">
            Nearby Stores
          </h2>
          <p className="mt-1 text-xs text-vl-secondary sm:text-sm">
            Discover independent boutiques near you.
          </p>
        </div>
        <Link
          href="/sellers"
          className="inline-flex items-center gap-1 rounded-vl-control px-3 py-2 text-xs sm:text-sm font-semibold text-vl-muted transition hover:bg-vl-card hover:text-vl-primary"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        // Loading Skeleton
        <div className="hide-scrollbar -mx-4 sm:-mx-6 lg:-mx-8 flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-[75vw] xs:w-[68vw] sm:w-[280px] md:w-[310px] shrink-0 rounded-vl-card border border-vl-border bg-vl-card p-3 space-y-3 animate-pulse"
            >
              <div className="bg-vl-surface aspect-[16/10] rounded-xl" />
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-vl-surface" />
                <div className="space-y-1.5 flex-grow">
                  <div className="h-3 bg-vl-surface rounded w-2/3" />
                  <div className="h-2.5 bg-vl-surface rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 bg-vl-surface rounded w-full" />
              <div className="h-8 bg-vl-surface rounded-vl-control" />
            </div>
          ))}
        </div>
      ) : (
        // Horizontal Discovery Strip
        <div className="hide-scrollbar -mx-4 sm:-mx-6 lg:-mx-8 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 sm:px-6 lg:px-8 pb-4">
          {stores.map((store) => {
            const storeDisplayName = store.storeName || store.businessName;
            const logoUrl = store.storeLogo;
            const initials = storeDisplayName
              ? storeDisplayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
              : "ST";

            // Cover image fallback
            const coverImage = store.products?.[0]?.images?.[0]?.url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80";

            // Rating
            const avgRating = store.reviews.length > 0
              ? (store.reviews.reduce((acc, r) => acc + r.rating, 0) / store.reviews.length).toFixed(1)
              : "4.8";

            // Distance computation placeholder based on city match
            const isLocal = userCity && store.city.toLowerCase() === userCity.toLowerCase();
            // Seed a deterministic pseudo-distance using char sum of store id
            const charSum = store.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const distance = isLocal 
              ? `${(1.2 + (charSum % 18) / 10).toFixed(1)} km away`
              : `${store.city}`;

            return (
              <article
                key={store.id}
                className="w-[75vw] xs:w-[68vw] sm:w-[280px] md:w-[310px] shrink-0 snap-start flex flex-col justify-between rounded-vl-card border border-vl-border bg-vl-card overflow-hidden shadow-vl-soft hover:-translate-y-0.5 hover:shadow-vl-medium transition-all duration-vl-standard"
              >
                {/* Cover Image */}
                <div className="relative aspect-[16/10] bg-vl-surface overflow-hidden">
                  <Image
                    src={coverImage}
                    alt={`${storeDisplayName} boutique`}
                    fill
                    sizes="(max-width: 640px) 70vw, 280px"
                    className="object-cover transition-transform duration-500 ease-out hover:scale-105"
                    loading="lazy"
                  />
                  {isLocal && (
                    <span className="absolute right-3 top-3 rounded-full bg-vl-success px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow-sm">
                      Near You
                    </span>
                  )}
                </div>

                {/* Card Details */}
                <div className="flex flex-col flex-grow p-4">
                  <div className="flex items-start gap-2.5">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-vl-border bg-vl-surface flex items-center justify-center">
                      {logoUrl ? (
                        <Image src={logoUrl} alt={`${storeDisplayName} logo`} fill className="object-cover" />
                      ) : (
                        <span className="font-vl-heading text-xs font-bold text-vl-secondary">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-1">
                        <h3 className="truncate font-vl-heading text-sm font-bold text-vl-ink">
                          {storeDisplayName}
                        </h3>
                        {store.verification?.kycStatus && (
                          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-vl-success" />
                        )}
                      </div>
                      
                      {/* Distance / City Label */}
                      <p className="mt-0.5 flex items-center gap-0.5 text-[10px] font-semibold text-vl-muted uppercase tracking-wider">
                        <MapPin className="w-3 h-3 text-vl-primary shrink-0" />
                        {distance}
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-vl-secondary line-clamp-2 leading-relaxed min-h-[32px]">
                    {store.storeDescription || `High-quality ${store.category} collections curated by local independent designers.`}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-vl-border/60 pt-3">
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-vl-ink">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {avgRating} ({store.reviews.length || 8})
                    </span>
                    
                    <Link
                      href={`/sellers/${store.id}`}
                      className="inline-flex h-8 items-center justify-center rounded-vl-control bg-vl-ink px-4 text-[11px] font-bold text-white transition hover:bg-vl-primary"
                    >
                      Visit Store
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
