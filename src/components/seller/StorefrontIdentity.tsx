"use client";

import React from "react";
import Image from "next/image";
import { BadgeCheck, MapPin, Star } from "lucide-react";

interface StorefrontIdentityProps {
  seller: {
    id: string;
    businessName: string;
    storeName?: string | null;
    storeLogo?: string | null;
    storeBanner?: string | null;
    storeDescription?: string | null;
    city: string;
    category: string;
    verification?: { trustScore: number } | null;
  };
  isSellerVerified: boolean;
  averageRating: number;
  reviewCount: number;
  productsCount: number;
}

export default function StorefrontIdentity({
  seller,
  isSellerVerified,
  averageRating,
  reviewCount,
  productsCount,
}: StorefrontIdentityProps) {
  const storeDisplayName = seller.storeName || seller.businessName;
  const coverImage =
    seller.storeBanner ||
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80";
  const initials = storeDisplayName
    ? storeDisplayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "ST";
  const bioText =
    seller.storeDescription ||
    `Curated ${seller.category} from ${seller.city} — thoughtfully selected, small-batch fashion by independent designers.`;

  return (
    <div className="overflow-hidden rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft">
      {/* Desktop 55/45 split, Mobile stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%]">
        {/* Cover / Brand Image */}
        <div className="relative h-[180px] sm:h-[220px] lg:h-[300px] bg-vl-surface overflow-hidden">
          <Image
            src={coverImage}
            alt={`${storeDisplayName} cover`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-vl-ink/40 via-transparent to-transparent lg:hidden" />
        </div>

        {/* Store Information */}
        <div className="flex flex-col justify-center gap-3 p-4 sm:p-5 lg:p-6 bg-vl-card">
          {/* Logo + Verified */}
          <div className="flex items-center gap-2">
            <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-xl border border-vl-border bg-vl-primary text-white flex items-center justify-center text-base font-extrabold shadow-sm">
              {seller.storeLogo ? (
                <Image src={seller.storeLogo} alt={storeDisplayName} fill className="object-cover" />
              ) : (
                initials
              )}
            </div>
            {isSellerVerified && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-100">
                <BadgeCheck className="h-4 w-4" />
                Verified Boutique
              </span>
            )}
          </div>

          {/* Store Name */}
          <div className="space-y-0.5">
            <h1 className="font-vl-heading text-xl sm:text-2xl font-extrabold tracking-[-0.03em] text-vl-ink leading-none">
              {storeDisplayName}
            </h1>
            <p className="text-xs font-medium text-vl-secondary flex flex-wrap items-center gap-1">
              <span>{seller.category}</span>
              <span className="text-vl-border">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-vl-primary" />
                {seller.city}, India
              </span>
            </p>
          </div>

          {/* Rating · Products */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-vl-ink">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {averageRating > 0 ? averageRating.toFixed(1) : "New"}
            </span>
            <span className="h-2.5 w-px bg-vl-border" />
            <span className="font-medium text-vl-secondary">
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </span>
            <span className="h-2.5 w-px bg-vl-border" />
            <span className="font-medium text-vl-secondary">
              {productsCount} {productsCount === 1 ? "product" : "products"}
            </span>
          </div>

          {/* Short description */}
          <p className="text-[13px] leading-relaxed text-vl-muted line-clamp-2">
            {bioText}
          </p>
        </div>
      </div>
    </div>
  );
}
