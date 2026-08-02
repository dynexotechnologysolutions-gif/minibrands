"use client";

import React from "react";
import ProductCard from "./ProductCard";
import { Product } from "../types/Product";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

interface ProductGridProps {
  products: Product[];
  isLoggedIn: boolean;
  onWishlistToggle: (productId: string, isWishlisted: boolean) => Promise<void>;
}

/** Premium empty state — shown when filters yield zero results */
function EmptyState({ message, subtext, cta }: {
  message: string;
  subtext: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="flex w-full flex-col items-center justify-center py-20 px-6 text-center">
      {/* Inline SVG illustration */}
      <div className="mb-6 text-vl-border">
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
          <path
            d="M32 48h32M48 32v32"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.4"
          />
          <circle cx="48" cy="48" r="12" stroke="currentColor" strokeWidth="2" opacity="0.6" />
          <path
            d="M44 44l8 8M52 44l-8 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </div>

      <h2 className="font-vl-heading text-xl font-bold text-vl-ink mb-2 tracking-tight">{message}</h2>
      <p className="text-sm text-vl-muted leading-relaxed text-center" style={{ maxWidth: "440px", width: "100%", margin: "0 auto 1.5rem" }}>{subtext}</p>

      {cta && (
        <Link
          href={cta.href}
          className="inline-flex min-h-11 items-center gap-2 rounded-vl-control border border-vl-border bg-vl-card px-6 text-sm font-semibold text-vl-ink transition-all duration-vl-fast hover:border-vl-primary hover:text-vl-primary active:scale-[0.98]"
        >
          <ShoppingBag aria-hidden="true" className="h-4 w-4" />
          {cta.label}
        </Link>
      )}
    </div>
  );
}

export default function ProductGrid({
  products,
  isLoggedIn,
  onWishlistToggle,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        message="No products found"
        subtext="Try adjusting your filters or search terms to find what you're looking for."
        cta={{ label: "Browse All Products", href: "/products" }}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-5 xl:grid-cols-4">
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
