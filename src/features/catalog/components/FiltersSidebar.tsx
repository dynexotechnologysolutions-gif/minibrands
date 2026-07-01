"use client";

import React from "react";

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
    <aside className="hidden lg:block w-[280px] shrink-0">
      <div className="bg-surface border border-outline-variant rounded-lg divide-y divide-outline-variant">
        {/* Header */}
        <div className="p-base flex justify-between items-center">
          <span className="font-headline-sm text-headline-sm">Filters</span>
          <button
            onClick={onClearAll}
            className="text-accent-yellow font-label-bold text-body-sm hover:underline cursor-pointer"
          >
            CLEAR ALL
          </button>
        </div>

        {/* Price Filter */}
        <div className="p-base">
          <div className="flex justify-between items-center mb-md">
            <span className="font-label-bold">PRICE</span>
            <span className="material-symbols-outlined text-on-surface-variant">expand_less</span>
          </div>
          <input
            className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
            type="range"
            min="499"
            max="10000"
            step="100"
            value={currentPriceMax}
            onChange={handlePriceChange}
          />
          <div className="flex justify-between mt-sm text-body-sm text-on-surface-variant font-medium">
            <span>₹499</span>
            <span>{currentPriceMax >= 10000 ? "₹10,000+" : `₹${currentPriceMax.toLocaleString()}`}</span>
          </div>
        </div>

        {/* Rating Filter */}
        <div className="p-base">
          <span className="font-label-bold block mb-md">CUSTOMER RATINGS</span>
          <div className="space-y-sm">
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={rating === 4}
                onChange={() => onRatingChange(rating === 4 ? undefined : 4)}
                className="rounded-sm border-outline-variant text-primary focus:ring-0 cursor-pointer"
              />
              <span className="text-body-md flex items-center gap-xs text-on-surface">
                4{" "}
                <span
                  className="material-symbols-outlined text-accent-yellow scale-75"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>{" "}
                &amp; above
              </span>
            </label>
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={rating === 3}
                onChange={() => onRatingChange(rating === 3 ? undefined : 3)}
                className="rounded-sm border-outline-variant text-primary focus:ring-0 cursor-pointer"
              />
              <span className="text-body-md flex items-center gap-xs text-on-surface">
                3{" "}
                <span
                  className="material-symbols-outlined text-accent-yellow scale-75"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>{" "}
                &amp; above
              </span>
            </label>
          </div>
        </div>

        {/* Discount Filter */}
        <div className="p-base">
          <span className="font-label-bold block mb-md">DISCOUNT</span>
          <div className="space-y-sm">
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
