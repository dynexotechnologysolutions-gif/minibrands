"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

export interface EditCategory {
  name: string;
  count: number;
}

interface StoreEditorialEditProps {
  categories: EditCategory[];
  onSelect: (category: string) => void;
}

export default function StoreEditorialEdit({ categories, onSelect }: StoreEditorialEditProps) {
  if (categories.length === 0) return null;

  return (
    <section className="mt-8 sm:mt-10">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-vl-heading text-xl font-bold tracking-[-0.03em] text-vl-ink sm:text-2xl">Explore by Category</h2>
          <p className="mt-1 text-sm text-vl-muted">Browse boutiques by what they do best.</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {categories.map((category) => (
          <button
            key={category.name}
            type="button"
            onClick={() => onSelect(category.name)}
            className="group relative flex min-h-[112px] flex-col justify-between overflow-hidden rounded-vl-card border border-vl-border bg-vl-card p-4 text-left shadow-vl-soft transition-all duration-200 hover:border-vl-primary/30 hover:shadow-vl-medium active:scale-[0.98] sm:min-h-[128px]"
          >
            <span className="font-vl-heading text-sm font-extrabold uppercase tracking-wide text-vl-ink group-hover:text-vl-primary sm:text-base">
              {category.name}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-vl-muted">
              {category.count} {category.count === 1 ? "brand" : "brands"} <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 text-vl-primary transition-transform group-hover:translate-x-0.5" />
            </span>
            <span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-vl-surface/60 to-transparent" />
          </button>
        ))}
      </div>
    </section>
  );
}