"use client";

import React from "react";
import ProductGrid from "@/components/product/ProductGrid";
import StorefrontFeaturedHero from "./StorefrontFeaturedHero";

interface StorefrontShopProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  products: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
    images: Array<{ url: string; cloudinaryPublicId: string }>;
    variants: Array<{ size: string; stockCount: number }>;
    seller: { businessName: string; verification: { kycStatus: string; bankVerified: boolean } };
  }>;
  filteredProducts: StorefrontShopProps["products"];
  storeDisplayName: string;
}

export default function StorefrontShop({
  categories,
  selectedCategory,
  setSelectedCategory,
  products,
  filteredProducts,
  storeDisplayName,
}: StorefrontShopProps) {
  const hasFeatured = products.length >= 4;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-vl-border/60 pb-4">
        <div>
          <h2 className="font-vl-heading text-lg font-bold tracking-tight text-vl-ink">Shop</h2>
          <p className="text-xs text-vl-muted">{filteredProducts.length} {filteredProducts.length === 1 ? "piece" : "pieces"}</p>
        </div>
      </div>

      {/* Category filters — lightweight chips */}
      <div
        className="-mx-4 sm:mx-0 flex gap-2 overflow-x-auto px-4 sm:px-0 pb-1 hide-scrollbar"
        role="tablist"
        aria-label="Filter by collection"
      >
        <button
          role="tab"
          aria-selected={selectedCategory === "all"}
          onClick={() => setSelectedCategory("all")}
          className={`shrink-0 rounded-full border px-4 h-9 text-sm font-bold transition-all cursor-pointer active:scale-[0.98] ${
            selectedCategory === "all"
              ? "border-vl-primary bg-vl-primary text-white"
              : "border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary/30"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={selectedCategory === cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 rounded-full border px-4 h-9 text-sm font-bold capitalize transition-all cursor-pointer active:scale-[0.98] ${
              selectedCategory === cat
                ? "border-vl-primary bg-vl-primary text-white"
                : "border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured — distinct from grid */}
      {hasFeatured && (
        <StorefrontFeaturedHero products={products} storeDisplayName={storeDisplayName} />
      )}

      {/* Main catalog grid */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-vl-border rounded-vl-card bg-vl-card max-w-md mx-auto">
            <h4 className="font-bold text-sm text-vl-ink">No products in this collection</h4>
            <p className="text-xs text-vl-muted mt-1">Try another collection or view all designs.</p>
            <button
              onClick={() => setSelectedCategory("all")}
              className="mt-4 inline-flex h-9 items-center rounded-full bg-vl-ink text-white px-4 text-xs font-bold hover:bg-vl-primary transition"
            >
              View all
            </button>
          </div>
        ) : (
          <ProductGrid products={filteredProducts} />
        )}
      </div>
    </div>
  );
}
