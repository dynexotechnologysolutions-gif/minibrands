"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, ShoppingBag, User } from "lucide-react";
import BottomNavigationItem from "./BottomNavigationItem";
import { useWishlist } from "@/features/catalog/hooks/useWishlist";

import { UserProfileData } from "@/components/home/HomeHeader";

interface MobileBottomNavigationProps {
  userProfile?: UserProfileData | null;
  cartCount: number;
}

export default function MobileBottomNavigation({
  userProfile,
  cartCount,
}: MobileBottomNavigationProps) {
  const pathname = usePathname();
  const { wishlist = [] } = useWishlist();

  // Route matching rules
  const isHome = pathname === "/";
  const isDiscover =
    pathname === "/products" ||
    pathname.startsWith("/catalog") ||
    pathname.startsWith("/category") ||
    pathname.startsWith("/search");
  const isWishlist = pathname === "/account/wishlist" || pathname === "/wishlist";
  const isCart = pathname === "/cart";
  const isAccount = pathname === "/account/profile";

  const accountHref = userProfile ? "/account/profile" : "/login?role=buyer";
  const wishlistHref = userProfile ? "/wishlist" : "/login?role=buyer";

  // If user is inside checkout pages or subpage details, do not show bottom navigation bar or keep it unhighlighted.
  const isCheckout = pathname.startsWith("/checkout") || pathname.startsWith("/order/success");
  if (isCheckout) return null;

  return (
    <nav
      role="tablist"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)] bg-white/85 backdrop-blur-xl border-t border-[#ECECEC]/80 shadow-[0_-8px_24px_rgba(17,24,39,0.06)] rounded-t-[20px] md:hidden transform-gpu"
      aria-label="Mobile Bottom Navigation"
    >
      <BottomNavigationItem
        href="/"
        label="Home"
        icon={Home}
        isActive={isHome}
      />
      <BottomNavigationItem
        href="/products"
        label="Explore"
        icon={Search}
        isActive={isDiscover}
      />
      <BottomNavigationItem
        href={wishlistHref}
        label="Wishlist"
        icon={Heart}
        isActive={isWishlist}
        badgeCount={userProfile ? wishlist.length : 0}
      />
      <BottomNavigationItem
        href="/cart"
        label="Cart"
        icon={ShoppingBag}
        isActive={isCart}
        badgeCount={cartCount}
      />
      <BottomNavigationItem
        href={accountHref}
        label="Account"
        icon={User}
        isActive={isAccount}
      />
    </nav>
  );
}
