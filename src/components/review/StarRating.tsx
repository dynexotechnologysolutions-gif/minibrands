"use client";

import React from "react";

interface StarRatingProps {
  value: number; // 1-5
  onChange?: (rating: number) => void; // if undefined, read-only mode
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: "text-[16px]",
  md: "text-[22px]",
  lg: "text-[30px]",
};

/**
 * Interactive or read-only star rating using Material Symbols.
 * Interactive mode: hover highlights + click to set.
 * Read-only mode: renders static filled/empty stars.
 */
export default function StarRating({ value, onChange, size = "md" }: StarRatingProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const isInteractive = Boolean(onChange);

  const displayValue = hovered ?? value;

  return (
    <div
      className={`flex gap-xs text-accent-yellow ${isInteractive ? "cursor-pointer" : ""}`}
      role={isInteractive ? "radiogroup" : "img"}
      aria-label={`Rating: ${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={isInteractive ? "button" : undefined}
          disabled={!isInteractive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => isInteractive && setHovered(star)}
          onMouseLeave={() => isInteractive && setHovered(null)}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          className={`${isInteractive ? "hover:scale-110 active:scale-95 transition-transform" : "pointer-events-none"} p-0 border-0 bg-transparent`}
        >
          <span
            className={`material-symbols-outlined ${SIZE_MAP[size]}`}
            style={{
              fontVariationSettings: `'FILL' ${displayValue >= star ? 1 : 0}`,
            }}
          >
            grade
          </span>
        </button>
      ))}
    </div>
  );
}
