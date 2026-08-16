"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function HomeHero() {
  const [activeDot, setActiveDot] = useState(0);

  return (
    <section className="px-4 md:px-0 mb-8 md:mb-12" data-purpose="hero-banner">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-teal-700/80 to-blue-300 h-56 md:h-96 flex items-center">
        {/* Banner Background Image */}
        <img
          alt="Mega Sale"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuACQdixwWAIGKztY8FZrDgVQ0PrKq-RjVpAgMgJ030WgqgBvwxAbRnCL8r9ctCBPCLHgEx__LTe2Qdpv3exiAffT7uhOxZImBf-duF8fJXIKqZFxH3Xja0CCqwlKNSghSyyiPc_QFDNEnvGLX9E5TfdYBD3bRYGs3SYb_k0PK6ORE9H_nBoGQv_O37RQ2FFaA2o696xUL7lwT5UEdSQQb2Dvu6Op0NUul8MSuX1aSps2FCp8Yr0VKXZ0Q"
        />
        {/* Overlay Content */}
        <div className="relative z-10 p-6 md:p-12 text-white w-2/3 md:w-1/2">
          <p className="font-semibold mb-1 md:mb-3 md:text-lg shadow-sm text-brand-orange uppercase tracking-wider">
            Mega Sale
          </p>
          <h2 className="text-3xl md:text-6xl font-bold leading-tight mb-2 md:mb-4 shadow-sm">
            Up to 60%<br />Off
          </h2>
          <p className="text-sm md:text-xl mb-4 md:mb-8 shadow-sm">
            Across all premium collections
          </p>
          <Link
            href="/products"
            className="bg-brand-teal text-white px-5 md:px-8 py-2 md:py-3.5 rounded-lg text-sm md:text-base font-semibold hover:bg-opacity-90 transition shadow-md inline-block"
          >
            Shop Now
          </Link>
        </div>
        {/* Pagination Dots */}
        <div className="absolute bottom-3 md:bottom-6 left-0 right-0 flex justify-center gap-1.5 md:gap-2">
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              onClick={() => setActiveDot(idx)}
              aria-label={`Slide ${idx + 1}`}
              suppressHydrationWarning
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
                activeDot === idx ? "bg-brand-teal" : "bg-white/60 hover:bg-white/80 cursor-pointer"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
