"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { switchActiveRole } from "@/actions/switch-role.action";
import { getDefaultAddress } from "@/actions/address-get-default.action";
import { getPreciseLocation } from "@/lib/geolocation";

interface UserProfileData {
  id: string;
  role: "BUYER" | "SELLER" | "ADMIN";
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

interface HomeHeaderProps {
  userProfile?: UserProfileData | null;
  cartCount: number;
  sellerHref: string;
}

export default function HomeHeader({ userProfile, cartCount, sellerHref }: HomeHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<"BUYER" | "SELLER">("BUYER");
  const [locationText, setLocationText] = useState("Select Location");

  const accountRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // Click / touch outside listener to close dropdowns reliably
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // 1. Check local storage cache
    try {
      const cached = localStorage.getItem("velvet_detected_location");
      if (cached) {
        const { text, timestamp } = JSON.parse(cached);
        const fiveMinutes = 5 * 60 * 1000;
        if (Date.now() - timestamp < fiveMinutes) {
          setLocationText(text);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Fetch default address if user is logged in
    if (userProfile) {
      getDefaultAddress().then((res) => {
        if (res.success && res.data) {
          const addr = res.data;
          const area = addr.line2 || addr.line1;
          const formatted = area ? `${area.split(",")[0].trim()}, ${addr.city}` : addr.city;
          setLocationText(formatted);
        }
      }).catch(err => {
        console.error("Failed to fetch default address:", err);
      });
    }
  }, [userProfile]);

  const handleHeaderLocationClick = async () => {
    setLocationText("Detecting your precise location...");

    try {
      const preciseCoords = await getPreciseLocation((progressMessage) => {
        setLocationText(progressMessage);
      });

      const { latitude, longitude, accuracy, confidenceScore } = preciseCoords;
      const res = await fetch(`/api/location/reverse-geocode?lat=${latitude}&lon=${longitude}`);
      if (!res.ok) {
        setLocationText("Select Location");
        return;
      }
      
      const result = await res.json();
      if (result.success && result.address) {
        const { area, city } = result.address;
        const formatted = area ? `${area.split(",")[0].trim()}, ${city}` : city;
        
        // Cache in localStorage (expires after 5 minutes)
        localStorage.setItem(
          "velvet_detected_location",
          JSON.stringify({
            text: formatted,
            latitude,
            longitude,
            accuracy,
            confidenceScore,
            timestamp: Date.now(),
          })
        );

        setLocationText(formatted);
      } else {
        setLocationText("Select Location");
      }
    } catch (err: any) {
      console.error("GPS detection failed:", err);
      if (err.message?.includes("permission denied") || err.message?.includes("Permission denied")) {
        setLocationText("Select Location");
      } else if (err.message?.includes("timeout") || err.message?.includes("timed out")) {
        setLocationText("Unable to detect location");
      } else {
        setLocationText("Unable to detect location");
      }
      alert(err.message || "Failed to detect location.");
    }
  };

  // Read active mode from cookies on mount
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )active_role_mode=([^;]*)/);
    const cookieVal = match ? match[1] : null;
    if (cookieVal === "SELLER" && userProfile?.seller) {
      setActiveMode("SELLER");
    } else {
      setActiveMode("BUYER");
    }
  }, [userProfile]);

  const handleRoleSwitch = async (newMode: "BUYER" | "SELLER") => {
    try {
      const res = await switchActiveRole(newMode);
      if (res.success) {
        setActiveMode(newMode);
        setIsAccountOpen(false);
        router.refresh();
        if (newMode === "SELLER") {
          router.push("/seller/dashboard");
        } else {
          router.push("/");
        }
      } else {
        alert(res.error?.message || "Failed to switch role");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/products");
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.refresh();
      router.push("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // Determine where "Become Seller" goes
  const becomeSellerHref = userProfile?.seller ? sellerHref : "/login?role=seller";

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="sticky top-0 w-full z-50 flex flex-col items-center bg-surface px-base lg:px-xl transition-colors duration-200 border-b border-border-gray max-w-full">
      {/* TopAppBar */}
      <div className="flex items-center justify-between w-full max-w-container-max py-sm h-16">
        <div className="flex items-center gap-lg">
          <Link href="/" className="select-none">
            <span className="text-[20px] sm:text-[24px] font-black text-primary uppercase font-headline-md tracking-tight">
              MINIBRANDS
            </span>
          </Link>
        </div>
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-2xl mx-lg relative">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-text-muted text-[18px] pointer-events-none">
            search
          </span>
          <input
            className="w-full pl-xl pr-md py-sm bg-surface-container-low border border-border-gray rounded-DEFAULT text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            placeholder="Search products, brands and categories"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            suppressHydrationWarning={true}
          />
        </form>
        <div className="flex items-center gap-sm sm:gap-md lg:gap-lg">
          <button 
            onClick={handleHeaderLocationClick}
            className="hidden lg:flex items-center gap-xs text-body-sm text-on-surface-variant hover:bg-surface-container-low px-sm py-xs rounded-DEFAULT transition-colors duration-200 cursor-pointer select-none"
            suppressHydrationWarning={true}
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0" }}>
              location_on
            </span>
            <span className="hidden lg:inline">{locationText}</span>
          </button>
          <div className="h-6 w-px bg-border-gray mx-sm hidden md:block"></div>

          {/* Account Circle Menu */}
          <div
            ref={accountRef}
            className="relative"
            onMouseEnter={() => {
              if (typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches) {
                setIsAccountOpen(true);
              }
            }}
            onMouseLeave={() => {
              if (typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches) {
                setIsAccountOpen(false);
              }
            }}
          >
            <button 
              onClick={() => setIsAccountOpen((prev) => !prev)}
              className="flex items-center gap-xs text-body-sm text-on-surface-variant hover:bg-surface-container-low px-sm py-xs rounded-DEFAULT transition-colors duration-200 cursor-pointer select-none"
              suppressHydrationWarning={true}
            >
              {activeMode === "BUYER" ? (
                userProfile?.user?.image ? (
                  <img src={userProfile.user.image} alt={userProfile.user.name || "User"} className="w-5 h-5 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">account_circle</span>
                )
              ) : (
                userProfile?.seller?.storeLogo ? (
                  <img src={userProfile.seller.storeLogo} alt={userProfile.seller.storeName || userProfile.seller.businessName} className="w-5 h-5 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">storefront</span>
                )
              )}
              <span className="hidden md:inline max-w-[80px] truncate text-xs font-semibold">
                {activeMode === "BUYER"
                  ? (userProfile?.user?.name || "Account").split(" ")[0]
                  : (userProfile?.seller?.storeName || userProfile?.seller?.businessName || "Store").split(" ")[0]}
              </span>
            </button>
            {isAccountOpen && (
              <div className="absolute right-0 top-full pt-xs z-[100]">
                <div className="bg-surface-container-lowest border border-border-gray rounded-DEFAULT shadow-sm min-w-[180px] py-sm flex flex-col">
                  {activeMode === "BUYER" ? (
                    <>
                      <Link
                        className="px-lg py-sm text-body-sm text-on-surface hover:bg-surface-container-low hover:text-accent-yellow transition-colors"
                        href={userProfile ? "/account/profile" : "/login?role=buyer"}
                      >
                        My Profile
                      </Link>
                      <Link
                        className="px-lg py-sm text-body-sm text-on-surface hover:bg-surface-container-low hover:text-accent-yellow transition-colors"
                        href={userProfile ? "/account/orders" : "/login?role=buyer"}
                      >
                        Orders
                      </Link>
                      <Link
                        className="px-lg py-sm text-body-sm text-on-surface hover:bg-surface-container-low hover:text-accent-yellow transition-colors"
                        href={userProfile ? "/account/addresses" : "/login?role=buyer"}
                      >
                        Saved Addresses
                      </Link>
                      <Link
                        className="px-lg py-sm text-body-sm text-on-surface hover:bg-surface-container-low hover:text-accent-yellow transition-colors"
                        href={userProfile ? "/account/wishlist" : "/login?role=buyer"}
                      >
                        Wishlist
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        className="px-lg py-sm text-body-sm text-on-surface hover:bg-surface-container-low hover:text-accent-yellow transition-colors"
                        href="/seller/dashboard"
                      >
                        Seller Dashboard
                      </Link>
                      <Link
                        className="px-lg py-sm text-body-sm text-on-surface hover:bg-surface-container-low hover:text-accent-yellow transition-colors"
                        href="/seller/profile"
                      >
                        Store Profile
                      </Link>
                      <Link
                        className="px-lg py-sm text-body-sm text-on-surface hover:bg-surface-container-low hover:text-accent-yellow transition-colors"
                        href="/seller/orders"
                      >
                        Orders
                      </Link>
                      <Link
                        className="px-lg py-sm text-body-sm text-on-surface hover:bg-surface-container-low hover:text-accent-yellow transition-colors"
                        href="/seller/returns"
                      >
                        Returns & RMA
                      </Link>
                      <Link
                        className="px-lg py-sm text-body-sm text-on-surface hover:bg-surface-container-low hover:text-accent-yellow transition-colors"
                        href="/seller/products"
                      >
                        Products
                      </Link>
                    </>
                  )}

                  {/* Role Switcher Action */}
                  {userProfile?.seller && (
                    <>
                      <div className="h-px bg-border-gray my-xs mx-sm"></div>
                      <div className="px-lg py-sm">
                        <button
                          type="button"
                          onClick={() => handleRoleSwitch(activeMode === "BUYER" ? "SELLER" : "BUYER")}
                          className="w-full flex items-center justify-center gap-1.5 px-2 py-1 text-center text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded transition-all cursor-pointer"
                          suppressHydrationWarning={true}
                        >
                          <span>Switch to {activeMode === "BUYER" ? "Seller Mode" : "Buyer Mode"}</span>
                        </button>
                      </div>
                    </>
                  )}

                  <div className="h-px bg-border-gray my-xs mx-sm"></div>
                  {userProfile ? (
                    <button
                      onClick={handleSignOut}
                      className="px-lg py-sm text-body-sm text-left text-error-red hover:bg-surface-container-low transition-colors w-full cursor-pointer"
                      suppressHydrationWarning={true}
                    >
                      Logout
                    </button>
                  ) : (
                    <Link
                      href="/login?role=buyer"
                      className="px-lg py-sm text-body-sm text-left text-error-red hover:bg-surface-container-low transition-colors w-full"
                    >
                      Login
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* More menu dropdown */}
          <div
            ref={moreRef}
            className="relative"
            onMouseEnter={() => {
              if (typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches) {
                setIsMoreOpen(true);
              }
            }}
            onMouseLeave={() => {
              if (typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches) {
                setIsMoreOpen(false);
              }
            }}
          >
            <button 
              onClick={() => setIsMoreOpen((prev) => !prev)}
              className="flex items-center gap-xs text-body-sm text-on-surface-variant hover:bg-surface-container-low px-sm py-xs rounded-DEFAULT transition-colors duration-200 cursor-pointer select-none"
              suppressHydrationWarning={true}
            >
              <span className="hidden lg:inline">More</span>
              <span className="material-symbols-outlined text-[24px]">expand_more</span>
            </button>
            {isMoreOpen && (
              <div className="absolute right-0 top-full pt-xs z-[100]">
                <div className="bg-surface-container-lowest border border-border-gray rounded-DEFAULT shadow-sm min-w-[180px] py-sm flex flex-col">
                  <Link
                    className="px-lg py-sm text-body-sm text-on-surface hover:bg-surface-container-low hover:text-accent-yellow transition-colors"
                    href={becomeSellerHref}
                  >
                    Become Seller
                  </Link>
                  <a
                    className="px-lg py-sm text-body-sm text-on-surface hover:bg-surface-container-low hover:text-accent-yellow transition-colors"
                    href="#"
                  >
                    Notification Settings
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Wishlist button */}
          <Link
            href={userProfile ? "/wishlist" : "/login?role=buyer"}
            className="flex items-center gap-xs text-body-sm text-on-surface-variant hover:bg-surface-container-low px-sm py-xs rounded-DEFAULT transition-colors duration-200 relative cursor-pointer select-none"
          >
            <span className="material-symbols-outlined text-[24px]">favorite</span>
          </Link>

          {/* Shopping Cart button */}
          <Link
            href="/cart"
            className="flex items-center gap-xs text-body-sm text-on-surface-variant hover:bg-surface-container-low px-sm py-xs rounded-DEFAULT transition-colors duration-200 relative cursor-pointer select-none"
          >
            <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
            <span className="absolute top-0 right-0 bg-accent-yellow text-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-surface">
              {cartCount > 0 ? cartCount : 2}
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar (Below MINIBRANDS Logo & Actions) */}
      <div className="w-full max-w-container-max pb-sm md:hidden px-xs">
        <form onSubmit={handleSearchSubmit} className="w-full relative">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-text-muted text-[18px] pointer-events-none">
            search
          </span>
          <input
            className="w-full pl-xl pr-md py-2 bg-surface-container-low border border-border-gray rounded-DEFAULT text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            placeholder="Search products, brands and categories"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            suppressHydrationWarning={true}
          />
        </form>
      </div>
    </header>
  );
}
