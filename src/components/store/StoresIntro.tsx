import React from "react";
import Link from "next/link";

export default function StoresIntro() {
  return (
    <div className="flex items-end justify-between gap-4 pt-6 sm:pt-8">
      <div className="min-w-0">
        <h1 className="font-vl-heading text-2xl font-bold tracking-[-0.03em] text-vl-ink sm:text-3xl">Stores</h1>
        <p className="mt-1 text-sm text-vl-muted sm:text-base">
          Explore trusted stores and discover products from sellers you love.
        </p>
      </div>
      <Link href="#store-grid" className="shrink-0 text-sm font-semibold text-vl-primary hover:underline">
        View All →
      </Link>
    </div>
  );
}