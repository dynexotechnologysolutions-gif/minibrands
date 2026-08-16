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
      className="bg-brand-dark text-white pt-4 pb-4 px-4 shadow-md sticky top-0 z-50 rounded-b-3xl md:rounded-none"
      data-purpose="main-header"
    >
      <div className="max-w-[1280px] mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Mobile Header Row / Logo Section */}
        <div className="flex items-center justify-between w-full md:w-auto mb-4 md:mb-0">
          <div className="flex items-center gap-3">
            <button className="text-xl p-1 md:hidden" aria-label="Menu" suppressHydrationWarning>
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="flex items-center gap-2">
              {/* Gem icon shown on desktop */}
              <i className="fa-solid fa-gem text-2xl hidden md:block text-white"></i>
              {/* Shopping bag icon on mobile */}
              <i className="fa-solid fa-shopping-bag text-2xl md:hidden text-white"></i>
              <div>
                <h1 className="text-lg font-bold leading-tight tracking-wide">VELVET LANE</h1>
                <p className="text-[10px] text-gray-300 hidden md:block">Luxury &amp; Style. One Place.</p>
                <p className="text-[10px] text-gray-300 md:hidden">Many Stores. One Trusted Place.</p>
              </div>
            </div>
          </div>
          {/* Mobile Right Icons */}
          <div className="flex items-center gap-4 text-xl md:hidden">
            <Link href={wishlistHref} aria-label="Wishlist">
              <i className="fa-regular fa-heart"></i>
            </Link>
            <Link href="/account/notifications" aria-label="Notifications" className="relative">
              <i className="fa-regular fa-bell"></i>
              <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-brand-dark">3</span>
            </Link>
            <Link href="/cart" aria-label="Cart" className="relative">
              <i className="fa-solid fa-cart-shopping"></i>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-brand-dark">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Search bar matching Stitch exactly */}
        <form onSubmit={handleSearch} className="relative w-full md:max-w-xl lg:max-w-2xl flex-1" suppressHydrationWarning>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fa-solid fa-search text-gray-400"></i>
          </div>
          <input
            suppressHydrationWarning
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-12 py-2.5 rounded-xl focus:ring-2 focus:ring-brand-teal text-sm text-gray-900 placeholder-gray-500 bg-white border border-gray-200 focus:outline-none"
            placeholder="Search products, brands or stores..."
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2 text-gray-400">
            <button type="button" aria-label="Voice" className="hover:text-brand-teal transition" suppressHydrationWarning>
              <i className="fa-solid fa-microphone"></i>
            </button>
          </div>
        </form>

        {/* Desktop Right navigation buttons */}
        <div className="hidden md:flex items-center gap-6 text-xl">
          <Link href={wishlistHref} className="hover:text-brand-orange transition flex flex-col items-center gap-1">
            <i className="fa-regular fa-heart"></i>
            <span className="text-[10px] font-medium">Wishlist</span>
          </Link>
          <Link href="/account/notifications" className="relative hover:text-brand-orange transition flex flex-col items-center gap-1">
            <div className="relative">
              <i className="fa-regular fa-bell"></i>
              <span className="absolute -top-1.5 -right-1.5 bg-brand-red text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-brand-dark">3</span>
            </div>
            <span className="text-[10px] font-medium">Alerts</span>
          </Link>
          <Link href="/cart" className="relative hover:text-brand-orange transition flex flex-col items-center gap-1">
            <div className="relative">
              <i className="fa-solid fa-cart-shopping"></i>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-red text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-brand-dark">{cartCount}</span>
              )}
            </div>
            <span className="text-[10px] font-medium">Cart</span>
          </Link>
          <Link href={accountHref} className="hover:text-brand-orange transition flex flex-col items-center gap-1">
            <i className="fa-regular fa-user"></i>
            <span className="text-[10px] font-medium">{userProfile ? "Profile" : "Login"}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
