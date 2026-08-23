"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Store, ShoppingBag, User } from "lucide-react";
import BottomNavigationItem from "./BottomNavigationItem";

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

  // Route matching rules
  const isHome = pathname === "/";
  const isCategories = pathname === "/categories" || pathname.startsWith("/category");
  const isStores = pathname === "/stores" || pathname.startsWith("/sellers") || pathname.startsWith("/store");
  const isCart = pathname === "/cart";
  const isAccount = pathname === "/account/profile";

  const accountHref = userProfile ? "/account/profile" : "/login?role=buyer";

  // If user is inside checkout pages or subpage details, do not show bottom navigation bar
  const isCheckout = pathname.startsWith("/order/success");
  if (isCheckout) return null;

  return (
    <nav
      role="tablist"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)] bg-white border-t border-[#ECECEC] md:hidden transform-gpu"
      aria-label="Mobile Bottom Navigation"
    >
      <BottomNavigationItem
        href="/"
        label="Home"
        icon={Home}
        isActive={isHome}
      />
      <BottomNavigationItem
        href="/categories"
        label="Categories"
        icon={LayoutGrid}
        isActive={isCategories}
      />
      <BottomNavigationItem
        href="/stores"
        label="Stores"
        icon={Store}
        isActive={isStores}
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
