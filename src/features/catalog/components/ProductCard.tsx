"use client";

import React, { useState } from "react";
import Link from "next/link";
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
      className="group relative flex flex-col bg-surface-container-lowest border border-border-gray rounded-sm overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] hover:-translate-y-[2px] hover:border-on-surface/20"
    >
      {/* ── Image Container ───────────────────────────────── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-low flex-shrink-0">
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
            className={`absolute top-xs left-xs px-[6px] py-[3px] text-[10px] font-bold uppercase tracking-wider rounded-[2px] leading-tight ${badge.bg} ${badge.text} select-none`}
          >
            {badge.label}
          </span>
        )}

        {/* Wishlist heart — top-right */}
        <button
          onClick={handleWishlistClick}
          disabled={isToggling}
          aria-label={product.isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-xs right-xs w-8 h-8 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-[4px] shadow-sm transition-all duration-200 cursor-pointer z-10 ${
            isToggling ? "opacity-60" : "hover:scale-110 hover:bg-white active:scale-95"
          }`}
        >
          <span
            className={`material-symbols-outlined text-[18px] transition-colors duration-150 ${
              product.isWishlisted ? "text-error-red" : "text-on-surface/50 group-hover:text-on-surface/80"
            }`}
            style={{
              fontVariationSettings: product.isWishlisted
                ? "'FILL' 1, 'wght' 400"
                : "'FILL' 0, 'wght' 300",
            }}
          >
            favorite
          </span>
        </button>
      </div>

      {/* ── Info Section ──────────────────────────────────── */}
      <div className="flex flex-col flex-1 px-[10px] pt-[10px] pb-[12px] gap-[3px]">

        {/* Brand + Verified */}
        <div className="flex items-center gap-[4px] min-w-0">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.04em] truncate leading-tight">
            {brandName}
          </span>
          {isSellerVerified && (
            <span
              className="material-symbols-outlined text-success-green flex-shrink-0"
              style={{ fontSize: "13px", fontVariationSettings: "'FILL' 1" }}
              title="Verified Seller"
            >
              verified
            </span>
          )}
        </div>

        {/* Product Name — 2-line clamp */}
        <h3 className="text-[13px] font-semibold text-on-surface leading-[1.35] line-clamp-2 min-h-[35px]">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-[5px] mt-[1px]">
          <div className="inline-flex items-center gap-[2px] bg-success-green text-white text-[10px] font-bold px-[5px] py-[2px] rounded-[2px] leading-none">
            {product.rating.toFixed(1)}
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "9px", fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
          </div>
          <span className="text-[11px] text-text-muted leading-none">
            ({product.formattedReviews})
          </span>
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-[6px] mt-[5px] flex-wrap">
          <span className="text-[15px] font-bold text-on-surface leading-tight tracking-tight">
            {formattedPrice}
          </span>
          {mrpInINR > priceInINR && (
            <>
              <span className="text-[12px] text-text-muted line-through leading-tight">
                {formattedMrp}
              </span>
              <span className="text-[11px] font-bold text-success-green leading-tight">
                -{product.discountPercent}%
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
