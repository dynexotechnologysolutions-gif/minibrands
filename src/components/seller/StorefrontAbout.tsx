"use client";

import React, { useState } from "react";
import Image from "next/image";

interface StorefrontAboutProps {
  storeDisplayName: string;
  city: string;
  description?: string | null;
  storeBanner?: string | null;
}

export default function StorefrontAbout({
  storeDisplayName,
  city,
  description,
  storeBanner,
}: StorefrontAboutProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDescription = !!(description && description.trim().length > 20);

  // If no meaningful description, keep compact or omit
  if (!hasDescription) {
    return (
      <div className="space-y-3 border-t border-vl-border/60 pt-8">
        <h2 className="font-vl-heading text-lg font-bold tracking-tight text-vl-ink">About the Store</h2>
        <p className="text-sm leading-relaxed text-vl-muted">
          {storeDisplayName} is a verified boutique from {city} — curating thoughtful fashion, small-batch drops and everyday essentials.
        </p>
      </div>
    );
  }

  const isLong = description!.length > 220;
  const displayText = expanded || !isLong ? description! : description!.slice(0, 220) + "…";

  return (
    <div className="space-y-6 border-t border-vl-border/60 pt-8">
      <div>
        <h2 className="font-vl-heading text-lg font-bold tracking-tight text-vl-ink">About the Store</h2>
        <p className="text-xs text-vl-muted">The story behind {storeDisplayName}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
        <div className="space-y-4">
          <h3 className="font-vl-heading text-base font-bold text-vl-ink">About {storeDisplayName}</h3>
          <p className="text-sm leading-relaxed text-vl-muted whitespace-pre-wrap break-words">
            {displayText}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm font-bold text-vl-primary hover:underline"
              aria-expanded={expanded}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {storeBanner && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-vl-card bg-vl-surface border border-vl-border">
            <Image
              src={storeBanner}
              alt={`${storeDisplayName} atelier`}
              fill
              sizes="(max-width: 1024px) 100vw, 400px"
              className="object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
}
