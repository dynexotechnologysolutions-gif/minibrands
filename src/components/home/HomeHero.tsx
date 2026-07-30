"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  CreditCard,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
  Zap,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TrustBadge {
  Icon: LucideIcon;
  label: string;
}

interface FeatureCard {
  Icon: LucideIcon;
  label: string;
}

interface OfferPill {
  label: string;
  color: string;
  textColor?: string;
}

interface CategoryChip {
  label: string;
  href: string;
}

interface FloatingCard {
  id: string;
  positionClass: string;
  animClass: string;
  widthPx: number;
  badge?: { label: string; color: string };
  title: string;
  brand: string;
  price: string;
  IconComponent: LucideIcon;
  iconColor: string;
}

interface HeroSlide {
  id: string;
  badge: { label: string; color: string };
  headline: string;
  subheadline: string;
  stats: { number: string; label: string }[];
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  image: { src: string; alt: string };
  trustBadges?: TrustBadge[];
  featureCards?: FeatureCard[];
  offerPills?: OfferPill[];
  categoryChips?: CategoryChip[];
  floatingCards?: FloatingCard[];
}

// ── Slide data ─────────────────────────────────────────────────────────────────

const SLIDES: HeroSlide[] = [
  {
    id: "discover",
    badge: { label: "✦ Verified Independent Marketplace", color: "#6C3BFF" },
    headline: "Discover Fashion Beyond Brands",
    subheadline:
      "Shop unique collections from India's most creative independent fashion labels.",
    trustBadges: [
      { Icon: BadgeCheck, label: "Verified Sellers" },
      { Icon: CreditCard, label: "Secure Checkout" },
      { Icon: Truck, label: "Fast Delivery" },
      { Icon: Star, label: "4.9★ Rating" },
    ],
    stats: [
      { number: "50+", label: "Brands" },
      { number: "1000+", label: "Products" },
      { number: "4.9★", label: "Rating" },
    ],
    ctaPrimary: { label: "Explore Collection", href: "/products" },
    ctaSecondary: { label: "Become a Seller", href: "/sellers" },
    image: {
      src: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=900&q=90",
      alt: "Premium independent fashion editorial – MiniBrands",
    },
    floatingCards: [
      {
        id: "fc-a",
        positionClass: "right-4 top-14",
        animClass: "animate-float-1",
        widthPx: 172,
        badge: { label: "New Arrival", color: "#FF4D8D" },
        title: "Silk Co-ord Set",
        brand: "Studio Vel",
        price: "₹2,499",
        IconComponent: ShoppingBag,
        iconColor: "#6C3BFF",
      },
      {
        id: "fc-b",
        positionClass: "left-4 bottom-20",
        animClass: "animate-float-2",
        widthPx: 156,
        badge: { label: "Trending", color: "#FF9A3C" },
        title: "Boho Earrings",
        brand: "Craft House",
        price: "₹649",
        IconComponent: Tag,
        iconColor: "#FF4D8D",
      },
    ],
  },
  {
    id: "sellers",
    badge: { label: "🏪 For Independent Brands", color: "#FF9A3C" },
    headline: "Where Independent Fashion Brands Grow",
    subheadline:
      "Launch your fashion label, build your audience and reach customers across India.",
    featureCards: [
      { Icon: BadgeCheck, label: "Verified Seller" },
      { Icon: Store, label: "Brand Store" },
      { Icon: BarChart3, label: "Analytics" },
      { Icon: CreditCard, label: "Secure Payments" },
      { Icon: Zap, label: "Fast Onboarding" },
      { Icon: Sparkles, label: "Marketing Support" },
    ],
    stats: [
      { number: "1,200+", label: "Buyers" },
      { number: "50+", label: "Sellers" },
      { number: "#1", label: "Marketplace" },
    ],
    ctaPrimary: { label: "Start Selling", href: "/sellers" },
    ctaSecondary: { label: "Learn More", href: "/sellers" },
    image: {
      src: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=900&q=90",
      alt: "Independent fashion brand owner at their studio – MiniBrands Sellers",
    },
  },
  {
    id: "drops",
    badge: { label: "🔥 This Week's Drop", color: "#FF4D8D" },
    headline: "This Week's Fashion Drop",
    subheadline:
      "Exclusive collections, limited editions and the hottest deals from independent brands.",
    offerPills: [
      { label: "Up to 60% OFF", color: "#FF4D8D" },
      { label: "Limited Edition", color: "#6C3BFF" },
      { label: "Trending Now", color: "#FF9A3C" },
      { label: "Flash Deals", color: "#FFD84D", textColor: "#111827" },
    ],
    categoryChips: [
      { label: "Dresses", href: "/products?category=dresses" },
      { label: "Sneakers", href: "/products?category=footwear" },
      { label: "Streetwear", href: "/products?category=western" },
      { label: "Accessories", href: "/products?category=accessories" },
      { label: "Bags", href: "/products?category=accessories" },
    ],
    stats: [
      { number: "60%", label: "Max Discount" },
      { number: "200+", label: "New Drops" },
      { number: "50+", label: "Brands" },
    ],
    ctaPrimary: { label: "Shop Deals", href: "/products" },
    ctaSecondary: { label: "View Collection", href: "/products" },
    image: {
      src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=90",
      alt: "Fashion campaign – exclusive collections at MiniBrands",
    },
  },
];

