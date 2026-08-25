"use client";

import React from "react";
import MobileHeader from "./MobileHeader";
import MobileBottomNavigation from "./MobileBottomNavigation";

import { UserProfileData } from "@/components/home/HomeHeader";

import { usePathname } from "next/navigation";

interface MobileNavigationShellProps {
  userProfile?: UserProfileData | null;
  cartCount: number;
  sellerHref: string;
  variant?: "default" | "green";
}

export default function MobileNavigationShell({
  userProfile,
  cartCount,
  variant = "default",
}: MobileNavigationShellProps) {
  const pathname = usePathname();
  
  // Hide global header/footer navigation on checkout and order confirmation screens
  const isCheckoutOrClaim = 
    pathname.startsWith("/claim-order");

  if (isCheckoutOrClaim) {
    return null;
  }

  return (
    <div className="md:hidden block">
      {/* Dynamic Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <MobileHeader userProfile={userProfile} cartCount={cartCount} variant={variant} />
      </header>

      {/* Dynamic Mobile Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 z-50">
        <MobileBottomNavigation userProfile={userProfile} cartCount={cartCount} />
      </footer>
    </div>
  );
}
