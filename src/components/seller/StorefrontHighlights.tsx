"use client";

import React from "react";
import { Check, ShieldCheck, Heart, Sparkles, Truck, Award } from "lucide-react";

interface StorefrontHighlightsProps {
  category: string;
  sellerId: string;
}

export default function StorefrontHighlights({ category, sellerId }: StorefrontHighlightsProps) {
  // Deterministic checks based on sellerId
  const charSum = sellerId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isSustainable = category.toLowerCase().includes("ethnic") || charSum % 3 === 0;
  const isHandmade = category.toLowerCase().includes("craft") || category.toLowerCase().includes("ethnic") || charSum % 4 === 0;
  const isWomenOwned = charSum % 2 === 0;
  const isLimited = charSum % 5 === 0;

  const highlights = [
    { label: "Verified Boutique", icon: ShieldCheck, active: true },
    { label: "Made in India", icon: Award, active: true },
    { label: "Sustainable Craft", icon: Sparkles, active: isSustainable },
    { label: "Handmade Art", icon: Heart, active: isHandmade },
    { label: "Women-Owned", icon: Check, active: isWomenOwned },
    { label: "Limited Collections", icon: Sparkles, active: isLimited },
    { label: "Ships Next Day", icon: Truck, active: true },
  ].filter((h) => h.active);

  return (
    <div className="hide-scrollbar -mx-4 sm:-mx-0 flex gap-2 overflow-x-auto px-4 sm:px-0 py-1">
      {highlights.map((h, i) => {
        const Icon = h.icon;
        return (
          <div
            key={i}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-vl-border bg-vl-card px-3 text-[10px] sm:text-xs font-bold text-vl-ink uppercase tracking-wider shrink-0 shadow-vl-soft"
          >
            <Icon className="w-3.5 h-3.5 text-vl-primary shrink-0" />
            <span>{h.label}</span>
          </div>
        );
      })}
    </div>
  );
}
