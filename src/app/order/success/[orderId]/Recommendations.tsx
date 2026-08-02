"use client";

import React from "react";
import ProductCard from "@/features/catalog/components/ProductCard";
import { Product } from "@/features/catalog/types/Product";

interface RecommendationsProps {
  products: Product[];
  isLoggedIn: boolean;
}

export default function Recommendations({ products, isLoggedIn }: RecommendationsProps) {
  const handleWishlistToggle = async (productId: string, isWishlisted: boolean) => {
    // Client-side wishlist toggle no-op or integration if needed
    console.log("Toggle wishlist", productId, isWishlisted);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      {products.map((prod) => (
        <ProductCard
          key={prod.id}
          product={prod}
          isLoggedIn={isLoggedIn}
          onWishlistToggle={handleWishlistToggle}
        />
      ))}
    </div>
  );
}
