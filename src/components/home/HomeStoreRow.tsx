"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Store } from "lucide-react";

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
  const scroll = (distance: number) => rowRef.current?.scrollBy({ left: distance, behavior: "smooth" });

  return (
    <section className="vl-section-shell mt-16 sm:mt-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">Browse the people behind the pieces</p>
          <h2 className="font-vl-heading text-2xl font-bold tracking-[-0.04em] text-vl-ink sm:text-3xl">Featured stores</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => scroll(-260)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-vl-border bg-vl-card text-vl-muted transition hover:border-vl-primary hover:text-vl-primary" aria-label="Scroll featured stores left"><ChevronLeft aria-hidden="true" className="h-4 w-4" /></button>
          <button type="button" onClick={() => scroll(260)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-vl-border bg-vl-card text-vl-muted transition hover:border-vl-primary hover:text-vl-primary" aria-label="Scroll featured stores right"><ChevronRight aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      </div>
      <div ref={rowRef} className="hide-scrollbar mt-6 flex snap-x gap-4 overflow-x-auto pb-4">
        {sellers.map((seller) => {
          const initials = seller.businessName ? seller.businessName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "ST";
          return (
            <Link
              key={seller.id}
              href={`/sellers/${seller.id}`}
              className="group flex min-w-[170px] snap-start flex-col rounded-vl-card border border-vl-border bg-vl-card p-5 shadow-vl-soft transition-all duration-vl-standard ease-vl-out hover:-translate-y-1 hover:shadow-vl-medium hover:border-vl-primary/20 sm:min-w-[200px]"
            >
              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[20px] bg-vl-surface border border-vl-border/40">
                {seller.logoUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${seller.logoUrl}')` }}
                    aria-label={`${seller.businessName} logo`}
                    role="img"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-vl-primary/10 text-vl-primary font-vl-heading text-lg font-bold">
                    {initials}
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-vl-heading text-sm font-bold text-vl-ink group-hover:text-vl-primary transition-colors duration-vl-fast">
                    {seller.businessName}
                  </h3>
                  <p className="mt-1 truncate text-xs text-vl-muted font-medium">
                    {seller.category || "Fashion Boutique"}
                  </p>
                </div>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-vl-muted transition group-hover:translate-x-1 group-hover:text-vl-primary" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
