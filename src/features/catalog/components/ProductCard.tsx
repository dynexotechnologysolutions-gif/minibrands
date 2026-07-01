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

  const formattedPrice = (product.price / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const formattedMrp = (product.mrp / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

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

  // Badge styling depending on content
  const renderBadge = () => {
    if (!product.badge) return null;
    const isNew = product.badge === "New Arrival";
    return (
      <span
        className={`absolute top-md left-0 text-[10px] font-bold px-base py-1 uppercase tracking-wider select-none ${
          isNew ? "bg-accent-yellow text-on-surface" : "bg-primary text-on-primary"
        }`}
      >
        {product.badge}
      </span>
    );
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group product-card-hover bg-surface-container-lowest border border-border-gray rounded transition-all cursor-pointer overflow-hidden block"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-low">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Favorite Heart Toggle */}
        <button
          onClick={handleWishlistClick}
          disabled={isToggling}
          className="absolute top-md right-md p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-on-surface hover:text-error transition-colors flex items-center justify-center cursor-pointer z-10"
        >
          <span
            className={`material-symbols-outlined text-[20px] transition-colors ${
              product.isWishlisted ? "text-error-red" : ""
            }`}
            style={{
              fontVariationSettings: product.isWishlisted
                ? "'FILL' 1, 'wght' 400"
                : "'FILL' 0, 'wght' 400",
            }}
          >
            favorite
          </span>
        </button>

        {/* Badge */}
        {renderBadge()}
      </div>

      <div className="p-md">
        {/* Brand */}
        <p className="text-body-sm text-text-muted font-bold uppercase tracking-wide truncate">
          {brandName}
        </p>

        {/* Product Title */}
        <h3 className="text-body-md font-semibold truncate text-on-surface">
          {product.name}
        </h3>

        {/* Ratings & Reviews */}
        <div className="flex items-center gap-xs mt-xs">
          <div className="bg-success-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-xs">
            {product.rating.toFixed(1)}{" "}
            <span
              className="material-symbols-outlined text-[12px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
          </div>
          <span className="text-body-sm text-text-muted">
            ({product.formattedReviews})
          </span>
        </div>

        {/* Prices Row */}
        <div className="flex items-baseline gap-sm mt-sm">
          <span className="font-price-lg text-price-lg text-on-surface">
            {formattedPrice}
          </span>
          <span className="text-body-sm text-text-muted line-through">
            {formattedMrp}
          </span>
          <span className="text-body-sm font-bold text-success-green">
            {product.discountPercent}% OFF
          </span>
        </div>
      </div>
    </Link>
  );
}
