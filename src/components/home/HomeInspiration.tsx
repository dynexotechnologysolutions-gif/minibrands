import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Quote } from "lucide-react";

export default function HomeInspiration() {
  return (
    <section className="vl-section-shell mt-10 sm:mt-24">
      <div className="grid items-center gap-6 overflow-hidden rounded-vl-section bg-vl-secondary p-5 sm:p-12 lg:grid-cols-2 lg:p-16 text-white shadow-vl-medium">
        <div className="flex flex-col justify-center py-2 max-w-full sm:max-w-[520px]">
          <Quote aria-hidden="true" className="h-10 w-10 sm:h-14 sm:w-14 text-vl-accent" fill="currentColor" />
          <p className="mt-4 sm:mt-8 font-vl-heading text-xl sm:text-4xl lg:text-[48px] font-semibold leading-[1.25] sm:leading-[1.15] tracking-[-0.03em]">
            Style is not a category. It is the way you make a room, a street, or a Tuesday feel like yours.
          </p>
          <Link
            href="/products"
            className="group mt-6 sm:mt-10 inline-flex w-fit items-center gap-2 rounded-vl-control bg-white px-5 py-3 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-bold text-vl-secondary transition-all duration-vl-fast hover:-translate-y-0.5 hover:bg-vl-accent hover:text-vl-ink hover:shadow-vl-medium"
          >
            Shop the mood
            <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform duration-vl-fast group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
        <div className="relative w-full h-[240px] sm:h-[420px] lg:h-[500px] overflow-hidden rounded-xl sm:rounded-[24px] bg-vl-ink shadow-vl-large">
          <Image
            src="https://images.unsplash.com/photo-1610702422639-102e738549fd?auto=format&fit=crop&w=1200&q=85"
            alt="Woman wearing statement jewelry by Alvaro O'Donnell on Unsplash"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 rounded-full bg-vl-ink/80 px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-white/95 backdrop-blur-md">
            The independent edit · 2026
          </div>
        </div>
      </div>
    </section>
  );
}
