"use client";

import React, { useEffect } from "react";
import { ArrowUpDown, Check, X } from "lucide-react";

interface SortSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeSort: string;
  onSortChange: (value: string) => void;
}

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "popularity", label: "Popularity" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Customer Rating" },
];

export default function SortSheet({
  isOpen,
  onClose,
  activeSort,
  onSortChange,
}: SortSheetProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll while sheet is open
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

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sort products"
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[70vh] flex-col rounded-t-vl-section bg-vl-card shadow-vl-large"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-vl-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-vl-border px-5 py-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown aria-hidden="true" className="h-4 w-4 text-vl-primary" />
            <span className="font-vl-heading text-base font-bold text-vl-ink">Sort By</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sort options"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-vl-muted transition-colors duration-vl-fast hover:bg-vl-surface hover:text-vl-ink active:scale-95"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {/* Options */}
        <div className="flex-1 overflow-y-auto px-2 py-2" role="radiogroup" aria-label="Sort products">
          {SORT_OPTIONS.map((opt) => {
            const isActive = activeSort === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => {
                  onSortChange(opt.value);
                  onClose();
                }}
                className={`flex min-h-11 w-full items-center justify-between rounded-vl-control px-4 text-sm transition-colors duration-vl-fast ${
                  isActive
                    ? "bg-vl-primary/8 font-bold text-vl-primary"
                    : "font-medium text-vl-ink hover:bg-vl-surface"
                }`}
              >
                <span>{opt.label}</span>
                {isActive && (
                  <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-vl-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-vl-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-vl-control bg-vl-primary text-sm font-bold text-white transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}