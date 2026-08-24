"use client";

import React from "react";
import StoreSearch from "./StoreSearch";
import StoreCategoryFilter from "./StoreCategoryFilter";

interface StoreDiscoveryHeroProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function StoreDiscoveryHero({
  searchValue,
  onSearchChange,
  categories,
  activeCategory,
  onCategoryChange,
}: StoreDiscoveryHeroProps) {
  return (
    <div className="py-6 sm:py-10">
      <div className="mx-auto max-w-3xl text-center md:text-left">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-vl-muted">Discover Brands</p>
        <h1 className="mt-1 font-vl-heading text-3xl font-extrabold tracking-[-0.03em] text-vl-ink sm:text-4xl">
          Find boutiques you&apos;ll love
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-vl-muted sm:text-[15px] md:mx-0">
          Independent labels and local boutiques — curated, verified, and ready to shop.
        </p>
      </div>
      <div className="mx-auto mt-6 max-w-2xl">
        <StoreSearch value={searchValue} onChange={onSearchChange} placeholder="Search brands, boutiques or categories..." />
      </div>
      <div className="mt-4 flex justify-center md:justify-start">
        <StoreCategoryFilter categories={categories} active={activeCategory} onChange={onCategoryChange} />
      </div>
    </div>
  );
}