"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function HomeHero() {
  const [activeDot, setActiveDot] = useState(0);

  return (
    <section className="px-4 md:px-6 mb-8 md:mb-12" data-purpose="hero-banner">
      <div className="max-w-[1280px] mx-auto">
        <div
          className="relative rounded-2xl overflow-hidden h-56 md:h-96 flex items-center"
          style={{
            background: "linear-gradient(to right, rgba(13,59,54,0.85), rgba(96,165,250,0.6))",
          }}
        >
          {/* Background image */}
          <img
            alt="Mega Sale Banner"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuACQdixwWAIGKztY8FZrDgVQ0PrKq-RjVpAgMgJ030WgqgBvwxAbRnCL8r9ctCBPCLHgEx__LTe2Qdpv3exiAffT7uhOxZImBf-duF8fJXIKqZFxH3Xja0CCqwlKNSghSyyiPc_QFDNEnvGLX9E5TfdYBD3bRYGs3SYb_k0PK6ORE9H_nBoGQv_O37RQ2FFaA2o696xUL7lwT5UEdSQQb2Dvu6Op0NUul8MSuX1aSps2FCp8Yr0VKXZ0Q"
          />

          {/* Content */}
          <div className="relative z-10 p-6 md:p-12 text-white w-2/3 md:w-1/2">
            <p className="font-semibold mb-1 md:mb-3 md:text-lg text-[#F39C12] uppercase tracking-wider text-sm">
              Mega Sale
            </p>
            <h2 className="text-3xl md:text-6xl font-bold leading-tight mb-2 md:mb-4">
              Up to 60%<br />Off
            </h2>
            <p className="text-sm md:text-xl text-gray-100 mb-4 md:mb-8">
              Across all stores
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="bg-[#0F7F7F] hover:bg-[#0d6b6b] text-white px-5 md:px-8 py-2 md:py-3.5 rounded-lg text-sm md:text-base font-semibold transition shadow-md inline-block"
              >
                Shop Now
              </Link>
              <Link
                href="/stores"
                className="hidden md:inline-block border border-white/60 text-white hover:bg-white/10 transition px-6 py-3.5 rounded-lg text-base font-semibold"
              >
                Explore Stores
              </Link>
            </div>
          </div>

          {/* Carousel dots */}
          <div className="absolute bottom-3 md:bottom-6 left-0 right-0 flex justify-center gap-1.5 md:gap-2">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                onClick={() => setActiveDot(idx)}
                aria-label={`Slide ${idx + 1}`}
                suppressHydrationWarning
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
                  activeDot === idx ? "bg-[#0F7F7F]" : "bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
