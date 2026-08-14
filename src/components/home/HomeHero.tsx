"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function HomeHero() {
  const [activeDot, setActiveDot] = useState(0);

  return (
    <section className="mb-6 md:mb-12" data-purpose="hero-banner">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div
          className="relative overflow-hidden rounded-lg md:rounded-2xl h-60 md:h-[400px]"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAcWrSKhaVpFnohM5LCGUuccLi9DboDZFOVzHsqq00UFJaoK1LNuITaFo1NPbuAbeogsKuzfSKrHBBnDq0vSy-WnGjgvKf3fYUHZAqBeMTQ2f6iF_7Z3YugtRpKtDQjQ8FFFNJB5cUrtgwN-Lqcqr0FJWcwkXPQGrajkoFg6TXXI-uxqpOELqZWkrIPwwULozXOkB09ofiuDo9mQWJyrH83Rs1yVmAhLJeyRT4u_8JStGOiV5k6TnURfA")',
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 md:from-black/50 to-transparent z-10"></div>
          <div className="absolute inset-0 p-5 md:p-12 flex flex-col justify-center w-3/5 md:w-1/2 z-20">
            <p className="text-sm md:text-lg font-semibold text-white tracking-wide">Mega Sale</p>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mt-1 mb-2 md:mb-4">
              Up to 60% Off
            </h2>
            <p className="text-sm md:text-xl text-gray-100 mb-4 md:mb-6">Across all stores</p>
            <Link
              href="/products"
              className="bg-[#004b49] hover:bg-teal-800 transition-colors text-white px-6 md:px-8 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium w-fit inline-block"
            >
              Shop Now
            </Link>
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
