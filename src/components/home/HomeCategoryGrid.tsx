"use client";

import React from "react";
import Link from "next/link";

const categories = [
  { label: "Home Decor", iconClass: "fa-solid fa-house-chimney-window", href: "/products?category=home-decor" },
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
    <section className="px-2 md:px-0 mb-6 md:mb-10" data-purpose="categories-nav">
      <div className="flex overflow-x-auto hide-scrollbar gap-4 md:gap-8 md:justify-center px-2 pb-2">
        {categories.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="flex flex-col items-center gap-2 min-w-[60px] md:min-w-[80px] group cursor-pointer"
          >
            {/* White bg circle with border + shadow, hover fills brand teal */}
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-brand-dark text-xl md:text-2xl group-hover:bg-brand-teal group-hover:text-white transition duration-300">
              <i className={cat.iconClass}></i>
            </div>
            {/* Label - text transitions to brand-teal */}
            <span className="text-xs md:text-sm text-center leading-tight font-medium group-hover:text-brand-teal transition duration-300 whitespace-pre-line">
              {cat.label === "Home Decor" ? (
                <>Home<br className="md:hidden" /> Decor</>
              ) : (
                cat.label
              )}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
