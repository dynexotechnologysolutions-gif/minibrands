"use client";

/**
 * ProductCard — Catalog listing card for MiniBrands (Stitch redesign).
 * Public API unchanged; presentation updated to the approved listing design.
 *
 * - 1:1 product image with hover swap (desktop)
 * - Wishlist reuses the existing onWishlistToggle flow (guests go to login, as before)
 * - Add to Cart preserves existing behavior:
 *     Authenticated user  → reserveCartItem server action
 *     Guest user          → /api/guest-cart/reserve (no login redirect)
 */

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Heart, ShoppingBag, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { Product } from "../types/Product";
import { reserveCartItem } from "@/actions/cart-reserve.action";

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
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

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

  // Wishlist toggle — optimistic UI with rollback on failure (existing behavior)
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

  // Add to Cart — preserves authenticated + guest flows
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding || isOutOfStock) return;

    setIsAdding(true);
    try {
      const targetVariant = product.variants?.find((v) => v.stockCount > 0) || product.variants?.[0];
      const variantId = targetVariant?.id || "default";

      if (isLoggedIn) {
        const res = await reserveCartItem({
          productId: product.id,
          variantId,
          quantity: 1,
        });
        if (res.success) {
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
          window.dispatchEvent(new Event("cart-updated"));
        } else {
          alert(res.error?.message || "Failed to add to cart");
        }
      } else {
        const res = await fetch("/api/guest-cart/reserve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, variantId, quantity: 1 }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
            window.dispatchEvent(new Event("cart-updated"));
          } else {
            alert(data.error || "Failed to add to cart");
          }
        } else {
          alert("Failed to add to guest cart");
        }
      }
    } catch (err) {
      console.error("Add to cart error:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const isPriority = index < 4;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-vl-card border border-vl-border bg-vl-card transition-all duration-vl-standard hover:shadow-vl-medium hover:-translate-y-1">
      {/* ── Image ───────────────────────────────────────────────── */}
      <Link
        href={`/products/${product.id}`}
        aria-label={`${product.name} by ${brandName} — ${formattedPrice}`}
        className="relative block aspect-square overflow-hidden bg-vl-surface"
      >
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          priority={isPriority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover object-center transition-all duration-500 ease-out group-hover:scale-[1.04] ${
            secondaryImage ? "lg:group-hover:opacity-0" : ""
          }`}
        />

        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={`${product.name} — alternate view`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center opacity-0 transition-opacity duration-vl-standard lg:group-hover:opacity-100"
            aria-hidden="true"
          />
        )}

        {/* Badge stack — top-left */}
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col gap-1.5">
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

        {/* Sold out scrim */}
        {isOutOfStock && (
          <div className="pointer-events-none absolute inset-0 bg-white/30" aria-hidden="true" />
        )}
      </Link>

      {/* ── Wishlist ────────────────────────────────────────────── */}
      <button
        onClick={handleWishlistClick}
        disabled={isToggling}
        aria-label={product.isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className={`
          absolute right-2 top-2 z-20
          inline-flex min-h-9 min-w-9 items-center justify-center
          rounded-full bg-white/90 shadow-vl-soft backdrop-blur-sm
          transition-all duration-vl-fast
          ${isToggling ? "pointer-events-none opacity-60" : "hover:scale-105 active:scale-95"}
        `}
      >
        <Heart
          aria-hidden="true"
          className={`h-4 w-4 transition-all duration-vl-fast ${
            product.isWishlisted ? "fill-vl-primary text-vl-primary" : "text-vl-muted"
          }`}
          strokeWidth={2}
        />
      </button>

      {/* ── Info ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-3">
        <Link href={`/products/${product.id}`} className="flex flex-1 flex-col">
          {/* Brand + Verified */}
          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-vl-muted leading-tight">
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

          {/* Product name — max 2 lines */}
          <h3 className="mt-1 line-clamp-2 min-h-[36px] text-sm font-semibold leading-tight text-vl-ink transition-colors duration-vl-fast group-hover:text-vl-primary">
            {product.name}
          </h3>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="inline-flex items-center gap-0.5 rounded-md bg-vl-success px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                {product.rating.toFixed(1)}
                <Star aria-hidden="true" className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
              </div>
              <span className="text-[11px] text-vl-muted leading-none">
                ({product.formattedReviews})
              </span>
            </div>
          )}

          {/* Price row */}
          <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
            <span className="whitespace-nowrap text-base font-extrabold text-vl-ink">
              {formattedPrice}
            </span>
            {mrpInINR > priceInINR && (
              <>
                <span className="whitespace-nowrap text-xs text-vl-muted line-through">
                  {formattedMrp}
                </span>
                <span className="whitespace-nowrap text-[11px] font-bold text-vl-danger">
                  {product.discountPercent}% OFF
                </span>
              </>
            )}
          </div>
        </Link>

        {/* Add to Cart — existing auth + guest cart flow */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
          aria-label="Add product to cart"
          className={`
            mt-3 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-vl-control text-xs font-bold transition-all duration-vl-fast active:scale-[0.98] select-none ${
              isOutOfStock
                ? "cursor-not-allowed bg-vl-border text-vl-muted"
                : added
                  ? "bg-vl-success text-white"
                  : "bg-vl-primary text-white hover:bg-vl-primary-strong"
            }
          `}
        >
          <ShoppingBag aria-hidden="true" className="h-3.5 w-3.5" />
          <span>
            {isOutOfStock ? "Out of Stock" : isAdding ? "Adding..." : added ? "Added!" : "Add to Cart"}
          </span>
        </button>
      </div>
    </div>
  );
}