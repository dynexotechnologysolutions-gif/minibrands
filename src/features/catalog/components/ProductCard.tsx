"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Heart, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { Product } from "../types/Product";

interface ProductCardProps {
  product: Product;
  isLoggedIn: boolean;
  onWishlistToggle: (productId: string, isWishlisted: boolean) => Promise<void>;
}

export default function ProductCard({
  product,
  isLoggedIn,
  onWishlistToggle,
}: ProductCardProps) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);

  const primaryImage = product.images?.[0]?.url || "/placeholder.jpg";
  const brandName = product.seller.storeName || product.seller.businessName || "MINIBRANDS";

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

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push(`/login?redirectTo=${encodeURIComponent("/catalog")}`);
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

  // Badge config
  const badgeConfig: Record<string, { bg: string; text: string; label: string }> = {
    "Best Seller": { bg: "bg-accent-yellow", text: "text-on-surface", label: "Bestseller" },
    "New Arrival": { bg: "bg-primary", text: "text-on-primary", label: "New" },
    "Top Rated": { bg: "bg-success-green", text: "text-white", label: "Top Rated" },
  };

  const badge = product.badge ? badgeConfig[product.badge] : null;

  return (
    <Link
      href={`/products/${product.id}`}
      aria-label={`${product.name} by ${brandName} — ${formattedPrice}`}
      className="group relative flex flex-col bg-vl-card border border-vl-border rounded-vl-card overflow-hidden cursor-pointer transition-all duration-vl-standard hover:shadow-vl-medium hover:-translate-y-1"
    >
      {/* ── Image Container ───────────────────────────────── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-vl-surface flex-shrink-0">
        <img
          src={primaryImage}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-[1.04] transition-transform duration-500 ease-out"
        />

        {/* Gradient scrim for badge legibility */}
        {badge && (
          <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        )}

        {/* Badge — top-left */}
        {badge && (
          <span
            className={`absolute top-sm left-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md leading-tight ${badge.bg === 'bg-primary' ? 'bg-vl-primary text-white' : badge.bg === 'bg-accent-yellow' ? 'bg-vl-accent text-vl-ink' : 'bg-vl-success text-white'} select-none`}
          >
            {badge.label}
          </span>
        )}

        {/* Wishlist heart — top-right */}
        <button
          onClick={handleWishlistClick}
          disabled={isToggling}
          aria-label={product.isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute right-sm top-sm z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/90 shadow-vl-soft backdrop-blur-sm transition duration-vl-fast ${
            isToggling ? "opacity-60" : "hover:scale-105 active:scale-95"
          }`}
        >
          <Heart
            aria-hidden="true"
            className={`h-[18px] w-[18px] ${product.isWishlisted ? "fill-vl-primary text-vl-primary" : "text-vl-muted"}`}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* ── Info Section ──────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-4 gap-1 select-none">
        {/* Brand + Verified */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-bold text-vl-muted uppercase tracking-[0.06em] truncate leading-tight">
            {brandName}
          </span>
          {isSellerVerified && (
            <BadgeCheck
              aria-label="Verified seller"
              className="h-3.5 w-3.5 shrink-0 text-vl-success"
              strokeWidth={2.2}
            />
          )}
        </div>

        {/* Product Name — 2-line clamp */}
        <h3 className="text-sm font-semibold text-vl-ink leading-tight line-clamp-2 min-h-[40px] group-hover:text-vl-primary transition-colors duration-vl-fast">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-[5px] mt-[1px]">
          <div className="inline-flex items-center gap-1 rounded-md bg-vl-success px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {product.rating.toFixed(1)}
            <Star aria-hidden="true" className="h-2.5 w-2.5 fill-current" strokeWidth={1.5} />
          </div>
          <span className="text-[11px] text-vl-muted leading-none">
            ({product.formattedReviews})
          </span>
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-2 flex-wrap">
          <span className="text-base font-extrabold text-vl-ink">
            {formattedPrice}
          </span>
          {mrpInINR > priceInINR && (
            <>
              <span className="text-xs text-vl-muted line-through">
                {formattedMrp}
              </span>
              <span className="text-[11px] font-bold text-vl-primary">
                -{product.discountPercent}%
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
