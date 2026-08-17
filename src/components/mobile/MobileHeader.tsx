"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Settings, Lock, Menu, Heart, Bell, ShoppingCart, ShoppingBag, Mic, Scan, User } from "lucide-react";
import MobileSearchHeader from "./MobileSearchHeader";
import MobilePageHeader from "./MobilePageHeader";
import { useWishlist } from "@/features/catalog/hooks/useWishlist";

import { UserProfileData } from "@/components/home/HomeHeader";

interface MobileHeaderProps {
  userProfile?: UserProfileData | null;
  cartCount: number;
}

export default function MobileHeader({ userProfile, cartCount }: MobileHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { wishlist = [] } = useWishlist();
  const [activeMode, setActiveMode] = useState<"BUYER" | "SELLER">("BUYER");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )active_role_mode=([^;]*)/);
    const cookieVal = match ? match[1] : null;
    const resolvedMode = cookieVal === "SELLER" && userProfile?.seller ? "SELLER" : "BUYER";
    
    const timer = setTimeout(() => {
      setActiveMode(resolvedMode);
    }, 0);
    
    return () => clearTimeout(timer);
  }, [userProfile]);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = activeMode === "BUYER"
    ? userProfile?.user?.name || "User"
    : userProfile?.seller?.storeName || userProfile?.seller?.businessName || "Store";

  // Mapped exact route conditions
  const isHome = pathname === "/" || pathname === "/categories" || pathname.startsWith("/category/");
  const isExplore = pathname === "/products";
  const isExploreQuery = pathname.startsWith("/products") && !pathname.startsWith("/products/"); // matches /products/ but not /products/[id]
  const isWishlist = pathname === "/account/wishlist" || pathname === "/wishlist";
  const isCart = pathname === "/cart";
  const isAccount = pathname === "/account/profile";
  const isCheckout = pathname === "/checkout";

  // 1. Home Header
  if (isHome) {
    return (
      <div className="w-full flex flex-col bg-[#0d3b36] border-b border-[#0d3b36]/10 px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-3 shadow-md md:hidden font-sans">
        {/* Row 1: Left Menu/Brand Logo + Right Icons */}
        <div className="flex items-center justify-between h-11 gap-2">
          {/* Left section: Hamburger Menu + Logo */}
          <div className="flex items-center gap-2">
            {/* Hamburger Menu Icon */}
            <button className="text-white hover:opacity-85 active:scale-95 transition-all p-1" aria-label="Menu">
              <Menu className="w-5.5 h-5.5" />
            </button>

            {/* Brand Logo with tagline */}
            <Link href="/" className="flex items-center gap-1.5" aria-label="MiniBrands Home">
              <div className="flex items-center gap-1.5 text-white">
                <ShoppingBag className="w-5.5 h-5.5 text-white" />
                <div className="flex flex-col items-start leading-none">
                  <div className="text-sm font-extrabold tracking-tight">
                    <span className="text-white font-sans">MiniBrands</span>
                  </div>
                  <span className="text-[7.5px] opacity-75 font-normal tracking-wide mt-0.5">
                    Many Stores. One Trusted Place.
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-2 text-white">
            <Link href="/wishlist" className="hover:opacity-85 active:scale-95 transition-all p-1 relative animate-scale-in" aria-label="Wishlist">
              <Heart className="w-5 h-5" />
            </Link>
            <Link href="/account" className="hover:opacity-85 active:scale-95 transition-all p-1 relative animate-scale-in" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E53935] px-1 text-[8px] font-extrabold text-white border-2 border-[#0d3b36] shadow-sm leading-none">
                3
              </span>
            </Link>
            <Link href="/cart" className="hover:opacity-85 active:scale-95 transition-all p-1 relative animate-scale-in mr-0.5" aria-label="Shopping Cart">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E53935] px-1 text-[8px] font-extrabold text-white border-2 border-[#0d3b36] shadow-sm leading-none">
                {cartCount > 0 ? cartCount : 2}
              </span>
            </Link>

            {/* Profile Avatar next to Cart */}
            {userProfile?.user ? (
              <Link href="/account/profile" className="flex items-center justify-center w-6 h-6 rounded-full overflow-hidden border border-white/20 shrink-0 ml-1 active:scale-95 transition-transform" aria-label="Profile">
                {userProfile.user.image ? (
                  <img src={userProfile.user.image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/10 text-white text-[9px] font-bold">
                    {getInitials(userProfile.user.name)}
                  </div>
                )}
              </Link>
            ) : (
              <Link href="/login?role=buyer" className="hover:opacity-85 active:scale-95 transition-all p-1 ml-1" aria-label="Sign In">
                <User className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Row 2: Search input bar redirector */}
        <div className="w-full mt-2.5">
          <div
            onClick={() => router.push("/products")}
            className="w-full h-11 px-3.5 bg-white border border-transparent rounded-full flex items-center justify-between text-slate-400 cursor-pointer shadow-sm active:scale-[0.99] transition-transform duration-75"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500 font-medium">Search products, brands or stores...</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-500">
              <Mic className="w-4 h-4 text-[#0F7F7F]" />
              <Scan className="w-4 h-4 text-[#0F7F7F]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Discover/Explore Search Header
  if (isExplore || isExploreQuery) {
    return <MobileSearchHeader />;
  }

  // 3. Checkout Header
  if (isCheckout) {
    return (
      <MobilePageHeader
        title="Secure Checkout"
        showBackButton={false}
        rightElement={<Lock className="w-4 h-4 text-[#2E7D32]" />}
      />
    );
  }

  // 4. Wishlist Header
  if (isWishlist) {
    return (
      <MobilePageHeader
        title="Wishlist"
        count={wishlist.length}
        showBackButton={true}
      />
    );
  }

  // 5. Cart Header
  if (isCart) {
    return (
      <MobilePageHeader
        title="Shopping Cart"
        count={cartCount}
        showBackButton={true}
      />
    );
  }

  // 6. Account Header
  if (isAccount) {
    return (
      <MobilePageHeader
        title="My Profile"
        showBackButton={false}
        rightElement={
          <button
            onClick={() => router.push("/account/security")}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-50 text-slate-700"
            aria-label="Security Settings"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        }
      />
    );
  }

  // 7. Fallback for other pages
  let fallbackTitle = "MiniBrands";
  if (pathname.includes("/products/")) {
    fallbackTitle = "Product Details";
  } else if (pathname.includes("/orders")) {
    fallbackTitle = "My Orders";
  } else if (pathname.includes("/addresses")) {
    fallbackTitle = "Saved Addresses";
  } else if (pathname.includes("/security")) {
    fallbackTitle = "Account Security";
  }

  return <MobilePageHeader title={fallbackTitle} showBackButton={true} />;
}
