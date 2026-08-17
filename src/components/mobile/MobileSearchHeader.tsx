"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowLeft, X } from "lucide-react";

export default function MobileSearchHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const [prevQuery, setPrevQuery] = useState(currentQuery);

  // Sync state with URL search param
  if (currentQuery !== prevQuery) {
    setSearchQuery(currentQuery);
    setPrevQuery(currentQuery);
  }

  const categoryParam = searchParams.get("category");

  const handleBack = () => {
    router.push(categoryParam && categoryParam !== "All" ? "/categories" : "/");
  };

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

  return (
    <div className="w-full flex flex-col bg-white border-b border-[#ECECEC]/80 px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-3 shadow-sm md:hidden">
      {/* Search Input Row */}
      <div className="flex items-center gap-3 h-11">
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-50 text-slate-700"
          aria-label="Go back"
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
            className="w-full h-10 pl-9 pr-9 bg-[#F5F5F8] border border-transparent rounded-vl-control text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-vl-primary focus:outline-none transition-all duration-200"
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
    </div>
  );
}