// ── BackgroundEffects ──────────────────────────────────────────────────────────

function BackgroundEffects() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="animate-blob-slow absolute -left-24 -top-32 h-[560px] w-[560px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(108,59,255,0.22) 0%, transparent 70%)",
          filter: "blur(80px)",
          willChange: "transform",
        }}
      />
      <div
        className="animate-blob-medium absolute -right-28 top-12 h-[480px] w-[480px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,77,141,0.20) 0%, transparent 70%)",
          filter: "blur(70px)",
          willChange: "transform",
        }}
      />
      <div
        className="animate-blob-fast absolute bottom-[-60px] left-[30%] h-[380px] w-[380px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,154,60,0.18) 0%, transparent 70%)",
          filter: "blur(60px)",
          willChange: "transform",
        }}
      />
    </div>
  );
}

// ── HeroFloatingCard ───────────────────────────────────────────────────────────

function HeroFloatingCard({ card }: { card: FloatingCard }) {
  const {
    IconComponent,
    iconColor,
    positionClass,
    animClass,
    widthPx,
    badge,
    title,
    brand,
    price,
  } = card;
  return (
    <div
      className={`absolute z-20 hidden xl:flex flex-col gap-2 rounded-2xl border border-white/60 bg-white/85 p-3.5 backdrop-blur-md ${positionClass} ${animClass}`}
      style={{
        boxShadow: "0 12px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(108,59,255,0.08)",
        willChange: "transform",
        width: `${widthPx}px`,
      }}
    >
      {badge && (
        <span
          className="self-start rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
          style={{ background: badge.color }}
        >
          {badge.label}
        </span>
      )}
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "linear-gradient(135deg, #F0EDFF 0%, #FFE8F4 100%)",
          }}
        >
          <IconComponent
            aria-hidden="true"
            className="h-4 w-4"
            style={{ color: iconColor }}
            strokeWidth={2}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold leading-tight text-[#111827]">
            {title}
          </p>
          <p className="text-[11px] leading-tight text-[#6B7280]">{brand}</p>
        </div>
      </div>
      <p
        className="text-[14px] font-extrabold"
        style={{ color: "#6C3BFF" }}
      >
        {price}
      </p>
    </div>
  );
}

// ── CarouselArrow ──────────────────────────────────────────────────────────────

function CarouselArrow({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrev ? "Previous slide" : "Next slide"}
      className="group absolute top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/80 text-[#111827] shadow-md backdrop-blur-md transition-all duration-200 hover:-translate-y-[calc(50%+2px)] hover:bg-white hover:shadow-lg lg:flex"
      style={{ [isPrev ? "left" : "right"]: "16px" }}
    >
      {isPrev ? (
        <ArrowLeft
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
        />
      ) : (
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
        />
      )}
    </button>
  );
}

// ── CarouselDots ───────────────────────────────────────────────────────────────

