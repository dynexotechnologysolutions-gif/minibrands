"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Settings, Lock } from "lucide-react";
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
  const isHome = pathname === "/";
  const isExplore = pathname === "/products";
  const isExploreQuery = pathname.startsWith("/products") && !pathname.startsWith("/products/"); // matches /products/ but not /products/[id]
  const isWishlist = pathname === "/account/wishlist" || pathname === "/wishlist";
  const isCart = pathname === "/cart";
  const isAccount = pathname === "/account/profile";
  const isCheckout = pathname === "/checkout";

  // 1. Home Header
  if (isHome) {
    const avatarUrl = activeMode === "BUYER" ? userProfile?.user?.image : userProfile?.seller?.storeLogo;
    const avatarElement = avatarUrl ? (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={avatarUrl}
        alt={displayName}
        className="w-7 h-7 rounded-full object-cover border border-[#ECECEC]"
      />
    ) : (
      <div className="w-7 h-7 rounded-full bg-vl-secondary/10 flex items-center justify-center font-vl-heading text-[10px] font-bold text-vl-secondary">
        {getInitials(displayName)}
      </div>
    );

    return (
      <div className="w-full flex items-center justify-between h-16 bg-white border-b border-[#ECECEC]/80 px-4 pt-[calc(env(safe-area-inset-top)+4px)] shadow-sm md:hidden">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-1.5" aria-label="MiniBrands Home">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl font-vl-heading text-sm font-extrabold text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #6C3BFF 0%, #FF4D8D 100%)" }}
          >
            M
          </span>
          <span className="font-vl-heading text-xs font-extrabold tracking-[-0.04em] text-[#111827]">
            MiniBrands
          </span>
        </Link>

        {/* Compact Search Bar Redirector */}
        <Link
          href="/products"
          className="flex-1 mx-3 max-w-[180px] xs:max-w-xs h-9 pl-3 pr-2 flex items-center gap-2 bg-[#F5F5F8] border border-transparent rounded-vl-control text-slate-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vl-primary focus-visible:ring-offset-1"
        >
          <Search className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-[11px] font-medium truncate">Search...</span>
        </Link>

        {/* User Profile Avatar Link */}
        <Link
          href={userProfile ? "/account/profile" : "/login?role=buyer"}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-50"
          aria-label="Account Settings"
        >
          {avatarElement}
        </Link>
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
        rightElement={<Lock className="w-4 h-4 text-emerald-600" />}
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
