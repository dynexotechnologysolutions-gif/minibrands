"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface UserProfileData {
  id: string;
  role: "BUYER" | "SELLER" | "ADMIN" | "SUPER_ADMIN";
  user: { name: string; email: string; image?: string | null };
  seller?: { id: string; businessName: string; storeName: string; storeLogo?: string | null } | null;
}

interface StitchHomeHeaderProps {
  userProfile?: UserProfileData | null;
  cartCount: number;
  sellerHref: string;
}

export default function StitchHomeHeader({ userProfile, cartCount, sellerHref }: StitchHomeHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(searchQuery.trim() ? `/products?q=${encodeURIComponent(searchQuery.trim())}` : "/products");
  };

  const wishlistHref = userProfile ? "/wishlist" : "/login?role=buyer";
  const accountHref = userProfile ? "/account/profile" : "/login?role=buyer";

  return (
    <header
      className="bg-[#0d3b36] text-white sticky top-0 z-50 shadow-md"
      data-purpose="main-header"
    >
      {/* ── MOBILE header (< md) ───────────────────────── */}
      <div className="md:hidden px-4 pt-4 pb-5 rounded-b-3xl">
        {/* Row 1: hamburger + logo + icons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button aria-label="Menu" suppressHydrationWarning>
              <i className="fa-solid fa-bars text-xl"></i>
            </button>
            <Link href="/" className="flex items-center gap-2">
              <i className="fa-solid fa-shopping-bag text-2xl"></i>
              <div>
                <p className="text-[17px] font-bold leading-tight tracking-wide">MINIBRANDS</p>
                <p className="text-[10px] text-gray-300 leading-none">Many Stores. One Trusted Place.</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4 text-xl">
            <Link href={wishlistHref} aria-label="Wishlist">
              <i className="fa-regular fa-heart"></i>
            </Link>
            <Link href="/account/notifications" aria-label="Notifications" className="relative">
              <i className="fa-regular fa-bell"></i>
              <span className="absolute -top-1 -right-1 bg-[#d64545] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-[#0d3b36]">3</span>
            </Link>
            <Link href="/cart" aria-label="Cart" className="relative">
              <i className="fa-solid fa-cart-shopping"></i>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#d64545] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-[#0d3b36]">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>
        {/* Row 2: search */}
        <form onSubmit={handleSearch} className="relative" suppressHydrationWarning>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fa-solid fa-search text-gray-400 text-sm"></i>
          </div>
          <input
            suppressHydrationWarning
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-20 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-500 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F7F7F]"
            placeholder="Search products, brands or stores..."
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2 text-gray-400">
            <button type="button" aria-label="Voice" suppressHydrationWarning><i className="fa-solid fa-microphone"></i></button>
            <button type="button" aria-label="Scan" suppressHydrationWarning><i className="fa-solid fa-expand"></i></button>
          </div>
        </form>
      </div>

      {/* ── DESKTOP header (md+) ─────────────────────────── */}
      <div className="hidden md:block">
        <div className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <i className="fa-solid fa-shopping-bag text-2xl"></i>
            <div>
              <p className="text-base font-bold leading-tight tracking-wide">MINIBRANDS</p>
              <p className="text-[10px] text-gray-300 leading-none">Many Stores. One Trusted Place.</p>
            </div>
          </Link>

          {/* Search — centered, flexible */}
          <form onSubmit={handleSearch} className="flex-1 relative" suppressHydrationWarning>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fa-solid fa-search text-gray-400 text-sm"></i>
            </div>
            <input
              suppressHydrationWarning
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 rounded-xl text-sm text-gray-900 placeholder-gray-500 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F7F7F]"
              placeholder="Search products, brands or stores..."
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button type="button" aria-label="Voice" suppressHydrationWarning className="text-gray-400 hover:text-[#0F7F7F] transition">
                <i className="fa-solid fa-microphone text-sm"></i>
              </button>
            </div>
          </form>

          {/* Right icons */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <Link href={wishlistHref} className="flex flex-col items-center gap-0.5 text-gray-200 hover:text-[#F39C12] transition group">
              <i className="fa-regular fa-heart text-xl"></i>
              <span className="text-[10px] font-medium">Wishlist</span>
            </Link>
            <Link href="/account/notifications" className="relative flex flex-col items-center gap-0.5 text-gray-200 hover:text-[#F39C12] transition">
              <div className="relative">
                <i className="fa-regular fa-bell text-xl"></i>
                <span className="absolute -top-1.5 -right-1.5 bg-[#d64545] text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-[#0d3b36]">3</span>
              </div>
              <span className="text-[10px] font-medium">Alerts</span>
            </Link>
            <Link href="/cart" className="relative flex flex-col items-center gap-0.5 text-gray-200 hover:text-[#F39C12] transition">
              <div className="relative">
                <i className="fa-solid fa-cart-shopping text-xl"></i>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#d64545] text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-[#0d3b36]">{cartCount}</span>
                )}
              </div>
              <span className="text-[10px] font-medium">Cart</span>
            </Link>
            <Link href={accountHref} className="flex flex-col items-center gap-0.5 text-gray-200 hover:text-[#F39C12] transition">
              <i className="fa-regular fa-user text-xl"></i>
              <span className="text-[10px] font-medium">{userProfile ? "Profile" : "Login"}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
