"use client";

import React from "react";
import { ChevronDown, Grid2X2, List } from "lucide-react";

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
    headingText = `Results for '${query}'`;
  } else if (category && category !== "All") {
    headingText = category;
  }

  return (
    <div className="mb-8">
      {/* Breadcrumb */}
      <nav className="mb-2 flex flex-wrap items-center text-sm text-vl-muted" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="mx-2 text-vl-border">/</span>}
            <span
              className={
                idx === breadcrumbs.length - 1
                  ? "font-semibold text-vl-ink"
                  : ""
              }
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Heading & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-base">
        <div>
          <h1 className="font-vl-heading text-3xl font-extrabold tracking-[-0.04em] text-vl-ink sm:text-4xl">
            {headingText}
          </h1>
          <p className="mt-2 text-sm text-vl-muted">
            Showing {totalProducts.toLocaleString()} products found in {searchTime} seconds
          </p>
        </div>

        {/* Toolbar: Sort & View Toggle */}
        <div className="flex items-center gap-base">
          {/* View Toggles (Mock/UI only to match the HTML) */}
          <div className="hidden items-center gap-1 rounded-full border border-vl-border bg-vl-card p-1 shadow-vl-soft sm:flex">
            <button type="button" aria-label="Grid view" aria-pressed="true" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full bg-vl-ink text-white" suppressHydrationWarning>
              <Grid2X2 aria-hidden="true" className="h-4 w-4" />
            </button>
            <button type="button" aria-label="List view" aria-pressed="false" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-vl-muted transition hover:bg-vl-surface" suppressHydrationWarning>
              <List aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <label htmlFor="catalog-sort" className="sr-only">Sort products</label>
            <select
              id="catalog-sort"
              value={sort}
              onChange={handleSortSelect}
              className="min-h-11 appearance-none rounded-vl-control border border-vl-border bg-vl-card px-4 pr-10 text-sm font-semibold text-vl-ink outline-none transition focus:border-vl-primary focus:ring-2 focus:ring-vl-primary/20"
              suppressHydrationWarning
            >
              <option value="popularity">Sort by: Popularity</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="rating">Customer Rating</option>
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vl-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
