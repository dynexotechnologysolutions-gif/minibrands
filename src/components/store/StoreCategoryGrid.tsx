import React from "react";
import Link from "next/link";
import {
  CupSoda,
  Dumbbell,
  Flower2,
  HeartPulse,
  Home,
  Laptop,
  Shirt,
  Sparkles,
  Store,
  Utensils,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  "Home Decor": Home,
  Kitchen: Utensils,
  Fashion: Shirt,
  Beauty: Sparkles,
  Electronics: Laptop,
  Spiritual: Flower2,
  Wellness: HeartPulse,
  Bottles: CupSoda,
  Fitness: Dumbbell,
};

export interface StoreCategoryCount {
  name: string;
  count: number;
}

interface StoreCategoryGridProps {
  categories: StoreCategoryCount[];
}

export default function StoreCategoryGrid({ categories }: StoreCategoryGridProps) {
  if (!categories.length) return null;

  return (
    <section className="mt-8 sm:mt-12" aria-label="Browse stores by category">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-vl-heading text-xl font-bold tracking-[-0.03em] text-vl-ink sm:text-2xl">
            Browse Stores by Category
          </h2>
          <p className="mt-1 text-sm text-vl-muted">Find a boutique in every corner.</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4">
        {categories.map(({ name, count }) => {
          const Icon = CATEGORY_ICONS[name] || Store;
          return (
            <Link
              key={name}
              href={`/stores?category=${encodeURIComponent(name)}`}
              className="group flex items-center gap-3 rounded-vl-card border border-vl-border bg-vl-card p-4 shadow-vl-soft transition-all duration-200 hover:border-vl-primary/40 hover:shadow-vl-medium"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-vl-primary/10 text-vl-primary transition-colors duration-200 group-hover:bg-vl-primary group-hover:text-white">
                <Icon aria-hidden={true} className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-vl-ink">{name}</p>
                <p className="text-xs text-vl-muted">
                  {count} {count === 1 ? "Store" : "Stores"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}