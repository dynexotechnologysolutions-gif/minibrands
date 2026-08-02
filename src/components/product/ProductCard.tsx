import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import WishlistIconButton from "./WishlistIconButton";

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
    <div className="group relative flex flex-col bg-vl-card border border-vl-border rounded-vl-card overflow-hidden cursor-pointer transition-all duration-vl-standard hover:shadow-vl-medium hover:-translate-y-1">
      {/* ── Image Container ─────────────────────────────── */}
      <Link href={`/products/${product.id}`} className="relative aspect-[3/4] overflow-hidden bg-vl-surface flex-shrink-0 block">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          priority={false}
        />

        {/* Stock badge — top-left */}
        {(isOutOfStock || lowStockVariant) && (
          <div className="absolute top-sm left-sm z-10">
            {isOutOfStock ? (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-vl-danger text-white uppercase tracking-wider leading-tight select-none">
                Sold Out
              </span>
            ) : (
              <span className="inline-flex items-center gap-[3px] px-2 py-1 rounded-md text-[10px] font-bold bg-vl-accent text-vl-ink uppercase tracking-wider leading-tight select-none">
                Only {lowStockVariant!.stockCount} left
              </span>
            )}
          </div>
        )}
      </Link>

      <WishlistIconButton
        productId={product.id}
        isLoggedIn={!!isLoggedIn}
        initialIsWishlisted={!!isWishlisted}
      />

      {/* ── Info Section ────────────────────────────────── */}
      <Link href={`/products/${product.id}`} className="flex flex-col flex-1 p-4 gap-1 select-none">
        {/* Brand + Verified */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-bold text-vl-muted uppercase tracking-[0.06em] truncate leading-tight">
            {product.seller.businessName}
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

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-2 flex-wrap">
          <span className="text-base font-extrabold text-vl-ink">
            {formattedPrice}
          </span>
          <span className="text-xs text-vl-muted line-through">
            {formattedMrp}
          </span>
          <span className="text-[11px] font-bold text-vl-primary">
            -{discountPct}%
          </span>
        </div>
      </Link>
    </div>
  );
}
