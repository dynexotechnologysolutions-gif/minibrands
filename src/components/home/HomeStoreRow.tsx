"use client";

import React, { useRef } from "react";
import Link from "next/link";

interface SellerData {
  id: string;
  businessName: string;
  category: string;
  logoUrl?: string | null;
}

interface HomeStoreRowProps {
  sellers: SellerData[];
}

export default function HomeStoreRow({ sellers }: HomeStoreRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: -240, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: 240, behavior: "smooth" });
    }
  };

  return (
    <section className="w-full max-w-container-max px-base lg:px-xl mt-xxl overflow-hidden">
      <div className="flex items-center justify-between mb-lg border-b border-border-gray pb-sm">
        <h2 className="text-headline-md font-bold text-primary font-headline-md">Featured Stores</h2>
        <div className="flex items-center gap-md">
          <button
            onClick={scrollLeft}
            className="w-8 h-8 rounded-full border border-border-gray flex items-center justify-center hover:bg-surface-container-low transition-colors cursor-pointer select-none"
            aria-label="Scroll left"
            suppressHydrationWarning={true}
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <button
            onClick={scrollRight}
            className="w-8 h-8 rounded-full border border-border-gray flex items-center justify-center hover:bg-surface-container-low transition-colors cursor-pointer select-none"
            aria-label="Scroll right"
            suppressHydrationWarning={true}
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      <div
        ref={rowRef}
        className="flex overflow-x-auto gap-md sm:gap-lg pb-md no-scrollbar snap-x scroll-smooth max-w-full"
      >
        {sellers.map((seller) => (
          <Link
            key={seller.id}
            href={`/sellers/${seller.id}`}
            className="flex flex-col items-center min-w-[120px] snap-start group cursor-pointer select-none"
          >
            <div className="w-20 h-20 rounded-xl border border-border-gray bg-surface-container-low p-sm mb-sm overflow-hidden group-hover:border-primary transition-colors flex items-center justify-center">
              {seller.logoUrl ? (
                <div
                  className="w-full h-full bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url('${seller.logoUrl}')` }}
                />
              ) : (
                <div className="w-full h-full bg-[#f1f1f1] rounded-DEFAULT" />
              )}
            </div>
            <span className="text-label-bold font-bold text-primary text-center truncate w-24">
              {seller.businessName}
            </span>
            <span className="text-body-sm font-body-sm text-text-muted text-center truncate w-24">
              {seller.category}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
