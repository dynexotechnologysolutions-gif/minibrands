import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import WishlistIconButton from "./WishlistIconButton";

/**
 * ProductCard (shared component)
 * @redesigned v4.0 — visual redesign only, public API unchanged.
 *
 * Purpose: Shared product card used on wishlist, PDP related, and non-catalog surfaces.
 * Visually consistent with the canonical catalog ProductCard.
 */

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number; // in paise
    category: string;
    images: { url: string; cloudinaryPublicId: string }[];
    variants: { size: string; stockCount: number }[];
    seller: {
      businessName: string;
      verification?: {
        kycStatus: string;
        bankVerified: boolean;
      } | null;
    };
  };
  isLoggedIn?: boolean;
  isWishlisted?: boolean;
}

export default function ProductCard({ product, isLoggedIn, isWishlisted }: ProductCardProps) {
  const primaryImage = product.images?.[0]?.url || "/placeholder.jpg";
  const secondaryImage = product.images?.[1]?.url || null;

  const priceInINR = Math.round(product.price / 100);
  const mrpInINR = Math.round(priceInINR * 1.4);
  const discountPct = Math.round(((mrpInINR - priceInINR) / mrpInINR) * 100);

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

  const lowStockVariant = product.variants?.find(
    (v) => v.stockCount > 0 && v.stockCount <= 3
  );

  const isOutOfStock =
    !product.variants ||
    product.variants.length === 0 ||
    product.variants.every((v) => v.stockCount === 0);

  return (
    <div className="group relative flex flex-col bg-vl-card border border-vl-border rounded-vl-card overflow-hidden transition-all duration-vl-standard hover:shadow-vl-medium hover:-translate-y-1">
      {/* ── Image Container ──────────────────────────────────────── */}
      <Link
        href={`/products/${product.id}`}
        className="relative aspect-[3/4] overflow-hidden bg-vl-surface flex-shrink-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vl-primary focus-visible:ring-offset-2"
        aria-label={`${product.name} by ${product.seller.businessName} — ${formattedPrice}`}
      >
        {/* Primary image */}
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover object-center transition-all duration-500 ease-out group-hover:scale-[1.03] ${
            secondaryImage ? "lg:group-hover:opacity-0" : ""
          }`}
          priority={false}
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

        {/* Stock badge — top-left */}
        {(isOutOfStock || lowStockVariant) && (
          <div className="absolute left-2.5 top-2.5 z-10 pointer-events-none">
            {isOutOfStock ? (
              <span className="inline-flex items-center rounded-md bg-vl-danger px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider leading-tight select-none">
                Sold Out
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-vl-warning/20 px-2 py-0.5 text-[10px] font-bold text-vl-warning uppercase tracking-wider leading-tight select-none">
                Only {lowStockVariant!.stockCount} left
              </span>
            )}
          </div>
        )}

        {/* Sold out scrim */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/30 pointer-events-none" aria-hidden="true" />
        )}
      </Link>

      {/* Wishlist button — top-right, uses existing WishlistIconButton */}
      <WishlistIconButton
        productId={product.id}
        isLoggedIn={!!isLoggedIn}
        initialIsWishlisted={!!isWishlisted}
      />

      {/* ── Info Section ─────────────────────────────────────────── */}
      <Link
        href={`/products/${product.id}`}
        className="flex flex-col flex-1 p-3 gap-1 select-none focus-visible:outline-none"
        tabIndex={-1}
        aria-hidden="true"
      >
        {/* Brand + Verified */}
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[10px] font-bold text-vl-muted uppercase tracking-[0.08em] truncate leading-tight">
            {product.seller.businessName}
          </span>
          {isSellerVerified && (
            <BadgeCheck
              aria-hidden="true"
              className="h-3 w-3 shrink-0 text-vl-success"
              strokeWidth={2.5}
            />
          )}
        </div>

        {/* Product name — 2-line clamp */}
        <h3 className="text-sm font-semibold text-vl-ink leading-tight line-clamp-2 min-h-[40px] group-hover:text-vl-primary transition-colors duration-vl-fast">
          {product.name}
        </h3>

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
          <span className="text-base font-extrabold text-vl-ink whitespace-nowrap">
            {formattedPrice}
          </span>
          <span className="text-xs text-vl-muted line-through whitespace-nowrap">
            {formattedMrp}
          </span>
          <span className="text-[11px] font-bold text-vl-primary whitespace-nowrap">
            -{discountPct}%
          </span>
        </div>
      </Link>
    </div>
  );
}
