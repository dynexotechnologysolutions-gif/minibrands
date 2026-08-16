"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import WishlistIconButton from "@/components/product/WishlistIconButton";
import { reserveCartItem } from "@/actions/cart-reserve.action";

// Reuses the same props interface as HomeProductCard — no API change
export interface HomeProductCardDesktopProps {
  product: {
    id: string;
    name: string;
    price: number; // paise
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

const formatPrice = (paise: number) =>
  `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

export default function HomeProductCardDesktop({
  product,
  isLoggedIn = false,
  isWishlisted = false,
  badgeLabel,
}: HomeProductCardDesktopProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const mainImage = product.images?.[0]?.url || "/placeholder.jpg";
  const sellerName = product.seller?.businessName || "Independent Label";
  const formattedPrice = formatPrice(product.price);
  const formattedOriginalPrice = formatPrice(product.price * 1.35);
  const discountPct = 26; // consistent computed display discount

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding) return;
    setIsAdding(true);
    try {
      const variantId = product.variants?.[0]?.id || "default";
      const res = await reserveCartItem({ productId: product.id, variantId, quantity: 1 });
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
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden flex flex-col group h-full">
      {/* Image container — 3:4 aspect ratio for desktop */}
      <div className="relative bg-gray-100 aspect-[3/4] overflow-hidden">
        <Link href={`/products/${product.id}`} className="block w-full h-full relative">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 1280px) 25vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Badge — trending or store label */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
          {badgeLabel ? (
            <span className="bg-[#004b49] text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wide">
              {badgeLabel}
            </span>
          ) : (
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                <i className="fa-solid fa-store text-[7px] text-[#004b49]"></i>
              </div>
              <span className="text-[9px] font-bold text-white drop-shadow-md truncate max-w-[80px]">
                {sellerName}
              </span>
            </div>
          )}
        </div>

        {/* Wishlist */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <WishlistIconButton productId={product.id} isLoggedIn={isLoggedIn} initialIsWishlisted={isWishlisted} />
        </div>

        {/* Discount chip */}
        <div className="absolute bottom-2.5 right-2.5 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
          -{discountPct}%
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-grow gap-1">
        {/* Store name — secondary label */}
        <p className="text-[10px] font-medium text-[#004b49] truncate">{sellerName}</p>

        {/* Product name */}
        <Link href={`/products/${product.id}`}>
          <h4 className="text-sm font-bold text-gray-800 leading-snug line-clamp-2 hover:text-[#004b49] transition-colors">
            {product.name}
          </h4>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <i className="fa-solid fa-star text-orange-400 text-[10px]"></i>
          <span>4.7</span>
          <span className="text-gray-400">(1.2K sold)</span>
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-base font-bold text-gray-900">{formattedPrice}</span>
          <span className="text-xs text-gray-400 line-through">{formattedOriginalPrice}</span>
        </div>

        {/* Add to Cart */}
        <button
          suppressHydrationWarning
          type="button"
          onClick={handleAddToCart}
          disabled={isAdding}
          className={`w-full py-2 rounded-lg text-sm font-medium mt-auto flex items-center justify-center gap-1.5 transition-colors ${
            added
              ? "bg-green-600 text-white"
              : isAdding
              ? "bg-[#004b49]/70 text-white cursor-not-allowed"
              : "bg-[#004b49] hover:bg-teal-800 text-white"
          }`}
        >
          <i className="fa-solid fa-cart-plus text-xs"></i>
          {added ? "Added!" : isAdding ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
