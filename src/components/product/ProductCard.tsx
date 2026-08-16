import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ShoppingCart, Store } from "lucide-react";

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

  // Generate mockup rating and sold counts based on product id
  const charCode = product.id.charCodeAt(0) || 0;
  const rating = (4.3 + (charCode % 7) * 0.1).toFixed(1);
  const soldCount = (charCode * 9) % 1200 + 80;

  // Truncate store name: first word, or first 12 chars if single long word
  const rawName = product.seller.businessName || "Store";
  const firstWord = rawName.split(" ")[0];
  const storeName = firstWord.length > 12 ? firstWord.slice(0, 11) + "…" : firstWord;
  const fullStoreName = rawName.length > 20
    ? rawName.slice(0, 18) + "…"
    : rawName;

  return (
    <div className="group relative flex flex-col bg-white border border-vl-border rounded-vl-card overflow-hidden cursor-pointer transition-all duration-vl-standard hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1">

      {/* ── Image Container with Store Badge overlay ─────── */}
      <Link href={`/products/${product.id}`} className="relative aspect-[3/4] overflow-hidden bg-vl-surface flex-shrink-0 block">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          priority={false}
        />

        {/* Store badge — top-left transparent overlay */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.25)]" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Store className="w-2.5 h-2.5 text-white" strokeWidth={2} />
          </div>
          <span className="text-[9.5px] font-bold text-white leading-none max-w-[80px] line-clamp-1" title={rawName}>
            {storeName}
          </span>
          {isSellerVerified && (
            <BadgeCheck
              aria-label="Verified seller"
              className="h-3 w-3 shrink-0 text-[#4ADE80]"
              strokeWidth={2.2}
            />
          )}
        </div>

        {/* Stock badge — top-right */}
        {(isOutOfStock || lowStockVariant) && (
          <div className="absolute top-2 right-2 z-10">
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

      {/* ── Info Section ────────────────────────────────── */}
      <Link href={`/products/${product.id}`} className="flex flex-col flex-1 px-2.5 sm:px-3 pt-2 sm:pt-2.5 pb-1 gap-1 select-none">
        {/* Product Name — 2-line clamp */}
        <h3 className="text-xs sm:text-sm font-semibold text-vl-ink leading-tight line-clamp-2 min-h-[34px] sm:min-h-[40px] group-hover:text-vl-primary transition-colors duration-vl-fast">
          {product.name}
        </h3>

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
          <span className="text-sm sm:text-base font-extrabold text-vl-ink">
            {formattedPrice}
          </span>
          <span className="text-[10px] sm:text-xs text-vl-muted line-through">
            {formattedMrp}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-vl-primary">
            -{discountPct}%
          </span>
        </div>

        {/* Rating Row */}
        <div className="flex items-center gap-1 text-[10px] font-bold text-vl-muted mt-0.5">
          <span className="text-[#F39C12] text-[11px]">★</span>
          <span>{rating} ({soldCount} sold)</span>
        </div>
      </Link>

      {/* ── Add to Cart CTA — inside card with margin ─── */}
      <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-1.5">
        <Link
          href={`/products/${product.id}`}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#0F7F7F] text-white text-[10.5px] font-extrabold uppercase tracking-wider rounded-xl transition-colors hover:bg-[#0A5C5C] shrink-0"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Add to Cart</span>
        </Link>
      </div>
    </div>
  );
}
