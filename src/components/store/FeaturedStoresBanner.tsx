import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";

export default function FeaturedStoresBanner() {
  return (
    <section
      className="mt-8 overflow-hidden rounded-vl-card border border-vl-border bg-vl-primary-strong text-white sm:mt-10 sm:rounded-2xl"
      aria-label="Shop from trusted stores"
    >
      <div className="flex flex-col md:flex-row">
        <div className="flex flex-col justify-center p-6 sm:p-8 md:w-[52%]">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
            <BadgeCheck aria-hidden="true" className="h-4 w-4" />
            Trusted sellers
          </p>
          <h2 className="mt-2 font-vl-heading text-2xl font-bold tracking-[-0.02em] text-white sm:text-3xl">
            Shop From Trusted Stores
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/80 sm:text-base">
            1000+ verified stores across multiple categories.
          </p>
          <Link
            href="#store-grid"
            className="mt-5 inline-flex min-h-11 w-fit items-center justify-center rounded-vl-control bg-vl-accent px-6 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
          >
            Explore Now
          </Link>
        </div>
        <div className="relative h-44 sm:h-52 md:h-auto md:w-[48%]">
          <Image
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80"
            alt="Independent boutique storefront"
            fill
            sizes="(max-width: 768px) 100vw, 48vw"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:bg-none" />
        </div>
      </div>
    </section>
  );
}