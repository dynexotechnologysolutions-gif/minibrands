"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface StitchMobileNavProps {
  cartCount: number;
  isLoggedIn: boolean;
}

export default function StitchMobileNav({ cartCount, isLoggedIn }: StitchMobileNavProps) {
  const pathname = usePathname();
  const accountHref = isLoggedIn ? "/account/profile" : "/login?role=buyer";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 z-50 flex md:hidden justify-around items-center py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-safe"
      data-purpose="bottom-navigation"
    >
      <Link
        href="/"
        className={`flex flex-col items-center w-1/5 transition-colors ${
          pathname === "/" ? "text-[#0d3b36]" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <i className="fa-solid fa-house text-xl mb-1"></i>
        <span className="text-[10px] font-medium">Home</span>
      </Link>

      <Link
        href="/categories"
        className={`flex flex-col items-center w-1/5 transition-colors ${
          pathname === "/categories" ? "text-[#0d3b36]" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <i className="fa-solid fa-shapes text-xl mb-1"></i>
        <span className="text-[10px] font-medium">Categories</span>
      </Link>

      <Link
        href="/stores"
        className={`flex flex-col items-center w-1/5 transition-colors ${
          pathname === "/stores" ? "text-[#0d3b36]" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <i className="fa-solid fa-store text-xl mb-1"></i>
        <span className="text-[10px] font-medium">Stores</span>
      </Link>

      <Link
        href="/cart"
        className={`flex flex-col items-center w-1/5 transition-colors relative ${
          pathname === "/cart" ? "text-[#0d3b36]" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <i className="fa-solid fa-cart-shopping text-xl mb-1"></i>
        {cartCount > 0 && (
          <span className="absolute top-0 right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
            {cartCount}
          </span>
        )}
        <span className="text-[10px] font-medium">Cart</span>
      </Link>

      <Link
        href={accountHref}
        className={`flex flex-col items-center w-1/5 transition-colors ${
          pathname.startsWith("/account") ? "text-[#0d3b36]" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <i className="fa-regular fa-user text-xl mb-1"></i>
        <span className="text-[10px] font-medium">Account</span>
      </Link>
    </nav>
  );
}
