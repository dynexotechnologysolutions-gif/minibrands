"use client";

import { ArrowUpDown, ChevronDown, SlidersHorizontal } from "lucide-react";

interface ProductToolbarProps {
  totalProducts: number;
  activeSort: string;
  activeFiltersCount: number;
  onSortChange: (value: string) => void;
  onOpenFilters: () => void;
  onOpenSort: () => void;
}

const SORT_OPTIONS: Array<{ value: string; label: string; shortLabel: string }> = [
  { value: "popularity", label: "Popularity", shortLabel: "Popularity" },
  { value: "newest", label: "Newest", shortLabel: "Newest" },
  { value: "price_asc", label: "Price: Low to High", shortLabel: "Low to High" },
  { value: "price_desc", label: "Price: High to Low", shortLabel: "High to Low" },
  { value: "rating", label: "Customer Rating", shortLabel: "Top Rated" },
];

export default function ProductToolbar({
  totalProducts,
  activeSort,
  activeFiltersCount,
  onSortChange,
  onOpenFilters,
  onOpenSort,
}: ProductToolbarProps) {
  const currentShortLabel =
    SORT_OPTIONS.find((opt) => opt.value === activeSort)?.shortLabel ?? "Popularity";

  return (
    <div className="flex items-center justify-between gap-3 border-t border-vl-border py-3 sm:border-t-0 sm:py-0">
      <p className="shrink-0 text-sm font-semibold text-vl-muted">
        {totalProducts.toLocaleString("en-IN")} Products
      </p>

      <div className="flex items-center gap-2">
        {/* Filter — mobile/tablet; desktop uses the sidebar */}
        <button
          type="button"
          onClick={onOpenFilters}
          aria-label="Filter products"
          className="lg:hidden inline-flex min-h-11 items-center justify-center gap-1.5 rounded-vl-control border border-vl-border bg-white px-3.5 text-sm font-semibold text-vl-ink transition-all duration-vl-fast hover:border-vl-primary hover:text-vl-primary active:scale-[0.98]"
        >
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-vl-primary" />
          Filter
          {activeFiltersCount > 0 && (
            <span className="inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-vl-primary px-1 text-[9px] font-bold text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Sort — mobile/tablet opens the sort sheet */}
        <button
          type="button"
          onClick={onOpenSort}
          aria-label="Sort products"
          className="md:hidden inline-flex min-h-11 items-center justify-center gap-1.5 rounded-vl-control border border-vl-border bg-white px-3.5 text-sm font-semibold text-vl-ink transition-all duration-vl-fast hover:border-vl-primary hover:text-vl-primary active:scale-[0.98]"
        >
          <ArrowUpDown aria-hidden="true" className="h-4 w-4 text-vl-primary" />
          <span className="max-w-[120px] truncate">Sort: {currentShortLabel}</span>
        </button>

        {/* Sort — desktop select */}
        <div className="relative hidden md:block">
          <label htmlFor="catalog-sort" className="sr-only">
            Sort products
          </label>
          <select
            id="catalog-sort"
            value={activeSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="min-h-11 appearance-none rounded-vl-control border border-vl-border bg-white pl-4 pr-10 text-sm font-semibold text-vl-ink outline-none transition-all duration-vl-fast hover:border-vl-primary focus:border-vl-primary focus:ring-2 focus:ring-vl-primary/20"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vl-muted"
          />
        </div>
      </div>
    </div>
  );
}