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
    <section className="mt-8 sm:mt-12">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-vl-heading text-xl font-bold tracking-[-0.03em] text-vl-ink sm:text-2xl">The Edit</h2>
          <p className="mt-1 text-sm text-vl-muted">Curated discoveries from MiniBrands.</p>
        </div>
      </div>

      <div className="-mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar md:mx-0 md:flex-wrap md:px-0 md:pb-0">
        {categories.map((category) => (
          <button
            key={category.name}
            type="button"
            onClick={() => onSelect(category.name)}
            className="group inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-vl-control border border-vl-border bg-vl-card px-4 py-3 text-left transition-all duration-150 hover:border-vl-primary/40 hover:bg-white active:scale-[0.98]"
          >
            <span className="font-vl-heading text-sm font-bold text-vl-ink group-hover:text-vl-primary">
              {category.name}
            </span>
            <span className="text-xs text-vl-muted">
              {category.count} {category.count === 1 ? "brand" : "brands"}
            </span>
            <ArrowRight aria-hidden="true" className="h-4 w-4 text-vl-primary" />
          </button>
        ))}
      </div>
    </section>
  );
}