"use client";

/**
 * FilterDrawer
 *
 * Purpose:
 *   Mobile slide-up bottom sheet exposing all product filter controls.
 *   Wraps the same filter props as FiltersSidebar for a consistent API.
 *
 * Props:
 *   @param isOpen              - Controls drawer visibility
 *   @param onClose             - Callback to close the drawer
 *   @param priceRange          - Current price range [min, max] or undefined
 *   @param onPriceRangeChange  - Updates price range filter
 *   @param rating              - Active rating filter (3 | 4 | undefined)
 *   @param onRatingChange      - Updates rating filter
 *   @param discount            - Active discount filter (10 | 30 | 50 | undefined)
 *   @param onDiscountChange    - Updates discount filter
 *   @param onClearAll          - Resets all active filters
 *
 * States:
 *   Closed  — not rendered (conditional in CatalogPage)
 *   Open    — slides up from bottom, backdrop shown
 *
 * Accessibility:
 *   role="dialog" aria-modal="true" aria-label="Product filters"
 *   Escape key closes the drawer
 *   Focus is retained within the drawer while open
 *
 * Usage:
 *   <FilterDrawer
 *     isOpen={isFilterDrawerOpen}
 *     onClose={() => setIsFilterDrawerOpen(false)}
 *     priceRange={filters.priceRange}
 *     onPriceRangeChange={...}
 *     rating={filters.rating}
 *     onRatingChange={...}
 *     discount={filters.discount}
 *     onDiscountChange={...}
 *     onClearAll={handleClearAll}
 *   />
 */

import React, { useEffect, useState } from "react";
import { ChevronDown, Star, X, SlidersHorizontal } from "lucide-react";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  priceRange: [number, number] | undefined;
  onPriceRangeChange: (range: [number, number] | undefined) => void;
  rating: number | undefined;
  onRatingChange: (rating: number | undefined) => void;
  discount: number | undefined;
  onDiscountChange: (discount: number | undefined) => void;
  onClearAll: () => void;
}

function DrawerFilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-t border-vl-border">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between px-0 py-3.5 text-left"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-vl-ink">
          {title}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 text-vl-muted transition-transform duration-vl-fast ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  );
}

export default function FilterDrawer({
  isOpen,
  onClose,
  priceRange = [499, 10000],
  onPriceRangeChange,
  rating,
  onRatingChange,
  discount,
  onDiscountChange,
  onClearAll,
}: FilterDrawerProps) {
  const currentPriceMax = priceRange ? priceRange[1] : 10000;

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll while drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const ratingOptions = [
    { value: 4, label: "4★ & above" },
    { value: 3, label: "3★ & above" },
  ];

  const discountOptions = [
    { value: 50, label: "50% or more" },
    { value: 30, label: "30% or more" },
    { value: 10, label: "10% or more" },
  ];

  const handleClearAndClose = () => {
    onClearAll();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Product filters"
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-vl-section bg-vl-card shadow-vl-large"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-vl-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-vl-border">
          <div className="flex items-center gap-2">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-vl-muted" />
            <span className="font-vl-heading text-base font-bold text-vl-ink">Filters</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-vl-muted transition-colors duration-vl-fast hover:bg-vl-surface hover:text-vl-ink active:scale-95"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable filter content */}
        <div className="flex-1 overflow-y-auto px-5">
          {/* Price Filter */}
          <DrawerFilterSection title="Price">
            <div className="space-y-3">
              <input
                aria-label="Maximum price filter"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-vl-border accent-vl-primary"
                type="range"
                min="499"
                max="10000"
                step="100"
                value={currentPriceMax}
                onChange={(e) => onPriceRangeChange([499, parseInt(e.target.value, 10)])}
              />
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-vl-surface px-2 py-1 text-xs font-semibold text-vl-muted">
                  ₹499
                </span>
                <span className="rounded-md bg-vl-primary/8 px-2 py-1 text-xs font-bold text-vl-primary">
                  {currentPriceMax >= 10000 ? "₹10,000+" : `₹${currentPriceMax.toLocaleString()}`}
                </span>
              </div>
            </div>
          </DrawerFilterSection>

          {/* Rating Filter */}
          <DrawerFilterSection title="Customer Rating">
            <div className="space-y-2" role="group" aria-label="Filter by rating">
              {ratingOptions.map(({ value }) => {
                const isChecked = rating === value;
                return (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 rounded-vl-control py-1.5 transition-colors duration-vl-fast"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onRatingChange(isChecked ? undefined : value)}
                      className="h-4 w-4 cursor-pointer rounded border-vl-border accent-vl-primary"
                    />
                    <span className="flex items-center gap-1 text-sm font-medium text-vl-ink">
                      {value}
                      <Star aria-hidden="true" className="h-3.5 w-3.5 fill-vl-accent text-vl-accent" />
                      <span className="text-vl-muted">& above</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </DrawerFilterSection>

          {/* Discount Filter */}
          <DrawerFilterSection title="Discount">
            <div className="space-y-2" role="radiogroup" aria-label="Filter by discount">
              {discountOptions.map(({ value }) => {
                const isChecked = discount === value;
                return (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 py-1.5"
                  >
                    <input
                      type="radio"
                      name="drawer-discount-filter"
                      checked={isChecked}
                      onChange={() => onDiscountChange(value)}
                      className="h-4 w-4 cursor-pointer border-vl-border accent-vl-primary"
                    />
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-vl-ink">
                      <span className="rounded-md bg-vl-success/10 px-1.5 py-0.5 text-[11px] font-bold text-vl-success">
                        {value}%+
                      </span>
                      off
                    </span>
                  </label>
                );
              })}
            </div>
          </DrawerFilterSection>
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 border-t border-vl-border px-5 py-4">
          <button
            type="button"
            onClick={handleClearAndClose}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-vl-control border border-vl-border text-sm font-semibold text-vl-ink transition-all duration-vl-fast hover:border-vl-primary hover:text-vl-primary active:scale-[0.98]"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-vl-control bg-vl-primary text-sm font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.25)] transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98]"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
