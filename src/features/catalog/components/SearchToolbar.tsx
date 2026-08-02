"use client";

import React from "react";
import { ChevronDown, LayoutGrid, List } from "lucide-react";

interface SearchToolbarProps {
  query?: string;
  category?: string;
  totalProducts: number;
  searchTime?: number;
  sort: string;
  onSortChange: (sort: string) => void;
  breadcrumbs?: string[];
}

export default function SearchToolbar({
  query,
  category,
  totalProducts,
  searchTime = 0.42,
  sort,
  onSortChange,
  breadcrumbs = ["Home", "Products"],
}: SearchToolbarProps) {
  const handleSortSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value);
  };

  let headingText = "Products";
  if (query) {
    headingText = `Results for "${query}"`;
  } else if (category && category !== "All") {
    headingText = category;
  }

  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <span className="text-vl-border" aria-hidden="true">›</span>
            )}
            <span
              className={
                idx === breadcrumbs.length - 1
                  ? "font-semibold text-vl-ink"
                  : "text-vl-muted transition-colors duration-vl-fast hover:text-vl-ink"
              }
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Heading + Toolbar row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {/* Left: Heading + count */}
        <div>
          <h1 className="font-vl-heading text-2xl font-extrabold tracking-[-0.04em] text-vl-ink sm:text-3xl">
            {headingText}
          </h1>
          <p className="mt-1 text-sm text-vl-muted">
            {totalProducts.toLocaleString()} results
            {searchTime > 0 && (
              <span className="ml-1 text-vl-border">· {searchTime}s</span>
            )}
          </p>
        </div>

        {/* Right: Sort + View toggle */}
        <div className="flex items-center gap-2">
          {/* View toggle — grid only for now, list is UI placeholder */}
          <div
            className="hidden items-center gap-1 rounded-full border border-vl-border bg-vl-card p-1 shadow-vl-soft sm:flex"
            aria-label="View mode"
            role="group"
          >
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed="true"
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full bg-vl-ink text-white transition-all duration-vl-fast"
            >
              <LayoutGrid aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed="false"
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full text-vl-muted transition-all duration-vl-fast hover:bg-vl-surface hover:text-vl-ink"
            >
              <List aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="relative flex items-center">
            <label htmlFor="catalog-sort" className="sr-only">
              Sort products
            </label>
            <select
              id="catalog-sort"
              value={sort}
              onChange={handleSortSelect}
              className="min-h-11 appearance-none rounded-vl-control border border-vl-border bg-vl-card px-4 pr-10 text-sm font-semibold text-vl-ink outline-none transition-all duration-vl-fast focus:border-vl-primary focus:ring-2 focus:ring-vl-primary/20 hover:border-vl-border-strong"
            >
              <option value="popularity">Sort: Popularity</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="rating">Customer Rating</option>
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-vl-muted"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
