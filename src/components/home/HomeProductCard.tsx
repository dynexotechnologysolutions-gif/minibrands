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
    price: number;
    category?: string;
    images: { url: string; cloudinaryPublicId?: string }[];
    variants?: { id?: string; size?: string; stockCount?: number }[];
    seller: {
      businessName: string;
      verification?: { kycStatus: string; bankVerified: boolean } | null;
    };
  };
  isLoggedIn?: boolean;
  isWishlisted?: boolean;
  badgeLabel?: string;
}

const formatPrice = (p: number) => `₹${Math.round(p / 100).toLocaleString("en-IN")}`;

export default function HomeProductCard({
  product,
  isLoggedIn = false,
  isWishlisted = false,
  badgeLabel,
}: HomeProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAdding) return;
    setIsAdding(true);
    try {
      const variantId = product.variants?.[0]?.id || product.variants?.[0]?.size || "default";
      const res = await reserveCartItem({ productId: product.id, variantId, quantity: 1 });
      if (res.success) { setAdded(true); setTimeout(() => setAdded(false), 2000); }
      else alert(res.error?.message || "Failed to add to cart");
    } catch { /* noop */ }
    finally { setIsAdding(false); }
  };

  const mainImg = product.images?.[0]?.url || null;
  const price = formatPrice(product.price);
  const origPrice = formatPrice(Math.round(product.price * 1.25));
  const discountPct = 20;

  return (
    <Link
      href={`/products/${product.id}`}
      className="flex flex-col bg-white rounded-[12px] p-3 md:p-4 border border-[#E5E7E7] hover:shadow-lg transition-shadow group"
    >
      {/* Image */}
      <div className="relative w-full aspect-square bg-[#F7F9F9] rounded-[8px] mb-4 overflow-hidden">
        {badgeLabel && (
          <span className="absolute top-2 left-2 z-10 bg-[#d64545] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {badgeLabel}
          </span>
        )}
        <div className="absolute top-2 right-2 z-10">
          <WishlistIconButton
            productId={product.id}
            isLoggedIn={isLoggedIn}
            initialIsWishlisted={isWishlisted}
          />
        </div>
        {mainImg ? (
          <Image
            src={mainImg}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, (max-width:1280px) 25vw, 20vw"
            className="object-contain mix-blend-multiply p-2 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fa-solid fa-image text-gray-300 text-3xl md:text-5xl group-hover:scale-110 transition-transform duration-500"></i>
          </div>
        )}
      </div>

      {/* Store chip */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[12px] font-medium text-[#666666] bg-gray-100 px-2 py-0.5 rounded">
          {product.seller.businessName}
        </span>
      </div>

      {/* Product name */}
      <h4 className="text-[14px] md:text-base font-medium text-gray-900 line-clamp-2 mb-2 leading-tight">
        {product.name}
      </h4>

      {/* Rating */}
      <div className="flex items-center gap-1 text-[12px] md:text-sm text-gray-500 mb-3">
        <span className="text-gray-800 font-medium">4.8</span>
        <i className="fa-solid fa-star text-[#F39C12] text-[10px] md:text-xs"></i>
        <span>(1.2k sold)</span>
      </div>

      {/* Price row */}
      <div className="flex items-baseline gap-2 mb-4 mt-auto">
        <span className="text-[18px] md:text-xl font-bold text-gray-900">{price}</span>
        <span className="text-[13px] md:text-sm text-gray-400 line-through">{origPrice}</span>
        <span className="text-[10px] md:text-xs font-bold text-[#E53935] bg-[#ffebee] px-1.5 py-0.5 rounded">
          {discountPct}% OFF
        </span>
      </div>

      {/* Add to Cart */}
      <button
        suppressHydrationWarning
        onClick={handleAddToCart}
        disabled={isAdding}
        className={`w-full h-[44px] md:h-[48px] rounded-[8px] text-sm md:text-base font-semibold transition-colors shadow-sm ${
          added
            ? "bg-green-600 text-white"
            : "bg-[#F39C12] hover:bg-[#d68910] text-white"
        }`}
      >
        {added ? "Added to Cart!" : isAdding ? "Adding..." : "Add to Cart"}
      </button>
    </Link>
  );
}
