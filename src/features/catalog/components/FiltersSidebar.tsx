"use client";

import React, { useState } from "react";
import { ChevronDown, Star, SlidersHorizontal } from "lucide-react";

interface FiltersSidebarProps {
  priceRange: [number, number] | undefined;
  onPriceRangeChange: (range: [number, number] | undefined) => void;
  rating: number | undefined;
  onRatingChange: (rating: number | undefined) => void;
  discount: number | undefined;
  onDiscountChange: (discount: number | undefined) => void;
  onClearAll: () => void;
}

/** Reusable collapsible filter section */
function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-vl-border first:border-t-0">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors duration-vl-fast hover:bg-vl-surface"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-vl-ink">
          {title}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 text-vl-muted transition-transform duration-vl-fast ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
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

  const ratingOptions = [
    { value: 4, label: "4★ & above" },
    { value: 3, label: "3★ & above" },
  ];

  const discountOptions = [
    { value: 50, label: "50% or more" },
    { value: 30, label: "30% or more" },
    { value: 10, label: "10% or more" },
  ];

  const hasActiveFilters = !!priceRange || !!rating || !!discount;

  return (
    <aside className="hidden w-[260px] shrink-0 lg:block" aria-label="Product filters">
      <div className="divide-y-0 overflow-hidden rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-vl-muted" />
            <span className="font-vl-heading text-base font-bold text-vl-ink">Filters</span>
            {hasActiveFilters && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-vl-primary text-[10px] font-bold text-white">
                {[priceRange, rating, discount].filter(Boolean).length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClearAll}
            className="min-h-9 rounded-full px-3 text-xs font-bold uppercase tracking-[0.10em] text-vl-primary transition-colors duration-vl-fast hover:bg-vl-primary/8 active:scale-95"
          >
            Clear all
          </button>
        </div>

        {/* Price Filter */}
        <FilterSection title="Price">
          <div className="space-y-3">
            {/* Custom styled range slider */}
            <input
              aria-label="Maximum price filter"
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-vl-border accent-vl-primary"
              type="range"
              min="499"
              max="10000"
              step="100"
              value={currentPriceMax}
              onChange={handlePriceChange}
            />
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-vl-surface px-2 py-1 text-xs font-semibold text-vl-muted">
                ₹499
              </span>
              <span className="rounded-md bg-vl-primary/8 px-2 py-1 text-xs font-bold text-vl-primary">
                {currentPriceMax >= 10000 ? "₹10,000+" : `₹${currentPriceMax.toLocaleString()}`}
              </span>
            </div>
          </div>
        </FilterSection>

        {/* Rating Filter */}
        <FilterSection title="Customer Rating">
          <div className="space-y-2" role="group" aria-label="Filter by rating">
            {ratingOptions.map(({ value }) => {
              const isChecked = rating === value;
              return (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 rounded-vl-control px-2 py-1.5 transition-colors duration-vl-fast hover:bg-vl-surface"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onRatingChange(isChecked ? undefined : value)}
                    className="h-4 w-4 cursor-pointer rounded border-vl-border accent-vl-primary"
                  />
                  <span className="flex items-center gap-1 text-sm font-medium text-vl-ink">
                    {value}
                    <Star
                      aria-hidden="true"
                      className="h-3.5 w-3.5 fill-vl-accent text-vl-accent"
                    />
                    <span className="text-vl-muted">& above</span>
                  </span>
                </label>
              );
            })}
          </div>
        </FilterSection>

        {/* Discount Filter */}
        <FilterSection title="Discount">
          <div className="space-y-2" role="radiogroup" aria-label="Filter by discount">
            {discountOptions.map(({ value }) => {
              const isChecked = discount === value;
              return (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 rounded-vl-control px-2 py-1.5 transition-colors duration-vl-fast hover:bg-vl-surface"
                >
                  <input
                    type="radio"
                    name="discount-filter"
                    checked={isChecked}
                    onChange={() => onDiscountChange(value)}
                    className="h-4 w-4 cursor-pointer border-vl-border accent-vl-primary"
                  />
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-vl-ink">
                    <span className="rounded-md bg-vl-success/10 px-1.5 py-0.5 text-[11px] font-bold text-vl-success">
                      {value}%+
                    </span>
                    off
                  </span>
                </label>
              );
            })}
          </div>
        </FilterSection>
      </div>
    </aside>
  );
}
