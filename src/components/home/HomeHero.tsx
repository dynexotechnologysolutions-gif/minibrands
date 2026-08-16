"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function HomeHero() {
  const [activeDot, setActiveDot] = useState(0);

  return (
    <section className="px-4 md:px-0 mb-8 md:mb-12" data-purpose="hero-banner">
      <div className="relative rounded-2xl overflow-hidden bg-[#FAFAF9] h-56 md:h-96 flex items-center border border-gray-200 shadow-sm">
        {/* Banner Content Layout */}
        <div className="relative z-10 p-6 md:p-12 text-[#222222] w-[60%] md:w-1/2 flex flex-col items-start">
          <p className="font-bold text-xs md:text-sm mb-1 md:mb-3 uppercase tracking-wider text-[#44403C] font-sans">
            Mega Sale
          </p>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-2 md:mb-4 text-[#0d3b36] font-display">
            Up to 60% Off
          </h2>
          <p className="text-xs md:text-lg mb-4 md:mb-8 text-gray-600 font-sans">
            Across all stores
          </p>
          <Link
            href="/products"
            className="bg-[#0d3b36] hover:bg-[#0F7F7F] text-white px-5 md:px-8 py-2 md:py-3.5 rounded-lg text-xs md:text-sm font-semibold transition shadow-sm inline-block font-sans"
          >
            Shop Now
          </Link>
        </div>

        {/* Right aligned image container */}
        <div className="absolute md:relative right-0 top-0 bottom-0 w-[40%] md:w-1/2 h-full flex justify-end">
          <img
            alt="Mega Sale"
            className="w-full h-full object-cover md:object-contain object-right"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuACQdixwWAIGKztY8FZrDgVQ0PrKq-RjVpAgMgJ030WgqgBvwxAbRnCL8r9ctCBPCLHgEx__LTe2Qdpv3exiAffT7uhOxZImBf-duF8fJXIKqZFxH3Xja0CCqwlKNSghSyyiPc_QFDNEnvGLX9E5TfdYBD3bRYGs3SYb_k0PK6ORE9H_nBoGQv_O37RQ2FFaA2o696xUL7lwT5UEdSQQb2Dvu6Op0NUul8MSuX1aSps2FCp8Yr0VKXZ0Q"
          />
        </div>

        {/* Pagination Dots */}
        <div className="absolute bottom-3 md:bottom-6 left-6 md:left-12 flex gap-1.5 md:gap-2">
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              onClick={() => setActiveDot(idx)}
              aria-label={`Slide ${idx + 1}`}
              suppressHydrationWarning
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
                activeDot === idx ? "bg-[#0d3b36] scale-125" : "bg-[#0d3b36]/20 hover:bg-[#0d3b36]/40 cursor-pointer"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
