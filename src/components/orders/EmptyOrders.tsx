import React from "react";
import Link from "next/link";

export default function EmptyOrders() {
  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-12 sm:py-16 bg-vl-card border border-vl-border rounded-vl-card text-center shadow-vl-soft animate-fade-in my-10 flex flex-col items-center">
      {/* Premium gradient illustration container with pulsing animation */}
      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-vl-primary/10 to-vl-primary/5 flex items-center justify-center text-vl-primary mb-6 animate-vl-pulse shrink-0">
        <span className="material-symbols-outlined text-[40px]">shopping_bag</span>
      </div>

      <div className="space-y-3">
        {/* Title */}
        <h3 className="font-vl-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-vl-ink text-center">
          No Orders Placed Yet
        </h3>
        
        {/* Description */}
        <p className="text-sm sm:text-base text-vl-muted max-w-[480px] mx-auto leading-[1.6] text-center">
          You haven't ordered anything yet. Browse our exclusive collection of curated local boutiques and independent brands.
        </p>
      </div>

      {/* Button Row */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-[440px] mx-auto pt-8">
        <Link
          href="/products"
          className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center rounded-vl-control bg-vl-primary px-8 text-sm font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.20)] hover:bg-vl-primary-strong active:scale-95 transition-all duration-vl-fast text-center"
        >
          Browse Products
        </Link>
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center rounded-vl-control border border-vl-border bg-vl-card px-8 text-sm font-semibold text-vl-ink hover:border-vl-primary hover:text-vl-primary active:scale-95 transition-all duration-vl-fast text-center"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
