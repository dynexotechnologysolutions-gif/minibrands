"use client";

import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

export default function HomeNewsletter() {
  return (
    <section className="vl-section-shell mt-16 sm:mt-24">
      <div className="flex flex-col items-start justify-between gap-8 rounded-vl-section bg-vl-ink p-8 text-white sm:p-12 lg:flex-row lg:items-center shadow-vl-medium">
        <div className="max-w-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-vl-accent">The weekly edit</p>
          <h2 className="font-vl-heading text-2xl font-bold tracking-[-0.04em] sm:text-3xl lg:text-4xl">A little inspiration, delivered.</h2>
          <p className="mt-3 text-sm leading-6 text-white/65 sm:text-base">Fresh drops, boutique stories, and styling ideas worth opening.</p>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="flex w-full max-w-md items-center gap-3 lg:w-auto">
          <div className="relative flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-vl-control border border-white/15 bg-white/10 px-4 text-sm text-white focus-within:border-white/40 focus-within:bg-white/15">
            <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-white/60" />
            <input
              type="email"
              placeholder="Your email address"
              className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none focus:ring-0"
              required
            />
          </div>
          <button
            type="submit"
            aria-label="Join MiniBrands"
            className="group inline-flex min-h-12 shrink-0 items-center gap-2 rounded-vl-control bg-vl-primary px-5 text-sm font-semibold text-white transition duration-vl-fast hover:bg-vl-primary-strong hover:shadow-vl-medium cursor-pointer"
          >
            <span className="hidden sm:inline">Join in</span>
            <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform duration-vl-fast group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </form>
      </div>
    </section>
  );
}
