"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ShoppingCart } from "lucide-react";
import WishlistIconButton from "./WishlistIconButton";
import { reserveCartItem } from "@/actions/cart-reserve.action";
import { useRouter } from "next/navigation";

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number; // in paise
    category: string;
    images: { url: string; cloudinaryPublicId: string }[];
    variants: { id?: string; size: string; stockCount: number }[];
    seller: {
      businessName: string;
      storeLogo?: string | null;
      verification?: {
        kycStatus: string;
        bankVerified: boolean;
      } | null;
    };
  };
  isLoggedIn?: boolean;
  isWishlisted?: boolean;
}

export default function ProductCard({ product, isLoggedIn = false, isWishlisted = false }: ProductCardProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

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

  const isOutOfStock =
    !product.variants ||
    product.variants.length === 0 ||
    product.variants.every((v) => v.stockCount === 0);

  const lowStockVariant = product.variants?.find(
    (v) => v.stockCount > 0 && v.stockCount <= 3
  );

  const isSellerVerified =
    product.seller.verification &&
    (product.seller.verification.kycStatus === "auto_approved" ||
      product.seller.verification.kycStatus === "approved") &&
    product.seller.verification.bankVerified;

  // Generate realistic ratings & sales counts based on product name hashing
  const rating = (4.3 + (product.name.charCodeAt(0) % 7) * 0.1).toFixed(1);
  const salesCount = 100 + (product.name.charCodeAt(1) % 9) * 150;
  const formattedSales = salesCount >= 1000 ? `${(salesCount / 1000).toFixed(1)}K` : salesCount;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding || isOutOfStock) return;

    setIsAdding(true);
    try {
      const targetVariant = product.variants?.find((v) => v.stockCount > 0) || product.variants?.[0];
      const variantId = targetVariant?.id || "default";

      if (isLoggedIn) {
        // Logged-in user: server action
        const res = await reserveCartItem({
          productId: product.id,
          variantId,
          quantity: 1,
        });

        if (res.success) {
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
          window.dispatchEvent(new Event("cart-updated"));
          router.refresh();
        } else {
          alert(res.error?.message || "Failed to add to cart");
        }
      } else {
        // Guest user: API call
        const res = await fetch("/api/guest-cart/reserve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: product.id,
            variantId,
            quantity: 1,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
            window.dispatchEvent(new Event("cart-updated"));
            router.refresh();
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

  return (
    <div className="group relative flex flex-col bg-vl-card border border-vl-border rounded-vl-card overflow-hidden cursor-pointer transition-all duration-vl-standard hover:shadow-vl-medium hover:-translate-y-1">
      {/* ── Image Container ─────────────────────────────── */}
      <Link href={`/products/${product.id}`} className="relative aspect-square overflow-hidden bg-vl-surface flex-shrink-0 block">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          priority={false}
        />

        {/* Store Badge Overlay (ShopHub Style) */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-lg px-1.5 py-1">
          {product.seller.storeLogo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.seller.storeLogo}
              alt=""
              className="w-4 h-4 rounded-full object-cover shrink-0 border border-white/40 shadow-vl-soft"
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-white/90 flex items-center justify-center text-[8px] font-black text-vl-primary shrink-0 select-none shadow-vl-soft">
              {product.seller.businessName[0].toUpperCase()}
            </div>
          )}
          <span className="text-[9.5px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] truncate max-w-[80px]">
            {product.seller.businessName}
          </span>
        </div>

        {/* Stock badge — bottom-left */}
        {(isOutOfStock || lowStockVariant) && (
          <div className="absolute bottom-2 left-2 z-10">
            {isOutOfStock ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[8.5px] font-black bg-vl-danger text-white uppercase tracking-wider leading-tight select-none">
                Sold Out
              </span>
            ) : (
              <span className="inline-flex items-center gap-[3px] px-2 py-0.5 rounded text-[8.5px] font-black bg-[#E53935] text-white uppercase tracking-wider leading-tight select-none">
                Only {lowStockVariant!.stockCount} left
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Wishlist icon overlay */}
      <WishlistIconButton
        productId={product.id}
        isLoggedIn={!!isLoggedIn}
        initialIsWishlisted={!!isWishlisted}
      />

      {/* ── Info Section ────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-3.5 pb-2.5 select-none justify-between gap-1">
        <Link href={`/products/${product.id}`} className="block">
          {/* Brand + Verified */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-extrabold text-vl-muted uppercase tracking-[0.06em] truncate leading-tight">
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
          <h3 className="text-xs font-bold text-slate-700 leading-tight line-clamp-2 mt-1 min-h-[32px] group-hover:text-vl-primary transition-colors duration-vl-fast">
            {product.name}
          </h3>

          {/* Rating Row (ShopHub Style) */}
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 mt-1 select-none">
            <span className="text-yellow-500">★</span>
            <span>{rating}</span>
            <span className="text-slate-400">({formattedSales} sold)</span>
          </div>

          {/* Price row */}
          <div className="flex items-baseline gap-2 mt-2 flex-wrap">
            <span className="text-sm font-extrabold text-vl-ink">
              {formattedPrice}
            </span>
            <span className="text-xs text-vl-muted line-through">
              {formattedMrp}
            </span>
            <span className="text-[10px] font-black text-vl-primary">
              -{discountPct}%
            </span>
          </div>
        </Link>

        {/* Add to Cart CTA Button */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
          className={`w-full mt-3.5 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl text-[10.5px] font-extrabold text-white shadow-sm transition-all active:scale-97 select-none cursor-pointer ${
            isOutOfStock
              ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
              : added
              ? "bg-vl-success hover:bg-vl-success-strong"
              : "bg-[#0F7F7F] hover:bg-[#0B5B5B]"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>
            {isOutOfStock ? "Out of Stock" : isAdding ? "Adding..." : added ? "Added!" : "Add to Cart"}
          </span>
        </button>
      </div>
    </div>
  );
}
