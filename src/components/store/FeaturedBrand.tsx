"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Check, MapPin, Star } from "lucide-react";
import { StoreSummary } from "./StoreCard";

interface FeaturedBrandProps {
  store: StoreSummary | null;
  isFollowed: boolean;
  onToggleFollow: (id: string) => void;
}

export default function FeaturedBrand({ store, isFollowed, onToggleFollow }: FeaturedBrandProps) {
  if (!store) return null;

  const href = `/sellers/${store.id}`;
  const initials = store.name
    ? store.name
        .split(" ")
        .map((n) => n[0] || "")
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "BR";
  const description =
    store.description ||
    (store.category
      ? `Independent ${store.category.toLowerCase()} label based in ${store.city}.`
      : `Independent label based in ${store.city}.`);

  return (
    <section className="mt-8 sm:mt-12">
      <h2 className="font-vl-heading text-xl font-bold tracking-[-0.03em] text-vl-ink sm:text-2xl">Featured Label</h2>
      <p className="mt-1 text-sm text-vl-muted">A brand worth discovering.</p>

      <article className="mt-5 grid overflow-hidden rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-center p-5 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-vl-border bg-vl-surface">
              {store.logoUrl ? (
                <Image src={store.logoUrl} alt="" width={56} height={56} className="h-full w-full object-cover" />
              ) : (
                <span className="text-base font-bold text-vl-primary">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="truncate font-vl-heading text-lg font-bold text-vl-ink sm:text-xl">{store.name}</h3>
                {store.isVerified ? (
                  <BadgeCheck aria-label="Verified store" className="h-5 w-5 shrink-0 text-vl-success" />
                ) : null}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-vl-muted">
                <Star aria-hidden="true" className="h-3.5 w-3.5 fill-vl-accent text-vl-accent" />
                <span className="font-semibold text-vl-ink">{store.rating > 0 ? store.rating.toFixed(1) : "New"}</span>
                <span>({store.reviewCount} reviews)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-vl-muted">
            <span>{store.category}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
              {store.city}
            </span>
            <span>{store.productCount} products</span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-vl-ink/80">{description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={href}
              className="inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-5 text-sm font-bold text-white transition-all duration-150 hover:bg-vl-primary/90 active:scale-[0.98]"
            >
              Visit Store
            </Link>
            <button
              type="button"
              onClick={() => onToggleFollow(store.id)}
              aria-pressed={isFollowed}
              className={`inline-flex min-h-11 items-center justify-center gap-1 rounded-vl-control border px-5 text-sm font-bold transition-all duration-150 active:scale-[0.98] ${
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

        <div className="relative min-h-[220px] md:min-h-full">
          {store.coverImage ? (
            <Image
              src={store.coverImage}
              alt={`${store.name} storefront`}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-vl-primary/10 font-vl-heading text-3xl font-bold text-vl-primary">
              {initials}
            </div>
          )}
        </div>
      </article>
    </section>
  );
}