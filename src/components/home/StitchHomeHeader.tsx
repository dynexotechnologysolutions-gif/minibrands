"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface UserProfileData {
  id: string;
  role: "BUYER" | "SELLER" | "ADMIN" | "SUPER_ADMIN";
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  seller?: {
    id: string;
    businessName: string;
    storeName: string;
    storeLogo?: string | null;
  } | null;
}

interface StitchHomeHeaderProps {
  userProfile?: UserProfileData | null;
  cartCount: number;
  sellerHref: string;
}

export default function StitchHomeHeader({ userProfile, cartCount }: StitchHomeHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(searchQuery.trim() ? `/products?q=${encodeURIComponent(searchQuery.trim())}` : "/products");
  };

  const accountHref = userProfile ? "/account/profile" : "/login?role=buyer";
  const wishlistHref = userProfile ? "/wishlist" : "/login?role=buyer";

  return (
    <header className="bg-[#00302f] text-white px-4 md:px-8 pt-12 md:pt-6 pb-4 md:pb-6 lg:pt-0 lg:pb-0 relative z-50 rounded-b-[1.5rem] md:rounded-none lg:rounded-none" data-purpose="main-header">

      {/* ── DESKTOP HEADER (lg+) ─────────────────────────────────── */}
      <div className="hidden lg:flex items-center justify-between h-[72px] max-w-[1200px] xl:max-w-[1280px] 2xl:max-w-[1440px] mx-auto px-6 xl:px-8 gap-6 xl:gap-10">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <i className="fa-solid fa-bag-shopping text-2xl xl:text-3xl text-white"></i>
          <div className="flex flex-col leading-tight">
            <span className="text-lg xl:text-xl font-bold tracking-tight text-white">MINIBRANDS</span>
            <span className="text-[9px] xl:text-[10px] text-gray-300 leading-none">Many Stores. One Trusted Place.</span>
          </div>
        </Link>

        {/* Nav Links */}
        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-gray-200 flex-shrink-0">
          <Link href="/products" className="hover:text-white transition-colors">Products</Link>
          <Link href="/stores" className="hover:text-white transition-colors">Stores</Link>
          <Link href="/products?sort=trending" className="hover:text-white transition-colors">Trending</Link>
        </nav>

        {/* Search Bar — Centered, prominent */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-xl xl:max-w-2xl"
          suppressHydrationWarning
        >
          <div className="bg-white rounded-xl flex items-center px-4 py-2.5 gap-2 shadow-sm">
            <i className="fa-solid fa-magnifying-glass text-gray-400 text-sm"></i>
            <input
              suppressHydrationWarning
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 w-full text-sm text-gray-800 placeholder-gray-400 outline-none"
              placeholder="Search products, stores, brands..."
            />
            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-2">
              <button type="button" aria-label="Voice Search" suppressHydrationWarning className="text-gray-400 hover:text-gray-600 transition-colors p-0.5">
                <i className="fa-solid fa-microphone text-sm"></i>
              </button>
              <button type="button" aria-label="Scan" suppressHydrationWarning className="text-gray-400 hover:text-gray-600 transition-colors p-0.5">
                <i className="fa-solid fa-expand text-sm"></i>
              </button>
            </div>
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-5 text-sm flex-shrink-0">
          <Link href={wishlistHref} aria-label="Wishlist" className="flex flex-col items-center gap-0.5 text-gray-200 hover:text-white transition-colors group">
            <i className="fa-regular fa-heart text-xl group-hover:scale-110 transition-transform duration-150"></i>
            <span className="text-[10px] font-medium">Wishlist</span>
          </Link>
          <Link href="/account/notifications" aria-label="Notifications" className="relative flex flex-col items-center gap-0.5 text-gray-200 hover:text-white transition-colors group">
            <i className="fa-regular fa-bell text-xl group-hover:scale-110 transition-transform duration-150"></i>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border border-[#00302f]">3</span>
            <span className="text-[10px] font-medium">Alerts</span>
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative flex flex-col items-center gap-0.5 text-gray-200 hover:text-white transition-colors group">
            <i className="fa-solid fa-cart-shopping text-xl group-hover:scale-110 transition-transform duration-150"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border border-[#00302f]">
                {cartCount}
              </span>
            )}
            <span className="text-[10px] font-medium">Cart</span>
          </Link>
          <Link href={accountHref} aria-label="Account" className="flex flex-col items-center gap-0.5 text-gray-200 hover:text-white transition-colors group">
            <i className="fa-regular fa-user text-xl group-hover:scale-110 transition-transform duration-150"></i>
            <span className="text-[10px] font-medium">{userProfile ? "Account" : "Login"}</span>
          </Link>
        </div>
      </div>

      {/* ── MOBILE / TABLET HEADER (below lg) — UNCHANGED ─────────── */}
      <div className="lg:hidden max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <button aria-label="Menu" className="text-xl md:hidden" suppressHydrationWarning>
              <i className="fa-solid fa-bars"></i>
            </button>
            <Link href="/" className="flex items-center gap-1">
              <i className="fa-solid fa-bag-shopping text-2xl md:text-3xl text-white"></i>
              <div className="flex flex-col leading-tight">
                <span className="text-xl md:text-2xl font-bold tracking-tight text-white">MINIBRANDS</span>
                <span className="text-[10px] md:text-xs text-gray-300">Many Stores. One Trusted Place.</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4 text-xl md:hidden">
            <Link href={wishlistHref} aria-label="Wishlist"><i className="fa-regular fa-heart"></i></Link>
            <Link href="/account/notifications" aria-label="Notifications" className="relative">
              <i className="fa-regular fa-bell"></i>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border border-[#00302f]">3</span>
            </Link>
            <Link href="/cart" aria-label="Cart" className="relative">
              <i className="fa-solid fa-cart-shopping"></i>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border border-[#00302f]">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="bg-white rounded-2xl flex items-center px-4 py-2 text-gray-500 w-full md:flex-1 md:max-w-2xl" suppressHydrationWarning>
          <i className="fa-solid fa-magnifying-glass mr-2 text-gray-400"></i>
          <input
            suppressHydrationWarning
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:ring-0 w-full text-sm md:text-base text-gray-800 placeholder-gray-400 outline-none"
            placeholder="Search products, brands or stores..."
          />
          <div className="flex items-center gap-2 border-l border-gray-200 pl-2 ml-2">
            <button type="button" aria-label="Voice Search" suppressHydrationWarning><i className="fa-solid fa-microphone text-gray-400 hover:text-gray-600"></i></button>
            <button type="button" aria-label="Scan" suppressHydrationWarning><i className="fa-solid fa-expand text-gray-400 hover:text-gray-600"></i></button>
          </div>
        </form>

        <div className="hidden md:flex items-center gap-6 text-2xl">
          <Link href={wishlistHref} aria-label="Wishlist" className="hover:text-gray-300 transition-colors"><i className="fa-regular fa-heart"></i></Link>
          <Link href="/account/notifications" aria-label="Notifications" className="relative hover:text-gray-300 transition-colors">
            <i className="fa-regular fa-bell"></i>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[12px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#00302f]">3</span>
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative hover:text-gray-300 transition-colors">
            <i className="fa-solid fa-cart-shopping"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[12px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#00302f]">
                {cartCount}
              </span>
            )}
          </Link>
          <Link href={accountHref} aria-label="Account" className="hover:text-gray-300 transition-colors"><i className="fa-regular fa-user"></i></Link>
        </div>
      </div>
    </header>
  );
}
