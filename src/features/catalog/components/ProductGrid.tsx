import React from "react";
import { SearchX } from "lucide-react";
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
      <div className="flex min-h-[360px] flex-1 flex-col items-center justify-center rounded-vl-card border border-dashed border-vl-border bg-vl-card px-6 py-16 text-center">
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-vl-surface text-vl-muted">
          <SearchX aria-hidden="true" className="h-7 w-7" />
        </span>
        <p className="font-vl-heading text-xl font-bold text-vl-ink">No products found</p>
        <p className="mt-2 text-sm text-vl-muted">Try adjusting your search query or filters.</p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-5 xl:grid-cols-4">
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
