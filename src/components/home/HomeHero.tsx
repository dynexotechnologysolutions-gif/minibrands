"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function HomeHero() {
  const [activeDot, setActiveDot] = useState(0);

  return (
    <section className="mb-6 md:mb-12 lg:mb-20 xl:mb-24" data-purpose="hero-banner">
      <div className="max-w-[1280px] lg:max-w-[1200px] xl:max-w-[1280px] 2xl:max-w-[1440px] mx-auto px-4 md:px-8">
        <div
          className="relative overflow-hidden rounded-lg md:rounded-2xl h-60 md:h-[400px] lg:h-[440px] xl:h-[480px]"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAcWrSKhaVpFnohM5LCGUuccLi9DboDZFOVzHsqq00UFJaoK1LNuITaFo1NPbuAbeogsKuzfSKrHBBnDq0vSy-WnGjgvKf3fYUHZAqBeMTQ2f6iF_7Z3YugtRpKtDQjQ8FFFNJB5cUrtgwN-Lqcqr0FJWcwkXPQGrajkoFg6TXXI-uxqpOELqZWkrIPwwULozXOkB09ofiuDo9mQWJyrH83Rs1yVmAhLJeyRT4u_8JStGOiV5k6TnURfA")',
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 md:from-black/50 lg:from-black/65 lg:via-black/30 to-transparent z-10"></div>
          <div className="absolute inset-0 p-5 md:p-12 lg:p-16 xl:p-20 flex flex-col justify-center w-3/5 md:w-1/2 lg:w-[45%] z-20">
            <p className="text-sm md:text-lg font-semibold text-white tracking-wide uppercase">Mega Sale</p>
            <h2 className="text-3xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mt-1 mb-2 md:mb-4 lg:mb-5">
              Up to 60% Off
            </h2>
            <p className="text-sm md:text-xl text-gray-100 mb-4 md:mb-6 lg:mb-8">Across all stores</p>
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="bg-[#004b49] hover:bg-teal-800 transition-colors text-white px-6 md:px-8 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium w-fit inline-block"
              >
                Shop Now
              </Link>
              {/* Desktop-only second CTA */}
              <Link
                href="/stores"
                className="hidden lg:inline-block border border-white/70 text-white hover:bg-white/10 transition-colors px-6 py-3 rounded-lg text-sm font-medium"
              >
                Explore Stores
              </Link>
            </div>
          </div>
          <div className="absolute bottom-2 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-30">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                onClick={() => setActiveDot(idx)}
                className={`w-2 md:w-3 h-2 md:h-3 rounded-full cursor-pointer transition-opacity ${
                  activeDot === idx ? "bg-[#004b49]" : "bg-white opacity-50 hover:opacity-100"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
