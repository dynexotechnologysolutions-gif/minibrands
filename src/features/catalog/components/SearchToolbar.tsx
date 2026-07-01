"use client";

import React from "react";

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
    <div className="mb-lg">
      {/* Breadcrumb */}
      <nav className="flex text-body-sm text-text-muted mb-xs flex-wrap items-center">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="mx-xs">/</span>}
            <span
              className={
                idx === breadcrumbs.length - 1
                  ? "text-on-surface font-semibold"
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
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            {headingText}
          </h1>
          <p className="text-body-md text-text-muted mt-xs">
            Showing {totalProducts.toLocaleString()} products found in {searchTime} seconds
          </p>
        </div>

        {/* Toolbar: Sort & View Toggle */}
        <div className="flex items-center gap-base">
          {/* View Toggles (Mock/UI only to match the HTML) */}
          <div className="flex items-center bg-surface-container rounded-lg p-1">
            <button className="p-1.5 bg-surface shadow-sm rounded-md flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
            <button className="p-1.5 text-on-surface-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <select
              value={sort}
              onChange={handleSortSelect}
              className="appearance-none bg-surface border border-outline-variant rounded-lg px-base py-2 pr-10 text-body-md focus:ring-primary focus:border-primary outline-none cursor-pointer text-on-surface"
            >
              <option value="popularity">Sort by: Popularity</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="rating">Customer Rating</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant select-none">
              expand_more
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
