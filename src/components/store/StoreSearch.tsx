"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface StoreSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function StoreSearch({ value, onChange }: StoreSearchProps) {
  return (
    <div className="relative w-full">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-vl-muted"
      />
      <label htmlFor="store-search" className="sr-only">
        Search stores
      </label>
      <input
        id="store-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search stores by name or category"
        autoComplete="off"
        className="h-12 w-full rounded-vl-control border border-vl-border bg-white pl-11 pr-11 text-sm text-vl-ink shadow-vl-soft outline-none transition-colors duration-200 placeholder:text-vl-muted focus:border-vl-primary"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-vl-muted transition-colors duration-200 hover:bg-vl-surface hover:text-vl-ink"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}