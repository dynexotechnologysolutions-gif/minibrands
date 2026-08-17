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
    <div className="relative -mx-4 mb-4 px-4 sm:mx-0 sm:px-0">
      {/* Right gradient fade — scroll hint */}
      <div
        className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-vl-surface to-transparent sm:hidden"
        aria-hidden="true"
      />

      <div
        className="hide-scrollbar flex items-stretch gap-1 overflow-x-auto border-b border-vl-border sm:gap-2"
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
                min-h-11 shrink-0 whitespace-nowrap rounded-t-md px-3 text-sm font-semibold
                transition-colors duration-vl-fast select-none sm:px-4
                ${
                  isActive
                    ? "text-vl-primary"
                    : "text-vl-muted hover:text-vl-ink"
                }
              `}
              style={
                isActive
                  ? { boxShadow: "inset 0 -2px 0 0 var(--vl-primary)" }
                  : undefined
              }
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}