"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowLeft, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";

export default function MobileSearchHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const [prevQuery, setPrevQuery] = useState(currentQuery);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Sync state with URL search param
  if (currentQuery !== prevQuery) {
    setSearchQuery(currentQuery);
    setPrevQuery(currentQuery);
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  const handleSortChange = (sortVal: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sortVal);
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
    setShowSortDropdown(false);
  };

  const currentSort = searchParams.get("sort") || "popularity";
  const activeFiltersCount = [
    searchParams.get("priceRange"),
    searchParams.get("rating"),
    searchParams.get("discount"),
  ].filter(Boolean).length;

  return (
    <div className="w-full flex flex-col bg-white border-b border-[#ECECEC]/80 px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-3 shadow-sm md:hidden">
      {/* Search Input Row */}
      <div className="flex items-center gap-3 h-11">
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-50 text-slate-700"
          aria-label="Go to Home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brands, products, collections..."
            className="w-full h-10 pl-9 pr-9 bg-[#F5F5F8] border border-transparent rounded-vl-control text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#FF3E6C] focus:outline-none transition-all duration-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Sort & Filter Shortcuts Row */}
      <div className="flex items-center gap-2 mt-2 pt-1">
        {/* Sort Trigger */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className={`w-full flex items-center justify-center gap-1.5 h-9 rounded-vl-control text-[11px] font-bold border transition-colors ${
              showSortDropdown
                ? "border-[#FF3E6C] bg-[#FF3E6C]/5 text-[#FF3E6C]"
                : "border-[#ECECEC] bg-white text-slate-700"
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>
              Sort:{" "}
              {currentSort === "popularity"
                ? "Popularity"
                : currentSort === "price-asc"
                ? "Price: Low to High"
                : currentSort === "price-desc"
                ? "Price: High to Low"
                : currentSort === "newest"
                ? "Newest"
                : currentSort}
            </span>
          </button>

          {showSortDropdown && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/10"
                onClick={() => setShowSortDropdown(false)}
              />
              <div className="absolute left-0 mt-1.5 w-full rounded-vl-card border border-[#ECECEC] bg-white p-1 shadow-lg z-50 animate-fade-in-up">
                {[
                  ["popularity", "Popularity"],
                  ["newest", "Newest Arrivals"],
                  ["price-asc", "Price: Low to High"],
                  ["price-desc", "Price: High to Low"],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => handleSortChange(val)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                      currentSort === val
                        ? "text-[#FF3E6C] bg-[#FF3E6C]/5 font-bold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Filter Trigger */}
        <button
          onClick={() => window.dispatchEvent(new Event("open-filter-drawer"))}
          className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-vl-control text-[11px] font-bold border transition-colors ${
            activeFiltersCount > 0
              ? "border-[#FF3E6C] bg-[#FF3E6C]/5 text-[#FF3E6C]"
              : "border-[#ECECEC] bg-white text-slate-700"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-[#FF3E6C] text-white text-[8px] font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
