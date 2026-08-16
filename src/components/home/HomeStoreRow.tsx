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

export default function HomeStoreRow({ sellers }: HomeStoreRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (distance: number) => rowRef.current?.scrollBy({ left: distance, behavior: "smooth" });

  const getPreviewImage = (category: string, id: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("decor") || id.includes("store-1")) {
      return "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80";
    }
    if (cat.includes("spiritual") || id.includes("store-2") || cat.includes("ethnic")) {
      return "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=400&q=80";
    }
    if (cat.includes("bottle") || id.includes("store-3") || cat.includes("wellness")) {
      return "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80";
    }
    if (cat.includes("living") || id.includes("store-4")) {
      return "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80";
    }
    if (cat.includes("beauty") || id.includes("store-5") || cat.includes("cosmetics")) {
      return "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80";
    }
    return "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80";
  };

  const getMockRating = (id: string) => {
    const charCode = id.charCodeAt(0) || 0;
    const rating = (4.5 + (charCode % 5) * 0.1).toFixed(1);
    const count = (charCode * 7) % 800 + 120;
    return { rating, count };
  };

  return (
    <section className="vl-section-shell mt-6 sm:mt-16">
      {/* Heading Block */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">Top Stores For You</p>
          <h2 className="font-vl-heading text-xl sm:text-3xl font-bold tracking-[-0.04em] text-vl-ink">Featured boutiques</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/products" className="text-xs sm:text-sm font-bold text-[#0F7F7F] hover:underline whitespace-nowrap">
            View All Stores
          </Link>
          <div className="hidden sm:flex gap-1.5">
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => scroll(-240)}
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-vl-border bg-white text-vl-muted transition hover:border-vl-primary hover:text-vl-primary cursor-pointer"
              aria-label="Scroll featured stores left"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => scroll(240)}
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-vl-border bg-white text-vl-muted transition hover:border-vl-primary hover:text-vl-primary cursor-pointer"
              aria-label="Scroll featured stores right"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div
        ref={rowRef}
        className="hide-scrollbar mt-5 flex snap-x gap-4 overflow-x-auto pb-4 scroll-smooth px-0.5"
      >
        {sellers.map((seller) => (
          <StoreCard
            key={seller.id}
            seller={seller}
            previewImage={getPreviewImage(seller.category, seller.id)}
            mockData={getMockRating(seller.id)}
          />
        ))}
      </div>
    </section>
  );
}

interface StoreCardProps {
  seller: SellerData;
  previewImage: string;
  mockData: { rating: string; count: number };
}

function StoreCard({ seller, previewImage, mockData }: StoreCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const initials = seller.businessName
    ? seller.businessName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  return (
    <Link
      href={`/sellers/${seller.id}`}
      className="group flex flex-col justify-between w-[148px] sm:w-[170px] shrink-0 snap-start bg-white rounded-2xl border border-vl-border/70 p-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-vl-primary/25"
    >
      <div className="flex flex-col gap-3">
        {/* Header (Logo + Name + Rating) */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-vl-surface border border-vl-border/60 overflow-hidden flex items-center justify-center shrink-0">
            {seller.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={seller.logoUrl} alt={seller.businessName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-extrabold text-[#0F7F7F]">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-grow">
            <h3 className="font-vl-heading text-xs font-bold text-vl-ink truncate leading-tight group-hover:text-vl-primary transition-colors">
              {seller.businessName}
            </h3>
            <p className="text-[9.5px] text-vl-muted flex items-center gap-0.5 mt-0.5 font-bold">
              <span className="text-[#F39C12] text-[10px]">★</span>
              <span>{mockData.rating} ({mockData.count})</span>
            </p>
          </div>
        </div>

        <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-vl-surface border border-vl-border/40 mt-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt={`${seller.businessName} store preview`}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-3.5 w-full">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFollowing(!isFollowing);
          }}
          className={`w-full py-2 rounded-xl text-[11px] font-extrabold transition-all duration-vl-fast border cursor-pointer active:scale-[0.97] ${
            isFollowing
              ? "bg-vl-surface text-vl-muted border-vl-border hover:bg-vl-border/10"
              : "bg-white text-[#0F7F7F] border-[#0F7F7F]/75 hover:bg-[#0F7F7F]/5"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      </div>
    </Link>
  );
}
