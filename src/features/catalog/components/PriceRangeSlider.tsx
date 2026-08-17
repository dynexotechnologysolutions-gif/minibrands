"use client";

/**
 * PriceRangeSlider
 *
 * Smooth drag for the maximum-price filter.
 * The thumb + price label update from local state on every change, while the
 * URL/navigation update happens exactly once — on release (pointer up / key up /
 * blur). This avoids spamming router.push + refetch per pixel, which made the
 * slider feel laggy and the grid appear to "load" after each drag.
 *
 * Props:
 *   @param value     - Current applied max price (from URL), default 10000
 *   @param onCommit  - Called once with the final max price when the user releases
 */

import React, { useState } from "react";

interface PriceRangeSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onCommit: (maxValue: number) => void;
}

export default function PriceRangeSlider({
  value,
  min = 499,
  max = 10000,
  step = 100,
  onCommit,
}: PriceRangeSliderProps) {
  const [draft, setDraft] = useState(value);

  // Re-sync local state when the applied value changes externally
  // (e.g., Clear All resets the URL). Uses the documented "adjust state when a
  // prop changes" pattern: update during render, not inside an effect.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  const commit = () => {
    if (draft !== value) {
      onCommit(draft);
    }
  };

  return (
    <div className="space-y-3">
      <input
        aria-label="Maximum price filter"
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-vl-border accent-vl-primary"
        type="range"
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={(e) => setDraft(parseInt(e.target.value, 10))}
        onPointerUp={commit}
        onKeyUp={(e) => {
          if (
            e.key === "ArrowLeft" ||
            e.key === "ArrowRight" ||
            e.key === "Home" ||
            e.key === "End"
          ) {
            commit();
          }
        }}
        onBlur={commit}
      />
      <div className="flex items-center justify-between">
        <span className="rounded-md bg-vl-surface px-2 py-1 text-xs font-semibold text-vl-muted">
          ₹{min.toLocaleString()}
        </span>
        <span className="rounded-md bg-vl-primary/8 px-2 py-1 text-xs font-bold text-vl-primary">
          {draft >= max ? `₹${max.toLocaleString()}+` : `₹${draft.toLocaleString()}`}
        </span>
      </div>
    </div>
  );
}