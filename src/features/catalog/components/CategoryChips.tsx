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
    <div className="flex items-center gap-sm overflow-x-auto hide-scrollbar mb-xl pb-1">
      {displayCategories.map((cat) => {
        const isActive = activeCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`whitespace-nowrap px-lg py-2 rounded-full font-label-bold text-label-bold transition-all cursor-pointer ${
              isActive
                ? "bg-primary text-on-primary"
                : "bg-surface border border-outline-variant hover:border-primary text-on-surface"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
