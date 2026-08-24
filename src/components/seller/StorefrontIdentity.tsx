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
        <div className="relative h-[220px] sm:h-[280px] lg:h-[380px] bg-vl-surface overflow-hidden">
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
        <div className="flex flex-col justify-center gap-4 p-5 sm:p-6 lg:p-8 bg-vl-card">
          {/* Logo + Verified */}
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl border border-vl-border bg-vl-primary text-white flex items-center justify-center text-lg font-extrabold shadow-sm">
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
          <div className="space-y-1">
            <h1 className="font-vl-heading text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-vl-ink leading-none">
              {storeDisplayName}
            </h1>
            <p className="text-sm font-medium text-vl-secondary flex flex-wrap items-center gap-1.5">
              <span>{seller.category}</span>
              <span className="text-vl-border">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-vl-primary" />
                {seller.city}, India
              </span>
            </p>
          </div>

          {/* Rating · Products */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 font-bold text-vl-ink">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {averageRating > 0 ? averageRating.toFixed(1) : "New"}
            </span>
            <span className="h-3 w-px bg-vl-border" />
            <span className="font-medium text-vl-secondary">
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </span>
            <span className="h-3 w-px bg-vl-border" />
            <span className="font-medium text-vl-secondary">
              {productsCount} {productsCount === 1 ? "product" : "products"}
            </span>
          </div>

          {/* Short description */}
          <p className="text-[15px] leading-relaxed text-vl-muted line-clamp-3">
            {bioText}
          </p>
        </div>
      </div>
    </div>
  );
}
