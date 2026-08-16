"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import WishlistIconButton from "@/components/product/WishlistIconButton";
import { reserveCartItem } from "@/actions/cart-reserve.action";

export interface HomeProductCardProps {
  product: {
    id: string;
    name: string;
    price: number; // in paise
    category?: string;
    images: { url: string; cloudinaryPublicId?: string }[];
    variants?: { id?: string; size?: string; stockCount?: number }[];
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
  badgeLabel?: string;
}

const formatPrice = (priceInPaise: number) => `₹${Math.round(priceInPaise / 100).toLocaleString("en-IN")}`;

export default function HomeProductCard({
  product,
  isLoggedIn = false,
  isWishlisted = false,
  badgeLabel,
}: HomeProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const mainImage = product.images?.[0]?.url || null;
  const sellerName = product.seller?.businessName || "Independent Label";
  const formattedPrice = formatPrice(product.price);
  const formattedOriginalPrice = formatPrice(product.price * 1.25);
  const discountPct = 20;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding) return;

    setIsAdding(true);
    try {
      const variantId = product.variants?.[0]?.id || "default";
      const res = await reserveCartItem({
        productId: product.id,
        variantId: variantId,
        quantity: 1,
      });

      if (res.success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      } else {
        alert(res.error?.message || "Failed to add to cart");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="flex flex-col font-sans bg-white rounded-xl p-3 md:p-4 border border-[#E5E7E7] hover:shadow-lg transition group cursor-pointer"
    >
      {/* Product Image Container: aspect-square bg-[#F7F9F9] rounded-lg */}
      <div className="relative w-full aspect-square bg-[#F7F9F9] rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        {badgeLabel && (
          <span className="absolute top-2 left-2 z-10 bg-[#E53935] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
            {badgeLabel}
          </span>
        )}
        
        {/* Wishlist icon button container */}
        <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10">
          <WishlistIconButton productId={product.id} isLoggedIn={isLoggedIn} initialIsWishlisted={isWishlisted} />
        </div>

        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain mix-blend-multiply p-2 group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fa-solid fa-image text-gray-300 text-3xl md:text-5xl group-hover:scale-110 transition-transform duration-500"></i>
          </div>
        )}
      </div>

      {/* Store Tag Badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] md:text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded truncate max-w-full">
          {sellerName}
        </span>
      </div>

      {/* Product Title */}
      <h4 className="text-[13px] md:text-sm font-semibold text-[#222222] line-clamp-2 mb-2 leading-tight min-h-[40px]">
        {product.name}
      </h4>

      {/* Rating Row */}
      <div className="flex items-center gap-1 text-[11px] md:text-xs text-gray-500 mb-3">
        <span className="text-[#222222] font-semibold">4.6</span>
        <i className="fa-solid fa-star text-[#F39C12] text-[9px] md:text-[10px]"></i>
        <span>(980 sold)</span>
      </div>

      {/* Price row */}
      <div className="flex items-baseline gap-2 mb-4 mt-auto">
        <span className="text-base md:text-lg font-bold text-[#222222]">{formattedPrice}</span>
        <span className="text-xs md:text-sm text-[#999999] line-through">{formattedOriginalPrice}</span>
        <span className="text-[9px] md:text-[10px] font-bold text-[#E53935] bg-[#ffebee] px-1.5 py-0.5 rounded">
          {discountPct}% OFF
        </span>
      </div>

      {/* CTA Button: Add to Cart */}
      <button
        suppressHydrationWarning
        type="button"
        onClick={handleAddToCart}
        disabled={isAdding}
        className={`w-full h-[40px] md:h-[44px] text-white rounded-lg text-xs md:text-sm font-semibold transition shadow-sm flex items-center justify-center gap-2 ${
          added
            ? "bg-[#2E7D32]"
            : isAdding
            ? "bg-[#F39C12]/75 cursor-not-allowed"
            : "bg-[#F39C12] hover:bg-[#d68910]"
        }`}
      >
        <i className="fa-solid fa-cart-shopping"></i>
        <span>{added ? "Added!" : isAdding ? "Adding..." : "Add to Cart"}</span>
      </button>
    </Link>
  );
}
