"use client";

import React from "react";

interface StoreCategoryFilterProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

export default function StoreCategoryFilter({ categories, active, onChange }: StoreCategoryFilterProps) {
  const items = ["all", ...categories];

  return (
    <div
      role="tablist"
      aria-label="Filter stores by category"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 hide-scrollbar md:mx-0 md:flex-wrap md:justify-center md:px-0"
    >
      {items.map((category) => {
        const isActive = category === active;
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(category)}
            className={`inline-flex h-11 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
              isActive
                ? "border-vl-primary bg-vl-primary text-white"
                : "border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary/40 hover:text-vl-primary"
            }`}
          >
            {category === "all" ? "All Stores" : category}
          </button>
        );
      })}
    </div>
  );
}