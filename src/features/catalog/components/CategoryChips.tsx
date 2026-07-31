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
    <div className="hide-scrollbar mb-xl flex items-center gap-2 overflow-x-auto pb-1" aria-label="Product categories">
      {displayCategories.map((cat) => {
        const isActive = activeCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            suppressHydrationWarning
            aria-pressed={isActive}
            className={`min-h-11 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition duration-vl-fast ${
              isActive
                ? "bg-vl-ink text-white shadow-vl-soft"
                : "border border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary hover:text-vl-primary"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
