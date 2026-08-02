"use client";

import React from "react";

interface CategoryChipsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryChips({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryChipsProps) {
  // Ensure "All" is always first
  const displayCategories = categories.includes("All")
    ? categories
    : ["All", ...categories];

  return (
    <div className="relative mb-6">
      {/* Left gradient fade — scroll hint */}
      <div
        className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-vl-surface to-transparent"
        aria-hidden="true"
      />
      {/* Right gradient fade — scroll hint */}
      <div
        className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-vl-surface to-transparent"
        aria-hidden="true"
      />

      <div
        className="hide-scrollbar flex items-center gap-2 overflow-x-auto px-1 pb-1"
        aria-label="Product categories"
        role="group"
      >
        {displayCategories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              aria-pressed={isActive}
              className={`
                min-h-11 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold
                transition-all duration-vl-fast select-none
                ${
                  isActive
                    ? "bg-vl-ink text-white shadow-vl-soft"
                    : "border border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary hover:text-vl-primary active:scale-[0.97]"
                }
              `}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
