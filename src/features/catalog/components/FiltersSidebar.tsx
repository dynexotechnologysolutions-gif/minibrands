"use client";

import React from "react";
import { ChevronUp, Star } from "lucide-react";

interface FiltersSidebarProps {
  priceRange: [number, number] | undefined;
  onPriceRangeChange: (range: [number, number] | undefined) => void;
  rating: number | undefined;
  onRatingChange: (rating: number | undefined) => void;
  discount: number | undefined;
  onDiscountChange: (discount: number | undefined) => void;
  onClearAll: () => void;
}

export default function FiltersSidebar({
  priceRange = [499, 10000],
  onPriceRangeChange,
  rating,
  onRatingChange,
  discount,
  onDiscountChange,
  onClearAll,
}: FiltersSidebarProps) {
  const currentPriceMax = priceRange ? priceRange[1] : 10000;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onPriceRangeChange([499, val]);
  };

  return (
    <aside className="hidden w-[280px] shrink-0 lg:block">
      <div className="divide-y divide-vl-border overflow-hidden rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <span className="font-vl-heading text-lg font-bold text-vl-ink">Filters</span>
          <button
            type="button"
            onClick={onClearAll}
            className="min-h-10 rounded-full px-3 text-xs font-bold uppercase tracking-[0.12em] text-vl-primary transition hover:bg-vl-primary/5"
            suppressHydrationWarning
          >
            Clear all
          </button>
        </div>

        {/* Price Filter */}
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-vl-ink">Price</span>
            <ChevronUp aria-hidden="true" className="h-4 w-4 text-vl-muted" />
          </div>
          <input
            aria-label="Maximum price"
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-vl-border accent-vl-primary"
            type="range"
            min="499"
            max="10000"
            step="100"
            value={currentPriceMax}
            onChange={handlePriceChange}
          />
          <div className="mt-2 flex justify-between text-sm font-medium text-vl-muted">
            <span>₹499</span>
            <span>{currentPriceMax >= 10000 ? "₹10,000+" : `₹${currentPriceMax.toLocaleString()}`}</span>
          </div>
        </div>

        {/* Rating Filter */}
        <div className="p-4">
          <span className="mb-3 block text-xs font-bold uppercase tracking-[0.12em] text-vl-ink">Customer ratings</span>
          <div className="space-y-2">
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={rating === 4}
                onChange={() => onRatingChange(rating === 4 ? undefined : 4)}
                className="h-4 w-4 rounded border-vl-border text-vl-primary focus:ring-vl-primary"
              />
              <span className="flex items-center gap-1 text-sm text-vl-ink">
                4 <Star aria-hidden="true" className="h-3.5 w-3.5 fill-vl-accent text-vl-accent" /> &amp; above
              </span>
            </label>
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={rating === 3}
                onChange={() => onRatingChange(rating === 3 ? undefined : 3)}
                className="h-4 w-4 rounded border-vl-border text-vl-primary focus:ring-vl-primary"
              />
              <span className="flex items-center gap-1 text-sm text-vl-ink">
                3 <Star aria-hidden="true" className="h-3.5 w-3.5 fill-vl-accent text-vl-accent" /> &amp; above
              </span>
            </label>
          </div>
        </div>

        {/* Discount Filter */}
        <div className="p-4">
          <span className="mb-3 block text-xs font-bold uppercase tracking-[0.12em] text-vl-ink">Discount</span>
          <div className="space-y-2">
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="radio"
                name="discount"
                checked={discount === 50}
                onChange={() => onDiscountChange(50)}
                className="border-outline-variant text-primary focus:ring-0 cursor-pointer"
              />
              <span className="text-body-md text-on-surface">50% or more</span>
            </label>
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="radio"
                name="discount"
                checked={discount === 30}
                onChange={() => onDiscountChange(30)}
                className="border-outline-variant text-primary focus:ring-0 cursor-pointer"
              />
              <span className="text-body-md text-on-surface">30% or more</span>
            </label>
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="radio"
                name="discount"
                checked={discount === 10}
                onChange={() => onDiscountChange(10)}
                className="border-outline-variant text-primary focus:ring-0 cursor-pointer"
              />
              <span className="text-body-md text-on-surface">10% or more</span>
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
}
