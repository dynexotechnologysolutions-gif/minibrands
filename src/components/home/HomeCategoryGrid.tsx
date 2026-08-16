"use client";

import React from "react";
import Link from "next/link";

const categories = [
  { label: "Home Decor", iconClass: "fa-regular fa-couch", href: "/products?category=home-decor" },
  { label: "Kitchen", iconClass: "fa-solid fa-kitchen-set", href: "/products?category=kitchen" },
  { label: "Spiritual", iconClass: "fa-solid fa-om", href: "/products?category=spiritual" },
  { label: "Bottles", iconClass: "fa-solid fa-bottle-water", href: "/products?category=bottles" },
  { label: "Beauty", iconClass: "fa-solid fa-pump-soap", href: "/products?category=beauty" },
  { label: "Wellness", iconClass: "fa-solid fa-spa", href: "/products?category=wellness" },
  { label: "Toys", iconClass: "fa-solid fa-robot", href: "/products?category=toys" },
];

export default function HomeCategoryGrid() {
  return (
    <section className="py-4 md:py-8 lg:py-10 border-b md:border-b-0 border-gray-200 lg:border-b" data-purpose="categories-nav">
      <div className="max-w-[1280px] lg:max-w-[1200px] xl:max-w-[1280px] 2xl:max-w-[1440px] mx-auto flex overflow-x-auto hide-scrollbar gap-4 md:gap-8 lg:gap-10 px-4 md:px-8 md:justify-center md:flex-wrap">
        {categories.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="flex flex-col items-center min-w-[60px] md:min-w-[80px] lg:min-w-[90px] gap-1 md:gap-2 lg:gap-3 cursor-pointer hover:scale-105 transition-transform duration-200"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 lg:w-16 lg:h-16 flex items-center justify-center bg-teal-50 rounded-full">
              <i className={`${cat.iconClass} text-xl md:text-3xl lg:text-3xl text-[#004F50]`}></i>
            </div>
            <span className="text-[11px] md:text-sm lg:text-sm font-semibold text-center text-gray-700">{cat.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
