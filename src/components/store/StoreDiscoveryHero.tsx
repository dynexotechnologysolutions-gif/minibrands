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
    <div className="w-full py-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center md:items-start md:text-left">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-vl-primary">Discover Brands</p>
        <h1 className="mt-2 font-vl-heading text-[28px] font-extrabold leading-none tracking-[-0.03em] text-vl-ink sm:text-4xl md:text-[38px]">
          Find boutiques you&apos;ll love
        </h1>
        <p className="mx-auto mt-3 w-full max-w-sm text-pretty text-center text-sm leading-relaxed text-vl-muted sm:text-[15px] md:mx-0 md:text-left">
          Independent labels and local boutiques — curated, verified, and ready to shop.
        </p>
      </div>
      <div className="mx-auto mt-7 max-w-2xl">
        <StoreSearch value={searchValue} onChange={onSearchChange} placeholder="Search brands, boutiques or categories..." />
      </div>
      <div className="mt-5 flex justify-center md:justify-start">
        <StoreCategoryFilter categories={categories} active={activeCategory} onChange={onCategoryChange} />
      </div>
    </div>
  );
}