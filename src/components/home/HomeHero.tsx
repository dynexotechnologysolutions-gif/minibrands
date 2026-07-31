"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── Slide definitions ──────────────────────────────────────────────────────────
// Each slide is a complete AI-designed promotional pamphlet.
// The images contain their own typography, CTAs, trust elements, and branding.
// No HTML is drawn on top — the pamphlets are the entire hero design.

const SLIDES = [
  {
    src: "/gpt-image-2 (medium)_a_{__title____MiniBr-Photoroom.png",
    alt: "MiniBrands — Discover Fashion Beyond Big Brands. Platform Introduction Campaign.",
  },
  {
    src: "/ChatGPT Image Jul 30, 2026, 04_52_31 PM.png",
    alt: "MiniBrands — Where Independent Fashion Brands Grow. Seller Trust Campaign.",
  },
  {
    src: "/b_{__title____MiniBr.png",
    alt: "MiniBrands — This Week's Fashion Drop. Offers and Products Campaign.",
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
    if (Math.abs(delta) > 50) delta > 0 ? goNext() : goPrev();
  };

  return (
    <section
      className="w-full px-3 sm:px-6 lg:px-8 pt-4 sm:pt-5"
      aria-label="Hero promotional carousel"
    >
      {/* Container uses natural aspect ratio of the pamphlet (roughly 8:3 wide banner). */}
      {/* object-contain ensures the full image is always visible — nothing is hidden. */}
      <div
        ref={containerRef}
        className="relative mx-auto w-full overflow-hidden rounded-[20px] sm:rounded-[28px] bg-white"
        style={{
          aspectRatio: "8 / 3",
          maxWidth: "1600px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        tabIndex={0}
        aria-roledescription="carousel"
      >
        {/* Slides */}
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
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                  className="object-contain object-center"
                  style={{
                    transform: isActive ? "scale(1.00)" : "scale(1.03)",
                    transition: "transform 700ms cubic-bezier(0.16,1,0.3,1)",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Previous arrow */}
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous slide"
          className="group absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/40 bg-white/75 text-[#111827] shadow-lg backdrop-blur-md transition-all duration-200 hover:bg-white hover:shadow-xl"
        >
          <ChevronLeft
            aria-hidden="true"
            className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5"
          />
        </button>

        {/* Next arrow */}
        <button
          type="button"
          onClick={goNext}
          aria-label="Next slide"
          className="group absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/40 bg-white/75 text-[#111827] shadow-lg backdrop-blur-md transition-all duration-200 hover:bg-white hover:shadow-xl"
        >
          <ChevronRight
            aria-hidden="true"
            className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </button>

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
                  i === current ? "white" : "rgba(255,255,255,0.55)",
                boxShadow: i === current ? "0 1px 6px rgba(0,0,0,0.25)" : "none",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
