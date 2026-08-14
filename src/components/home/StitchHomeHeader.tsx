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
    <header className="bg-[#00302f] text-white px-4 md:px-8 pt-12 md:pt-6 pb-4 md:pb-6 relative z-50 rounded-b-[1.5rem] md:rounded-none" data-purpose="main-header">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8">
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
