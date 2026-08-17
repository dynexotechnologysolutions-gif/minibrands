"use client";

import Image from "next/image";
import { Mail, ArrowRight } from "lucide-react";

export default function HomeNewsletter() {
  return (
    <section className="vl-section-shell mt-10 sm:mt-16">
      <div className="overflow-hidden rounded-vl-section border border-vl-border bg-vl-card shadow-vl-soft">
        <div className="grid lg:grid-cols-2">
          <div className="flex flex-col justify-center p-5 sm:p-10 lg:p-12">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">The weekly edit</p>
            <h2 className="font-vl-heading text-2xl sm:text-4xl font-extrabold tracking-[-0.04em] text-vl-ink">
              Join Our Newsletter
            </h2>
            <p className="mt-3 text-sm leading-6 text-vl-muted sm:text-base">
              Get updates on new arrivals, offers &amp; more.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="mt-6 flex w-full flex-col items-stretch gap-2.5 sm:max-w-md sm:flex-row sm:items-center sm:gap-3">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <div className="relative flex min-h-12 min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-vl-control border border-vl-border bg-white px-4 text-sm text-vl-ink focus-within:border-vl-primary">
                <Mail aria-hidden="true" className="h-5 w-5 shrink-0 text-vl-muted" />
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="Your email address"
                  className="w-full min-w-0 flex-1 bg-transparent text-sm text-vl-ink placeholder:text-vl-muted outline-none focus:ring-0"
                  required
                  suppressHydrationWarning
                />
              </div>
              <button
                suppressHydrationWarning
                type="submit"
                className="group inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-vl-control bg-vl-primary px-6 text-sm font-semibold text-white transition duration-vl-fast hover:bg-vl-primary-strong hover:shadow-vl-medium cursor-pointer sm:w-auto"
              >
                Subscribe
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-vl-fast group-hover:translate-x-0.5" />
              </button>
            </form>
          </div>
          <div className="relative min-h-[200px] lg:min-h-full">
            <Image
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85"
              alt="Lifestyle fashion imagery"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}