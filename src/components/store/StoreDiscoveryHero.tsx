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
    <div className="pt-6 sm:pt-10">
      <div className="max-w-2xl">
        <h1 className="font-vl-heading text-2xl font-bold tracking-[-0.03em] text-vl-ink sm:text-3xl">
          Discover Brands
        </h1>
        <p className="mt-2 text-sm text-vl-muted sm:text-base">
          Find independent labels, local boutiques, and styles worth discovering.
        </p>
      </div>
      <div className="mt-5">
        <StoreSearch value={searchValue} onChange={onSearchChange} />
      </div>
      <div className="mt-4">
        <StoreCategoryFilter categories={categories} active={activeCategory} onChange={onCategoryChange} />
      </div>
    </div>
  );
}