"use client";

/**
 * ProductCard — Canonical product card for MiniBrands.
 * @redesigned v4.0 — visual redesign only, public API unchanged.
 *
 * Purpose:
 *   Premium Myntra-style fashion product card used across PLP, related
 *   products, search results, wishlists, and recommendation surfaces.
 *
 * States: Default · Hover · Active · Focus · Disabled (toggling) ·
 *         Loading (wishlist) · Out-of-stock · Wishlisted
 *
 * Accessibility:
 *   - Link wraps the entire card with descriptive aria-label
 *   - Wishlist button has aria-label that updates on state change
 *   - All decorative icons marked aria-hidden="true"
 *   - Focus ring inherited from globals.css focus-visible rule
 *   - min-h-11 min-w-11 on all interactive elements (44px touch target)
 */

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Heart, Star, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { Product } from "../types/Product";

interface ProductCardProps {
  product: Product;
  isLoggedIn: boolean;
  onWishlistToggle: (productId: string, isWishlisted: boolean) => Promise<void>;
  /** Index in the grid — used to set priority on first 4 images */
  index?: number;
}

export default function ProductCard({
  product,
  isLoggedIn,
  onWishlistToggle,
  index = 99,
}: ProductCardProps) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);

  const primaryImage = product.images?.[0]?.url || "/placeholder.jpg";
  const secondaryImage = product.images?.[1]?.url || null;
  const brandName = product.seller.storeName || product.seller.businessName || "MiniBrands";

  const priceInINR = Math.round(product.price / 100);
  const mrpInINR = Math.round(product.mrp / 100);

  const formattedPrice = priceInINR.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const formattedMrp = mrpInINR.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const isSellerVerified =
    product.seller.verification &&
    (product.seller.verification.kycStatus === "auto_approved" ||
      product.seller.verification.kycStatus === "approved") &&
    product.seller.verification.bankVerified;

  const isOutOfStock =
    !product.variants ||
    product.variants.length === 0 ||
    product.variants.every((v) => v.stockCount === 0);

  const lowStockVariant = product.variants?.find(
    (v) => v.stockCount > 0 && v.stockCount <= 3
  );

  // Badge config — maps product.badge to pill style
  const badgeStyleMap: Record<string, string> = {
    "Best Seller": "bg-vl-success text-white",
    "New Arrival": "bg-vl-primary text-white",
    "Top Rated": "bg-vl-secondary text-white",
  };
  const badgeLabelMap: Record<string, string> = {
    "Best Seller": "Bestseller",
    "New Arrival": "New",
    "Top Rated": "Top Rated",
  };
  const badgeStyle = product.badge ? badgeStyleMap[product.badge] : null;
  const badgeLabel = product.badge ? badgeLabelMap[product.badge] : null;

  // Wishlist toggle — optimistic UI with rollback on failure
  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push(`/login?redirectTo=${encodeURIComponent("/products")}`);
      return;
    }

    if (isToggling) return;
    setIsToggling(true);
    try {
      await onWishlistToggle(product.id, !!product.isWishlisted);
    } catch (error) {
      console.error("Wishlist toggle error:", error);
    } finally {
      setIsToggling(false);
    }
  };

  const isPriority = index < 4;

  return (
    <Link
      href={`/products/${product.id}`}
      aria-label={`${product.name} by ${brandName} — ${formattedPrice}`}
      className="group relative flex flex-col bg-vl-card border border-vl-border rounded-vl-card overflow-hidden transition-all duration-vl-standard hover:shadow-vl-medium hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vl-primary focus-visible:ring-offset-2"
    >
      {/* ── Image Container ──────────────────────────────────────── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-vl-surface flex-shrink-0">
        {/* Primary image */}
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          priority={isPriority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover object-center transition-all duration-500 ease-out group-hover:scale-[1.03] ${
            secondaryImage ? "lg:group-hover:opacity-0" : ""
          }`}
        />

        {/* Secondary image — hover swap, desktop only */}
        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={`${product.name} — alternate view`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center opacity-0 lg:group-hover:opacity-100 transition-opacity duration-vl-standard"
            aria-hidden="true"
          />
        )}

        {/* ── Top-left: Badge stack ─────────────────────────────── */}
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1.5 pointer-events-none">
          {isOutOfStock ? (
            <span className="inline-flex items-center rounded-md bg-vl-danger px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white leading-tight select-none">
              Sold Out
            </span>
          ) : lowStockVariant ? (
            <span className="inline-flex items-center rounded-md bg-vl-warning/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-vl-warning leading-tight select-none">
              Only {lowStockVariant.stockCount} left
            </span>
          ) : badgeStyle && badgeLabel ? (
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider leading-tight select-none ${badgeStyle}`}>
              {badgeLabel}
            </span>
          ) : null}
        </div>

        {/* ── Top-right: Wishlist button ────────────────────────── */}
        {/* Always visible on mobile; hover-reveal on desktop */}
        <button
          onClick={handleWishlistClick}
          disabled={isToggling}
          aria-label={product.isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`
            absolute right-2.5 top-2.5 z-10
            inline-flex min-h-11 min-w-11 items-center justify-center
            rounded-full bg-white/90 shadow-vl-soft backdrop-blur-sm
            transition-all duration-vl-fast
            lg:opacity-0 lg:group-hover:opacity-100
            ${isToggling ? "opacity-60 cursor-not-allowed pointer-events-none" : "hover:scale-105 active:scale-95"}
          `}
        >
          <Heart
            aria-hidden="true"
            className={`h-[18px] w-[18px] transition-all duration-vl-fast ${
              product.isWishlisted
                ? "fill-vl-primary text-vl-primary"
                : "text-vl-muted"
            }`}
            strokeWidth={2}
          />
        </button>

        {/* ── Bottom: "View Details" overlay (desktop hover only) ─ */}
        <div
          className="absolute inset-x-0 bottom-0 flex justify-center pb-3 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-vl-standard pointer-events-none"
          aria-hidden="true"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-vl-ink/85 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-sm select-none">
            <ShoppingBag className="h-3.5 w-3.5" />
            View Details
          </span>
        </div>

        {/* Sold out scrim */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/30 pointer-events-none" aria-hidden="true" />
        )}
      </div>

      {/* ── Info Section ─────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-3 gap-1 select-none">
        {/* Brand + Verified badge */}
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[10px] font-bold text-vl-muted uppercase tracking-[0.08em] truncate leading-tight">
            {brandName}
          </span>
          {isSellerVerified && (
            <BadgeCheck
              aria-label="Verified seller"
              className="h-3 w-3 shrink-0 text-vl-success"
              strokeWidth={2.5}
            />
          )}
        </div>

        {/* Product name — exactly 2 lines */}
        <h3 className="text-sm font-semibold text-vl-ink leading-tight line-clamp-2 min-h-[40px] group-hover:text-vl-primary transition-colors duration-vl-fast">
          {product.name}
        </h3>

        {/* Rating pill */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="inline-flex items-center gap-0.5 rounded-md bg-vl-success px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
              {product.rating.toFixed(1)}
              <Star aria-hidden="true" className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
            </div>
            <span className="text-[11px] text-vl-muted leading-none">
              ({product.formattedReviews})
            </span>
          </div>
        )}

        {/* Price row — never wraps mid-value */}
        <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
          <span className="text-base font-extrabold text-vl-ink whitespace-nowrap">
            {formattedPrice}
          </span>
          {mrpInINR > priceInINR && (
            <>
              <span className="text-xs text-vl-muted line-through whitespace-nowrap">
                {formattedMrp}
              </span>
              <span className="text-[11px] font-bold text-vl-primary whitespace-nowrap">
                -{product.discountPercent}%
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
