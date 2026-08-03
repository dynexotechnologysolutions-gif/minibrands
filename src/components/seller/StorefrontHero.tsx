"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BadgeCheck } from "lucide-react";

interface StorefrontHeroProps {
  bannerUrl: string | null;
  storeName: string;
  isSellerVerified: boolean;
}

export default function StorefrontHero({ bannerUrl, storeName, isSellerVerified }: StorefrontHeroProps) {
  const coverImage = bannerUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="relative h-48 sm:h-64 lg:h-80 w-full bg-vl-surface overflow-hidden">
      {/* Editorial Cover Parallax */}
      <Image
        src={coverImage}
        alt={`${storeName} editorial banner`}
        fill
        priority
        className="object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-105"
      />
      
      {/* Premium Linear Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-vl-ink/80 via-vl-ink/20 to-transparent" />
      
      {/* Navigation Breadcrumb inside banner */}
      <div className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 pt-4 flex justify-between items-center relative z-10">
        <Link
          href="/products"
          className="inline-flex h-9 items-center gap-1.5 px-4 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md text-xs font-bold rounded-vl-control transition-all border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Catalog</span>
        </Link>

        {isSellerVerified && (
          <div className="inline-flex h-9 items-center gap-1.5 px-4 bg-vl-success text-white text-xs font-bold rounded-full shadow-sm border border-emerald-400/20">
            <BadgeCheck className="w-4 h-4" />
            <span>Verified Merchant</span>
          </div>
        )}
      </div>
    </div>
  );
}
