"use client";

import React from "react";
import Link from "next/link";

const categories = [
  { label: "Home\nDecor", iconClass: "fa-solid fa-house-chimney-window", href: "/products?category=home-decor" },
  { label: "Kitchen", iconClass: "fa-solid fa-utensils", href: "/products?category=kitchen" },
  { label: "Spiritual", iconClass: "fa-solid fa-om", href: "/products?category=spiritual" },
  { label: "Bottles", iconClass: "fa-solid fa-bottle-water", href: "/products?category=bottles" },
  { label: "Beauty", iconClass: "fa-solid fa-pump-soap", href: "/products?category=beauty" },
  { label: "Wellness", iconClass: "fa-solid fa-spa", href: "/products?category=wellness" },
  { label: "Toys", iconClass: "fa-solid fa-horse", href: "/products?category=toys" },
  { label: "Electronics", iconClass: "fa-solid fa-mobile-screen", href: "/products?category=electronics" },
];

export default function HomeCategoryGrid() {
  return (
    <section className="px-2 py-4 md:py-8 mb-2 md:mb-6" data-purpose="categories-nav">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex overflow-x-auto hide-scrollbar gap-4 md:gap-8 px-2 md:px-6 pb-2 md:justify-center md:flex-wrap">
          {categories.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="flex flex-col items-center gap-2 min-w-[60px] md:min-w-[80px] group cursor-pointer"
            >
              {/* Circle icon — white bg + shadow + border, hover fills teal */}
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#0d3b36] text-xl md:text-2xl group-hover:bg-[#0F7F7F] group-hover:text-white group-hover:border-[#0F7F7F] transition-all duration-200">
                <i className={cat.iconClass}></i>
              </div>
              {/* Label */}
              <span className="text-[11px] md:text-sm text-center leading-tight font-medium text-gray-700 group-hover:text-[#0F7F7F] transition-colors whitespace-pre-line">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