function CarouselDots({
  count,
  current,
  onSelect,
}: {
  count: number;
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      className="flex items-center gap-2"
      role="tablist"
      aria-label="Slide navigation"
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-label={`Go to slide ${i + 1}`}
          aria-selected={i === current}
          onClick={() => onSelect(i)}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? "24px" : "8px",
            height: "8px",
            background:
              i === current ? "#6C3BFF" : "rgba(17,24,39,0.20)",
          }}
        />
      ))}
    </div>
  );
}

// ── HomeHero (main export) ─────────────────────────────────────────────────────

export default function HomeHero() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);

  const goNext = useCallback(
    () => setCurrent((p) => (p + 1) % SLIDES.length),
    []
  );
  const goPrev = useCallback(
    () => setCurrent((p) => (p - 1 + SLIDES.length) % SLIDES.length),
    []
  );
  const goTo = useCallback((i: number) => setCurrent(i), []);

  // Auto-play
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

  // Keyboard navigation
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

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) delta > 0 ? goNext() : goPrev();
  };

  return (
    <section
      className="vl-section-shell pt-4 sm:pt-6 lg:pt-8"
      aria-label="Hero showcase"
    >
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-[32px]"
        style={{
          background:
            "linear-gradient(135deg, #F0EDFF 0%, #FFF0F6 50%, #FFF5EE 100%)",
          boxShadow: "0 32px 80px rgba(108,59,255,0.14)",
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        tabIndex={0}
        aria-roledescription="carousel"
      >
        <BackgroundEffects />

        {/* Slides */}
        <div
          className="relative min-h-[560px] sm:min-h-[600px] lg:min-h-[700px]"
          aria-live="polite"
          aria-atomic="true"
        >
          {SLIDES.map((slide, i) => {
            const isActive = i === current;
            return (
              <div
                key={slide.id}
                aria-hidden={!isActive}
                className="absolute inset-0 grid lg:grid-cols-[45fr_55fr]"
                style={{
                  opacity: isActive ? 1 : 0,
                  transition: "opacity 600ms cubic-bezier(0.16,1,0.3,1)",
                  pointerEvents: isActive ? "auto" : "none",
                }}
              >
                {/* ── LEFT: Content ─────────────────────────────────── */}
                <div className="relative z-10 flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-12 xl:px-16">
                  {/* Badge */}
                  <div
                    className="mb-5 inline-flex w-fit items-center rounded-full border border-white/70 bg-white/80 px-3.5 py-1.5 backdrop-blur-sm"
                    style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
                  >
                    <span
                      className="text-[11px] font-bold tracking-[0.10em]"
                      style={{ color: slide.badge.color }}
                    >
                      {slide.badge.label}
                    </span>
                  </div>

                  {/* Headline */}
                  <h1
                    className="max-w-[460px] text-[34px] font-extrabold leading-[1.06] tracking-[-0.025em] text-[#111827] sm:text-[44px] lg:text-[56px]"
                    style={{
                      fontFamily:
                        "'Plus Jakarta Sans', 'Manrope', sans-serif",
                    }}
                  >
                    {slide.headline}
                  </h1>

                  {/* Subheadline */}
                  <p className="mt-4 max-w-[420px] text-[15px] leading-[1.65] text-[#6B7280] sm:text-[17px] lg:text-[19px]">
                    {slide.subheadline}
                  </p>

                  {/* Slide 1 — Trust badges */}
                  {slide.trustBadges && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {slide.trustBadges.map(({ Icon, label }) => (
                        <div
                          key={label}
                          className="flex items-center gap-1.5 rounded-full border border-[#ECECEC] bg-white/85 px-3 py-1.5 backdrop-blur-sm"
                        >
                          <Icon
                            aria-hidden="true"
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: "#6C3BFF" }}
                            strokeWidth={2.2}
                          />
                          <span className="text-[12px] font-semibold text-[#374151]">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stats row */}
                  {slide.stats && (
                    <div className="mt-6 flex items-center gap-5 sm:gap-7">
                      {slide.stats.map(({ number, label }, idx) => (
                        <React.Fragment key={label}>
                          {idx > 0 && (
                            <div className="h-7 w-px shrink-0 bg-[#ECECEC]" />
                          )}
                          <div>
                            <p
                              className="text-[26px] font-extrabold leading-none sm:text-[30px]"
                              style={{
                                fontFamily:
                                  "'Plus Jakarta Sans', 'Manrope', sans-serif",
                                color: "#6C3BFF",
                              }}
                            >
                              {number}
                            </p>
                            <p className="mt-0.5 text-[12px] text-[#6B7280]">
                              {label}
                            </p>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {/* Slide 2 — Feature grid */}
                  {slide.featureCards && (
                    <div className="mt-6 grid max-w-[360px] grid-cols-3 gap-2">
                      {slide.featureCards.map(({ Icon, label }) => (
                        <div
                          key={label}
                          className="flex flex-col items-center gap-1.5 rounded-xl border border-[#ECECEC] bg-white/85 p-2.5 text-center backdrop-blur-sm"
                        >
                          <Icon
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0"
                            style={{ color: "#6C3BFF" }}
                            strokeWidth={2}
                          />
                          <span className="text-[11px] font-semibold leading-tight text-[#374151]">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Slide 3 — Offer pills */}
                  {slide.offerPills && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {slide.offerPills.map(({ label, color, textColor }) => (
                        <span
                          key={label}
                          className="rounded-full px-4 py-1.5 text-[13px] font-bold"
                          style={{
                            background: color,
                            color: textColor ?? "#ffffff",
                          }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Slide 3 — Category chips */}
                  {slide.categoryChips && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {slide.categoryChips.map(({ label, href }) => (
                        <Link
                          key={label}
                          href={href}
                          className="rounded-full border border-[#ECECEC] bg-white/85 px-4 py-1.5 text-[13px] font-semibold text-[#374151] backdrop-blur-sm transition-all duration-200 hover:border-[#6C3BFF]/40 hover:bg-white hover:text-[#6C3BFF]"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* CTA Buttons */}
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      href={slide.ctaPrimary.href}
                      className="group inline-flex min-h-[52px] items-center gap-2 rounded-2xl px-6 text-[15px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                      style={{
                        background:
                          "linear-gradient(135deg, #6C3BFF 0%, #FF4D8D 100%)",
                        boxShadow: "0 8px 24px rgba(108,59,255,0.35)",
                      }}
                    >
                      {slide.ctaPrimary.label}
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </Link>
                    <Link
                      href={slide.ctaSecondary.href}
                      className="inline-flex min-h-[52px] items-center rounded-2xl border-[1.5px] border-[#111827]/20 px-6 text-[15px] font-semibold text-[#111827] transition-all duration-200 hover:border-[#111827]/35 hover:bg-[#111827]/5 active:scale-[0.98]"
                    >
                      {slide.ctaSecondary.label}
                    </Link>
                  </div>
                </div>

                {/* ── RIGHT: Image ──────────────────────────────────── */}
                <div className="absolute inset-0 lg:relative lg:inset-auto">
                  <Image
                    src={slide.image.src}
                    alt={slide.image.alt}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 1023px) 100vw, 55vw"
                    className="object-cover object-center"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "scale(1)" : "scale(0.97)",
                      transition:
                        "opacity 600ms cubic-bezier(0.16,1,0.3,1), transform 600ms cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                  {/* Mobile: fade image into content below */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#F0EDFF] via-[#F0EDFF]/55 to-transparent lg:hidden" />
                  {/* Desktop: gentle left-edge blend */}
                  <div className="absolute inset-0 hidden bg-gradient-to-r from-[#F0EDFF]/25 via-transparent to-transparent lg:block" />

                  {/* Floating product cards (Slide 1 only) */}
                  {slide.floatingCards?.map((card) => (
                    <HeroFloatingCard key={card.id} card={card} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel prev / next arrows */}
        <CarouselArrow direction="prev" onClick={goPrev} />
        <CarouselArrow direction="next" onClick={goNext} />

        {/* Navigation dots */}
        <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2">
          <CarouselDots count={SLIDES.length} current={current} onSelect={goTo} />
        </div>
      </div>
    </section>
  );
}
