"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Heart, Star } from "lucide-react";

export interface StoreSummary {
  id: string;
  name: string;
  category: string;
  city: string;
  logoUrl: string | null;
  coverImage: string | null;
  rating: number;
  reviewCount: number;
  productCount: number;
  trustScore: number;
  isVerified: boolean;
  createdAt: string;
}

interface StoreCardProps {
  store: StoreSummary;
  isFollowed: boolean;
  onToggleFollow: (id: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  badge?: "NEW" | null;
}

export default function StoreCard({
  store,
  isFollowed,
  onToggleFollow,
  isFavorite,
  onToggleFavorite,
  badge = null,
}: StoreCardProps) {
  const href = `/sellers/${store.id}`;
  const initials = store.name
    ? store.name.split(" ").map((n) => n[0] || "").join("").toUpperCase().slice(0, 2)
    : "ST";

  return (
    <article className="group relative flex w-[82%] shrink-0 snap-start flex-col overflow-hidden rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft transition-all duration-200 hover:border-vl-primary/30 hover:shadow-vl-medium md:w-full">
      {/* Store cover */}
      <Link
        href={href}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-vl-surface"
        aria-label={`View ${store.name} store`}
      >
        {store.coverImage ? (
          <Image
            src={store.coverImage}
            alt={`${store.name} storefront`}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 82vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-vl-primary/10 font-vl-heading text-2xl font-bold text-vl-primary">
            {initials}
          </div>
        )}
        {badge === "NEW" ? (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-vl-primary px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
            New
          </span>
        ) : null}
      </Link>

      {/* Favourite action */}
      <button
        type="button"
        onClick={() => onToggleFavorite(store.id)}
        aria-label={isFavorite ? `Remove ${store.name} from favourites` : `Add ${store.name} to favourites`}
        aria-pressed={isFavorite}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-vl-muted shadow-sm backdrop-blur transition-colors duration-200 hover:text-vl-danger"
      >
        <Heart aria-hidden="true" className={`h-4 w-4 ${isFavorite ? "fill-vl-danger text-vl-danger" : ""}`} />
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-3">
          {/* Store logo */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-vl-border bg-vl-surface">
            {store.logoUrl ? (
              <Image src={store.logoUrl} alt="" width={48} height={48} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-vl-primary">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <Link
                href={href}
                className="truncate font-vl-heading text-base font-bold text-vl-ink transition-colors duration-200 hover:text-vl-primary"
              >
                {store.name}
              </Link>
              {store.isVerified ? (
                <BadgeCheck aria-label="Verified store" className="h-4 w-4 shrink-0 text-vl-success" />
              ) : null}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-vl-muted">
              <Star aria-hidden="true" className="h-3.5 w-3.5 fill-vl-accent text-vl-accent" />
              <span className="font-semibold text-vl-ink">{store.rating > 0 ? store.rating.toFixed(1) : "New"}</span>
              <span>({store.reviewCount})</span>
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex items-center gap-2 text-xs text-vl-muted">
          <span className="truncate">{store.category}</span>
          <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-vl-border-strong" />
          <span className="shrink-0">{store.productCount} Products</span>
        </div>

        {/* Follow action */}
        <button
          type="button"
          onClick={() => onToggleFollow(store.id)}
          aria-pressed={isFollowed}
          className={`mt-4 flex min-h-11 w-full items-center justify-center rounded-vl-control border text-sm font-bold transition-all duration-150 active:scale-[0.98] ${
            isFollowed
              ? "border-vl-primary bg-vl-primary text-white"
              : "border-vl-primary bg-white text-vl-primary hover:bg-vl-primary/5"
          }`}
        >
          {isFollowed ? "Following" : "Follow"}
        </button>
      </div>
    </article>
  );
}
