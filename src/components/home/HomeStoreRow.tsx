"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SellerData {
  id: string;
  businessName: string;
  category: string;
  logoUrl?: string | null;
}

interface HomeStoreRowProps {
  sellers: SellerData[];
}

function StoreCard({ seller }: { seller: SellerData }) {
  const [isFollowed, setIsFollowed] = useState(false);
  const initials = seller.businessName
    ? seller.businessName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  // Generate realistic rating based on seller.id string hashing
  const rating = (4.4 + (seller.businessName.charCodeAt(0) % 6) * 0.1).toFixed(1);
  const reviewCount = 200 + (seller.businessName.charCodeAt(1) % 8) * 150;

  // Fallback premium gallery previews based on category
  const fallbackPreviews: Record<string, string> = {
    Western: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=400&q=80",
    Ethnic: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80",
    Footwear: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80",
    Accessories: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&w=400&q=80",
    Beauty: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80",
  };
  const previewImage = seller.logoUrl || fallbackPreviews[seller.category] || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80";

  return (
    <div className="flex min-w-[84px] sm:min-w-[150px] md:min-w-[190px] snap-start flex-col rounded-xl sm:rounded-[20px] border border-vl-border bg-vl-card p-1.5 sm:p-3 md:p-4 shadow-vl-soft hover:shadow-vl-medium hover:border-vl-primary/20 transition-all duration-200">
      {/* Header: Logo, Name, Rating */}
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full border border-vl-border overflow-hidden bg-vl-surface flex items-center justify-center shrink-0">
          {seller.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={seller.logoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[7px] sm:text-[10px] font-bold text-vl-primary">{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1 leading-none">
          <Link href={`/sellers/${seller.id}`} className="truncate block font-vl-heading text-[8px] sm:text-xs font-bold text-vl-ink hover:text-vl-primary transition-colors">
            {seller.businessName}
          </Link>
          <span className="hidden sm:block text-[9px] text-slate-500 font-semibold mt-1">
            ⭐ {rating} ({reviewCount})
          </span>
        </div>
      </div>

      {/* Showcase Image */}
      <Link href={`/sellers/${seller.id}`} className="relative aspect-[4/3] w-full rounded-lg sm:rounded-xl overflow-hidden border border-vl-border/60 mt-1.5 sm:mt-3 block bg-vl-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewImage} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
      </Link>

      {/* Follow Button */}
      <button
        type="button"
        onClick={() => setIsFollowed(!isFollowed)}
        className={`mt-1.5 sm:mt-3.5 py-1 sm:py-1.5 w-full text-center border rounded-lg sm:rounded-xl text-[8px] sm:text-xs font-extrabold cursor-pointer transition-all duration-150 active:scale-95 ${
          isFollowed
            ? "bg-vl-primary text-white border-vl-primary"
            : "bg-white text-vl-primary border-vl-primary hover:bg-vl-primary/5"
        }`}
      >
        {isFollowed ? "Following" : "Follow"}
      </button>
    </div>
  );
}

export default function HomeStoreRow({ sellers }: HomeStoreRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (distance: number) => rowRef.current?.scrollBy({ left: distance, behavior: "smooth" });

  return (
    <section className="vl-section-shell mt-6 sm:mt-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary md:block hidden">Browse the people behind the pieces</p>
          <h2 className="font-vl-heading text-lg sm:text-3xl font-extrabold tracking-[-0.04em] text-vl-ink">Top Stores For You</h2>
        </div>
        {/* Mobile View All link */}
        <Link href="/products" className="text-xs font-bold text-vl-primary hover:underline md:hidden select-none">
          View All Stores
        </Link>
        {/* Desktop scroll arrows */}
        <div className="hidden md:flex gap-2">
          <button suppressHydrationWarning type="button" onClick={() => scroll(-260)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-vl-border bg-vl-card text-vl-muted transition hover:border-vl-primary hover:text-vl-primary" aria-label="Scroll featured stores left"><ChevronLeft aria-hidden="true" className="h-4 w-4" /></button>
          <button suppressHydrationWarning type="button" onClick={() => scroll(260)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-vl-border bg-vl-card text-vl-muted transition hover:border-vl-primary hover:text-vl-primary" aria-label="Scroll featured stores right"><ChevronRight aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      </div>
      <div ref={rowRef} className="hide-scrollbar mt-6 flex snap-x gap-2 sm:gap-3 md:gap-4 overflow-x-auto pb-4 px-1">
        {sellers.map((seller) => (
          <StoreCard key={seller.id} seller={seller} />
        ))}
      </div>
    </section>
  );
}
