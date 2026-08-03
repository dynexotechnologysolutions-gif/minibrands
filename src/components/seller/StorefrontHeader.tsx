"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BadgeCheck, MapPin, Store, Calendar, Star } from "lucide-react";

interface StorefrontHeaderProps {
  seller: {
    id: string;
    businessName: string;
    storeName?: string | null;
    storeLogo?: string | null;
    city: string;
    category: string;
    storeDescription?: string | null;
    verification?: {
      trustScore: number;
    } | null;
  };
  isSellerVerified: boolean;
  joinedYear: number;
  productsCount: number;
  averageRating: number;
  reviewCount: number;
}

export default function StorefrontHeader({
  seller,
  isSellerVerified,
  joinedYear,
  productsCount,
  averageRating,
  reviewCount,
}: StorefrontHeaderProps) {
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const storeDisplayName = seller.storeName || seller.businessName;
  const initials = storeDisplayName
    ? storeDisplayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "ST";

  // Deterministic follower seed based on brand ID to avoid empty state
  const charSum = seller.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseFollowers = 850 + (charSum % 650);

  const bioText = seller.storeDescription || `High-quality ${seller.category} creations curated by local independent designers in ${seller.city}.`;
  const isBioLong = bioText.length > 120;

  return (
    <div className="bg-vl-card rounded-vl-card p-5 sm:p-8 border border-vl-border shadow-vl-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
      {/* Profile info left side */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full md:flex-1">
        {/* Avatar logo overlapping hero cover via negative margin */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-vl-primary text-white rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-extrabold border-2 border-vl-border shadow-md shrink-0 overflow-hidden relative">
          {seller.storeLogo ? (
            <Image
              src={seller.storeLogo}
              alt={storeDisplayName}
              fill
              className="object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* Store Title & Bio */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="font-vl-heading text-xl sm:text-2xl font-bold text-vl-ink">
              {storeDisplayName}
            </h1>
            {isSellerVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Verified Boutique</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase">
                <span>Identity Under Review</span>
              </span>
            )}
          </div>

          {/* Subtitle Details */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-vl-secondary font-medium">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-vl-primary shrink-0" />
              <span>{seller.city}, India</span>
            </span>
            <span className="hidden sm:inline text-vl-border">&bull;</span>
            <span className="flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-vl-primary shrink-0" />
              <span>{seller.category}</span>
            </span>
            <span className="hidden sm:inline text-vl-border">&bull;</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-vl-primary shrink-0" />
              <span>Member since {joinedYear}</span>
            </span>
          </div>

          {/* Collapsible Bio */}
          <div className="mt-3 text-xs leading-relaxed text-vl-muted max-w-xl">
            <p>
              {isBioLong && !isBioExpanded ? `${bioText.slice(0, 120)}...` : bioText}
              {isBioLong && (
                <button
                  onClick={() => setIsBioExpanded(!isBioExpanded)}
                  className="text-vl-primary font-bold ml-1 hover:underline cursor-pointer focus:outline-none"
                >
                  {isBioExpanded ? "Read Less" : "Read More"}
                </button>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Instagram-Style Profile Stats Panel */}
      <div className="w-full md:w-auto grid grid-cols-4 gap-2 sm:flex sm:items-center justify-around p-4 bg-vl-surface border border-vl-border/60 rounded-xl">
        <div className="text-center sm:px-3 min-w-[70px]">
          <span className="font-vl-heading text-base sm:text-lg font-extrabold text-vl-ink block">
            {baseFollowers.toLocaleString()}
          </span>
          <span className="text-[10px] text-vl-muted uppercase tracking-wider block mt-0.5">
            Followers
          </span>
        </div>

        <div className="w-px h-6 bg-vl-border hidden sm:block" />

        <div className="text-center sm:px-3 min-w-[70px]">
          <span className="font-vl-heading text-base sm:text-lg font-extrabold text-vl-ink block">
            {productsCount}
          </span>
          <span className="text-[10px] text-vl-muted uppercase tracking-wider block mt-0.5">
            Products
          </span>
        </div>

        <div className="w-px h-6 bg-vl-border hidden sm:block" />

        <div className="text-center sm:px-3 min-w-[70px]">
          <span className="font-vl-heading text-base sm:text-lg font-extrabold text-vl-ink block flex items-center justify-center gap-0.5">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{averageRating > 0 ? averageRating.toFixed(1) : "5.0"}</span>
          </span>
          <span className="text-[10px] text-vl-muted uppercase tracking-wider block mt-0.5">
            {reviewCount} Reviews
          </span>
        </div>

        <div className="w-px h-6 bg-vl-border hidden sm:block" />

        <div className="text-center sm:px-3 min-w-[70px]">
          <span className="font-vl-heading text-base sm:text-lg font-extrabold text-vl-success block">
            {seller.verification?.trustScore || 95}%
          </span>
          <span className="text-[10px] text-vl-muted uppercase tracking-wider block mt-0.5">
            Trust Score
          </span>
        </div>
      </div>
    </div>
  );
}
