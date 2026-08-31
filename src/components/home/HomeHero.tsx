"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── Slide definitions ──────────────────────────────────────────────────────────
// Each slide is a complete AI-designed promotional pamphlet.
// The images contain their own typography, CTAs, trust elements, and branding.
// No HTML is drawn on top — the pamphlets are the entire hero design.

const SLIDES = [
  {
    src: "/gpt-image-2 (medium)_a_{__title____MiniBr-Photoroom.png",
    alt: "MiniBrands — Discover Fashion Beyond Big Brands. Platform Introduction Campaign.",
    label: "Mega Sale",
    title: "Up to 60% Off",
    subtitle: "Across all stores",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80",
  },
  {
    src: "/ChatGPT Image Jul 30, 2026, 04_52_31 PM.png",
    alt: "MiniBrands — Where Independent Fashion Brands Grow. Seller Trust Campaign.",
    label: "Boutique Picks",
    title: "Curated Labels",
    subtitle: "Direct from verified designers",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
  },
  {
    src: "/b_{__title____MiniBr.png",
    alt: "MiniBrands — This Week's Fashion Drop. Offers and Products Campaign.",
    label: "New Arrivals",
    title: "Fresh Drops",
    subtitle: "Unique items updated weekly",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80",
  },
] as const;

// ── HomeHero ───────────────────────────────────────────────────────────────────

export default function HomeHero() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);

  const goNext = useCallback(() => setCurrent((p) => (p + 1) % SLIDES.length), []);
  const goPrev = useCallback(() => setCurrent((p) => (p - 1 + SLIDES.length) % SLIDES.length), []);
  const goTo = useCallback((i: number) => setCurrent(i), []);

  // Auto-play (5 s interval, paused on hover)
  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(goNext, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, goNext]);

  // Keyboard navigation (← / →)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  // Touch / swipe support
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  return (
    <section
      className="w-full px-3 sm:px-6 lg:px-8 pt-1.5 md:pt-4"
      aria-label="Hero promotional carousel"
    >
      {/* Container uses natural aspect ratio of the pamphlet (16:9 on mobile, 8:3 on desktop). */}
      {/* object-contain ensures the full image is always visible — nothing is hidden. */}
      <div
        ref={containerRef}
        className="relative mx-auto w-full overflow-hidden rounded-[20px] sm:rounded-[28px] bg-white aspect-[16/7] lg:aspect-[16/6] lg:max-w-[1100px] xl:max-w-[1200px]"
        style={{
          maxWidth: "1200px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        tabIndex={0}
        aria-roledescription="carousel"
      >
        <div aria-live="polite" aria-atomic="true">
          {SLIDES.map((slide, i) => {
            const isActive = i === current;
            return (
              <div
                key={slide.src}
                aria-hidden={!isActive}
                className="absolute inset-0"
                style={{
                  opacity: isActive ? 1 : 0,
                  transition: "opacity 700ms cubic-bezier(0.16,1,0.3,1)",
                  pointerEvents: isActive ? "auto" : "none",
                }}
              >
                {/* Unified split-card hero — same design on all breakpoints, text/spacing scales up */}
                <div className="flex h-full w-full bg-[#FAF9F6] font-sans">
                  {/* Left content block */}
                  <div className="w-[58%] flex flex-col justify-center pl-5 pr-2 sm:pl-10 sm:pr-4 md:pl-14 md:pr-6 select-none">
                    <span className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-[#0F7F7F] mb-0.5 sm:mb-1">
                      {slide.label}
                    </span>
                    <h2 className="font-display text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#222222] leading-tight tracking-tight">
                      {slide.title}
                    </h2>
                    <p className="text-[11px] sm:text-sm md:text-base text-[#666666] mt-0.5 sm:mt-1 font-semibold leading-normal font-sans">
                      {slide.subtitle}
                    </p>
                    <Link
                      href="/products"
                      className="mt-2.5 sm:mt-4 md:mt-5 inline-flex h-7 sm:h-9 md:h-11 w-fit items-center justify-center rounded-lg bg-[#0d3b36] hover:bg-[#002020] px-3.5 sm:px-5 md:px-7 text-[10px] sm:text-xs md:text-sm font-bold text-white shadow-sm active:scale-95 transition-all font-sans"
                    >
                      Shop Now
                    </Link>
                  </div>
                  {/* Right image block */}
                  <div className="w-[42%] relative h-full bg-slate-100 overflow-hidden">
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      fill
                      priority={i === 0}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 45vw, 500px"
                      className="object-cover object-center"
                      style={{
                        transform: isActive ? "scale(1.00)" : "scale(1.05)",
                        transition: "transform 700ms cubic-bezier(0.16,1,0.3,1)",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation dots */}
        <div
          className="absolute bottom-4 sm:bottom-5 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2"
          role="tablist"
          aria-label="Slide navigation"
        >
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-label={`Go to slide ${i + 1}`}
              aria-selected={i === current}
              onClick={() => goTo(i)}
              suppressHydrationWarning
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? "24px" : "8px",
                height: "8px",
                background:
                  i === current ? "var(--vl-primary, #0F7F7F)" : "rgba(0,0,0,0.12)",
                boxShadow: "none",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
