"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Check, Star } from "lucide-react";

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
  description?: string;
}

interface StoreCardProps {
  store: StoreSummary;
  isFollowed: boolean;
  onToggleFollow: (id: string) => void;
  compact?: boolean;
  carousel?: boolean;
  badge?: "NEW" | null;
}

export default function StoreCard({
  store,
  isFollowed,
  onToggleFollow,
  compact = false,
  carousel = false,
  badge = null,
}: StoreCardProps) {
  const href = `/sellers/${store.id}`;
  const initials = store.name
    ? store.name
        .split(" ")
        .map((n) => n[0] || "")
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  const cardClassName = `group relative flex ${
    carousel ? "w-[65%] shrink-0 snap-start md:w-full" : "w-full"
  } flex-col overflow-hidden rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft transition-all duration-200 hover:border-vl-primary/30 hover:shadow-vl-medium`;

  if (compact) {
    return (
      <article className={cardClassName}>
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
              sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, 65vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-vl-primary/10 font-vl-heading text-2xl font-bold text-vl-primary">
              {initials}
            </div>
          )}
          {badge ? (
            <span className="absolute left-2 top-2 z-10 inline-flex items-center rounded-full bg-vl-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {badge}
            </span>
          ) : null}
        </Link>
        <div className="flex flex-1 flex-col p-3">
          <Link
            href={href}
            className="truncate font-vl-heading text-sm font-bold text-vl-ink transition-colors duration-200 hover:text-vl-primary"
          >
            {store.name}
          </Link>
          <span className="mt-1 truncate text-xs text-vl-muted">{store.category}</span>
        </div>
      </article>
    );
  }

  return (
    <article className={cardClassName}>
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
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 65vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-vl-primary/10 font-vl-heading text-2xl font-bold text-vl-primary">
            {initials}
          </div>
        )}
        {badge ? (
          <span className="absolute left-2 top-2 z-10 inline-flex items-center rounded-full bg-vl-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {badge}
          </span>
        ) : null}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-3">
          {/* Store logo — isolated from buyer profile image, uses seller.storeLogo */}
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
          <span className="truncate">
            {store.category}
            {store.city ? ` · ${store.city}` : ""}
          </span>
          <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-vl-border-strong" />
          <span className="shrink-0">{store.productCount} Products</span>
        </div>

        {/* Actions: Visit Store (primary) + Follow (secondary) */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={href}
            className="inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-2 text-sm font-bold text-white transition-all duration-150 hover:bg-vl-primary/90 active:scale-[0.98]"
          >
            Visit Store
          </Link>
          <button
            type="button"
            onClick={() => onToggleFollow(store.id)}
            aria-pressed={isFollowed}
            className={`inline-flex min-h-11 items-center justify-center gap-1 rounded-vl-control border px-2 text-sm font-bold transition-all duration-150 active:scale-[0.98] ${
              isFollowed
                ? "border-vl-primary bg-vl-primary/10 text-vl-primary"
                : "border-vl-primary bg-white text-vl-primary hover:bg-vl-primary/5"
            }`}
          >
            {isFollowed ? (
              <>
                <Check aria-hidden="true" className="h-4 w-4" />
                Following
              </>
            ) : (
              "Follow"
            )}
          </button>
        </div>
      </div>
    </article>
  );
}