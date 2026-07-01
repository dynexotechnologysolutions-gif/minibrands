import React from "react";
import ProductCard from "./ProductCard";
import { Product } from "../types/Product";

interface ProductGridProps {
  products: Product[];
  isLoggedIn: boolean;
  onWishlistToggle: (productId: string, isWishlisted: boolean) => Promise<void>;
}

export default function ProductGrid({
  products,
  isLoggedIn,
  onWishlistToggle,
}: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="flex-1 py-16 text-center bg-surface border border-outline-variant rounded-lg">
        <span className="material-symbols-outlined text-text-muted text-[48px] mb-4">
          search_off
        </span>
        <p className="text-body-lg font-semibold text-on-surface">No products found</p>
        <p className="text-body-sm text-text-muted mt-xs">Try adjusting your search query or filters</p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-base lg:gap-lg">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isLoggedIn={isLoggedIn}
            onWishlistToggle={onWishlistToggle}
          />
        ))}
      </div>
    </div>
  );
}
