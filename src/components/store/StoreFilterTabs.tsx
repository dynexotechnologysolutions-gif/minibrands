"use client";

import React from "react";
import { Flame, Heart, Sparkles, Star, Store } from "lucide-react";

export type StoreTab = "all" | "popular" | "topRated" | "new" | "following";

const TABS: { key: StoreTab; label: string; Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> }[] = [
  { key: "all", label: "All Stores", Icon: Store },
  { key: "popular", label: "Popular", Icon: Flame },
  { key: "topRated", label: "Top Rated", Icon: Star },
  { key: "new", label: "New Stores", Icon: Sparkles },
  { key: "following", label: "Following", Icon: Heart },
];

interface StoreFilterTabsProps {
  active: StoreTab;
  onChange: (tab: StoreTab) => void;
}

export default function StoreFilterTabs({ active, onChange }: StoreFilterTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter stores"
      className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 hide-scrollbar md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
    >
      {TABS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-bold transition-all duration-200 ${
              isActive
                ? "bg-vl-primary text-white shadow-sm"
                : "border border-vl-primary/40 bg-white text-vl-ink hover:border-vl-primary hover:text-vl-primary"
            }`}
          >
            <Icon aria-hidden={true} className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
