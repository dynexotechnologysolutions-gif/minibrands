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

  const mainImage = product.images?.[0]?.url || "/placeholder.jpg";
  const sellerName = product.seller?.businessName || "Independent Label";
  const formattedPrice = formatPrice(product.price);
  const formattedOriginalPrice = formatPrice(product.price * 1.35);

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
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col group h-full">
      {/* Product Image & Store/Badge Tag Overlay */}
      <div className="relative bg-gray-100 h-40 md:h-52 overflow-hidden block">
        <Link href={`/products/${product.id}`} className="block w-full h-full relative">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Store Name Badge or Custom Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
          {badgeLabel ? (
            <span className="bg-[#004b49] text-white text-[8px] md:text-[10px] font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full shadow-sm">
              {badgeLabel}
            </span>
          ) : (
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                <i className="fa-solid fa-store text-[8px] text-[#004b49]"></i>
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md truncate max-w-24">
                {sellerName}
              </span>
            </div>
          )}
        </div>

        {/* Wishlist Icon */}
        <div className="absolute top-2 right-2 z-10">
          <WishlistIconButton productId={product.id} isLoggedIn={isLoggedIn} initialIsWishlisted={isWishlisted} />
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <Link href={`/products/${product.id}`}>
          <h4 className="text-sm md:text-base text-gray-800 leading-tight mb-1 md:mb-2 truncate font-bold hover:text-[#004b49] transition-colors">
            {product.name}
          </h4>
        </Link>

        <div className="flex items-baseline gap-1 md:gap-2 mb-1 md:mb-2">
          <span className="text-lg md:text-xl font-bold text-gray-900">{formattedPrice}</span>
          <span className="text-xs md:text-sm text-gray-400 line-through">{formattedOriginalPrice}</span>
        </div>

        <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-500 mb-3 md:mb-4">
          <i className="fa-solid fa-star text-orange-400"></i>
          <span>4.7 (1.2K sold)</span>
        </div>

        <button
          suppressHydrationWarning
          type="button"
          onClick={handleAddToCart}
          disabled={isAdding}
          className={`w-full py-2 md:py-2.5 rounded-lg text-sm md:text-base font-medium mt-auto flex items-center justify-center gap-2 transition-colors ${
            added
              ? "bg-green-600 text-white"
              : isAdding
              ? "bg-[#004b49]/70 text-white cursor-not-allowed"
              : "bg-[#004b49] hover:bg-teal-800 text-white"
          }`}
        >
          <i className="fa-solid fa-cart-plus"></i>
          {added ? "Added to Cart!" : isAdding ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
