"use client";

import React from "react";
import ProductCard from "./ProductCard";
import { Product } from "../types/Product";
import { SearchX } from "lucide-react";
import Link from "next/link";

interface ProductGridProps {
  products: Product[];
  isLoggedIn: boolean;
  onWishlistToggle: (productId: string, isWishlisted: boolean) => Promise<void>;
  /** Clears the active filters (existing filter state) */
  onClearFilters?: () => void;
}

export default function ProductGrid({
  products,
  isLoggedIn,
  onWishlistToggle,
  onClearFilters,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-vl-card text-vl-border">
          <SearchX aria-hidden="true" className="h-9 w-9" />
        </div>
        <h2 className="font-vl-heading mb-2 text-xl font-bold tracking-tight text-vl-ink">
          No products found
        </h2>
        <p className="mx-auto mb-6 max-w-[320px] text-sm leading-relaxed text-vl-muted">
          We couldn&apos;t find products matching your current filters.
        </p>
        <div className="flex flex-col items-center gap-2.5 sm:flex-row">
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-6 text-sm font-semibold text-white transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98]"
            >
              Clear Filters
            </button>
          )}
          <Link
            href="/categories"
            className="inline-flex min-h-11 items-center justify-center rounded-vl-control border border-vl-border bg-vl-card px-6 text-sm font-semibold text-vl-ink transition-all duration-vl-fast hover:border-vl-primary hover:text-vl-primary active:scale-[0.98]"
          >
            Explore Other Categories →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      {products.map((product, idx) => (
        <ProductCard
          key={product.id}
          product={product}
          isLoggedIn={isLoggedIn}
          onWishlistToggle={onWishlistToggle}
          index={idx}
        />
      ))}
    </div>
  );
}