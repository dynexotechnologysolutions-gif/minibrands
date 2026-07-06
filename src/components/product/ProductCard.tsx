import React from "react";
import Image from "next/image";
import Link from "next/link";

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
}

export default function ProductCard({ product }: ProductCardProps) {
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
    <Link
      href={`/products/${product.id}`}
      aria-label={`${product.name} — ${formattedPrice}`}
      className="group relative flex flex-col bg-surface-container-lowest border border-border-gray rounded-sm overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] hover:-translate-y-[2px] hover:border-on-surface/20"
    >
      {/* ── Image Container ─────────────────────────────── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-low flex-shrink-0">
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
          <div className="absolute top-xs left-xs">
            {isOutOfStock ? (
              <span className="inline-flex items-center px-[6px] py-[3px] rounded-[2px] text-[10px] font-bold bg-error text-on-error uppercase tracking-wider leading-tight select-none">
                Sold Out
              </span>
            ) : (
              <span className="inline-flex items-center gap-[3px] px-[6px] py-[3px] rounded-[2px] text-[10px] font-bold bg-accent-yellow text-on-surface uppercase tracking-wider leading-tight select-none">
                Only {lowStockVariant!.stockCount} left
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Info Section ────────────────────────────────── */}
      <div className="flex flex-col flex-1 px-[10px] pt-[10px] pb-[12px] gap-[3px]">

        {/* Brand + Verified */}
        <div className="flex items-center gap-[4px] min-w-0">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.04em] truncate leading-tight">
            {product.seller.businessName}
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
        <h3 className="text-[13px] font-semibold text-on-surface leading-[1.35] line-clamp-2 min-h-[35px] group-hover:text-primary transition-colors duration-200">
          {product.name}
        </h3>

        {/* Category pill */}
        <span className="self-start text-[10px] font-medium text-text-muted uppercase tracking-[0.05em] mt-[1px]">
          {product.category}
        </span>

        {/* Price row */}
        <div className="flex items-baseline gap-[6px] mt-[6px] flex-wrap">
          <span className="text-[15px] font-bold text-on-surface leading-tight tracking-tight">
            {formattedPrice}
          </span>
          <span className="text-[12px] text-text-muted line-through leading-tight">
            {formattedMrp}
          </span>
          <span className="text-[11px] font-bold text-success-green leading-tight">
            -{discountPct}%
          </span>
        </div>
      </div>
    </Link>
  );
}
