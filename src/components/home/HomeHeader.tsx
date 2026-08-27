"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  MoreHorizontal,
  Package,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
} from "lucide-react";
import { switchActiveRole } from "@/actions/switch-role.action";
import { getDefaultAddress } from "@/actions/address-get-default.action";
import { getPreciseLocation } from "@/lib/geolocation";
import MobileNavigationShell from "../mobile/MobileNavigationShell";

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

interface HomeHeaderProps {
  userProfile?: UserProfileData | null;
  cartCount: number;
  sellerHref: string;
  variant?: "default" | "green";
}

export default function HomeHeader({ userProfile, cartCount, sellerHref, variant }: HomeHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot") ||
    pathname.startsWith("/reset") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/session-expired");
  const isSellerOrAdmin = pathname.startsWith("/seller") || pathname.startsWith("/admin");
  const isMarketplaceBuyer =
    pathname === "/" ||
    pathname === "/stores" ||
    pathname === "/categories" ||
    pathname.startsWith("/sellers") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/category") ||
    pathname === "/search" ||
    pathname.startsWith("/search");
  const isBuyerRoute = isMarketplaceBuyer && !isAuthRoute && !isSellerOrAdmin;
  const effectiveVariant = variant ?? (isBuyerRoute ? "green" : "default");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<"BUYER" | "SELLER">("BUYER");
  const [locationText, setLocationText] = useState("Select location");
  const accountRef = useRef<HTMLDivElement>(null);
  const accountRefMobile = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const clickedAccount = (accountRef.current && accountRef.current.contains(event.target as Node)) ||
                             (accountRefMobile.current && accountRefMobile.current.contains(event.target as Node));
      if (!clickedAccount) setIsAccountOpen(false);
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) setIsMoreOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("velvet_detected_location");
      if (cached) {
        const { text, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setTimeout(() => setLocationText(text), 0);
          return;
        }
      }
    } catch (error) {
      console.error(error);
    }

    if (userProfile) {
      try {
        const cachedAddress = sessionStorage.getItem("velvet_default_address_location");
        if (cachedAddress) {
          setTimeout(() => setLocationText(cachedAddress), 0);
          return;
        }
      } catch {
        // sessionStorage unavailable, proceed to fetch
      }

      getDefaultAddress()
        .then((res) => {
          if (res.success && res.data) {
            const area = res.data.line2 || res.data.line1;
            const formatted = area ? `${area.split(",")[0].trim()}, ${res.data.city}` : res.data.city;
            setLocationText(formatted);
            try {
              sessionStorage.setItem("velvet_default_address_location", formatted);
            } catch {}
          }
        })
        .catch((error) => console.error("Failed to fetch default address:", error));
    }
  }, [userProfile]);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )active_role_mode=([^;]*)/);
    const mode = match?.[1] === "SELLER" && userProfile?.seller ? "SELLER" : "BUYER";
    setTimeout(() => setActiveMode(mode), 0);
  }, [userProfile]);

  const handleHeaderLocationClick = async () => {
    setLocationText("Detecting location…");
    try {
      const preciseCoords = await getPreciseLocation((progressMessage) => setLocationText(progressMessage));
      const { latitude, longitude, accuracy, confidenceScore } = preciseCoords;
      const response = await fetch(`/api/location/reverse-geocode?lat=${latitude}&lon=${longitude}`);
      if (!response.ok) {
        setLocationText("Select location");
        return;
      }
      const result = await response.json();
      if (result.success && result.address) {
        const { area, city } = result.address;
        const formatted = area ? `${area.split(",")[0].trim()}, ${city}` : city;
        localStorage.setItem("velvet_detected_location", JSON.stringify({ text: formatted, latitude, longitude, accuracy, confidenceScore, timestamp: Date.now() }));
        setLocationText(formatted);
      } else {
        setLocationText("Select location");
      }
    } catch (error) {
      console.error("GPS detection failed:", error);
      const errMsg = error instanceof Error ? error.message : "";
      setLocationText(errMsg.toLowerCase().includes("permission") ? "Select location" : "Unable to detect location");
      alert(errMsg || "Failed to detect location.");
    }
  };

  const handleRoleSwitch = async (newMode: "BUYER" | "SELLER") => {
    try {
      const response = await switchActiveRole(newMode);
      if (response.success) {
        setActiveMode(newMode);
        setIsAccountOpen(false);
        router.refresh();
        router.push(newMode === "SELLER" ? "/seller/dashboard" : "/");
      } else {
        alert(response.error?.message || "Failed to switch role");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(searchQuery.trim() ? `/products?q=${encodeURIComponent(searchQuery)}` : "/products");
  };

  const handleSignOut = async () => {
    try {
      const { atomicLogout } = await import("@/actions/logout.action");
      await atomicLogout();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const becomeSellerHref = userProfile?.seller ? sellerHref : "/login?role=seller";
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const accountHref = userProfile ? "/account/profile" : "/login?role=buyer";
  const wishlistHref = userProfile ? "/wishlist" : "/login?role=buyer";
  const getInitials = (name: string) => name ? name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2) : "U";
  const displayName = activeMode === "BUYER" ? userProfile?.user?.name : userProfile?.seller?.storeName || userProfile?.seller?.businessName;

  const navLinkClass = (href: string) => {
    const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
    if (effectiveVariant === "green") {
      return `transition-all duration-vl-fast relative py-2 text-sm font-semibold font-vl-heading after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-white after:transition-all after:duration-vl-fast hover:after:w-full ${
        isActive 
          ? "text-white after:w-full" 
          : "text-white/80 hover:text-white"
      }`;
    } else {
      return `transition-all duration-vl-fast relative py-2 text-sm font-semibold font-vl-heading after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-vl-primary after:transition-all after:duration-vl-fast hover:after:w-full ${
        isActive 
          ? "text-vl-primary after:w-full" 
          : "text-vl-secondary hover:text-vl-primary"
      }`;
    }
  };

  return (
    <>
      {/* Desktop Header */}
      <header className={`sticky top-0 z-50 w-full border-b backdrop-blur-xl hidden md:block ${effectiveVariant === "green" ? "border-[#0d3b36]/10 bg-[#0d3b36] shadow-md" : "border-[#ECECEC]/80 bg-white/92 shadow-[0_1px_16px_rgba(17,24,39,0.05)]"}`}>
        <div className="mx-auto h-20 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 flex">
          <div className="flex items-center gap-6 xl:gap-10 shrink-0">
            <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="MiniBrands home">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-vl-heading text-lg font-extrabold text-white shadow-md transition-all duration-200 group-hover:scale-105 group-hover:rotate-3"
                style={{ background: "linear-gradient(135deg, #0F7F7F 0%, #16B3B3 100%)" }}
              >
                M
              </span>
              <span className={`hidden font-vl-heading text-lg font-extrabold tracking-[-0.04em] sm:inline ${effectiveVariant === "green" ? "text-white" : "text-[#222222]"}`}>MiniBrands</span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 shrink-0">
              <Link href="/products" className={navLinkClass("/products")}>
                Shop Catalog
              </Link>
              <Link href="/categories" className={navLinkClass("/categories")}>
                Categories
              </Link>
              <Link href="/stores" className={navLinkClass("/stores")}>
                Brands & Stores
              </Link>
            </nav>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex w-full basis-full md:mx-auto md:w-[320px] md:basis-auto lg:w-[380px] xl:w-[480px] 2xl:w-[580px]" role="search">
            <label htmlFor="global-search" className="sr-only">Search products, brands and categories</label>
            <div className="relative w-full">
              <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] transition-colors duration-200" />
              <input
                id="global-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search brands, products and styles…"
                className={`h-12 w-full rounded-3xl border-[1.5px] pl-11 pr-4 text-sm placeholder:text-[#9CA3AF] outline-none transition-all duration-200 focus:border-vl-primary focus:shadow-[0_0_0_4px_rgba(15,127,127,0.1)] ${effectiveVariant === "green" ? "border-white/20 bg-white text-vl-ink focus:bg-white" : "border-[#ECECEC] bg-[#F5F5F8] text-[#222222] focus:bg-white"}`}
              />
            </div>
          </form>

          <div className="flex items-center gap-2 md:gap-4">
            <button suppressHydrationWarning type="button" onClick={handleHeaderLocationClick} className={`hidden min-h-11 items-center gap-2 rounded-vl-control px-3 text-xs font-semibold transition xl:flex ${effectiveVariant === "green" ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-vl-muted hover:bg-vl-surface hover:text-vl-ink"}`} aria-label={`Delivery location: ${locationText}`}>
              <MapPin aria-hidden="true" className="h-4 w-4 text-vl-primary" />
              <span className="max-w-28 truncate">{locationText}</span>
            </button>
            <Link href={wishlistHref} className={`hidden min-h-11 min-w-11 items-center justify-center rounded-full transition-all duration-200 sm:inline-flex ${effectiveVariant === "green" ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-[#6B7280] hover:bg-vl-primary/8 hover:text-vl-primary"}`} aria-label="Wishlist">
              <Heart aria-hidden="true" className="h-5 w-5" />
            </Link>
            <Link href="/cart" className={`relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition-all duration-200 ${effectiveVariant === "green" ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-[#6B7280] hover:bg-vl-primary/8 hover:text-vl-primary"}`} aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}>
              <ShoppingBag aria-hidden="true" className="h-5 w-5" />
              {cartCount > 0 ? <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E53935] px-1 text-[10px] font-bold text-white">{cartCount}</span> : null}
            </Link>

            <div ref={accountRef} className="relative">
              <button suppressHydrationWarning type="button" onClick={() => setIsAccountOpen((open) => !open)} className={`inline-flex min-h-11 items-center gap-2 rounded-vl-control px-2 text-sm font-semibold transition sm:px-3 ${effectiveVariant === "green" ? "text-white hover:bg-white/10" : "text-vl-ink hover:bg-vl-surface"}`} aria-expanded={isAccountOpen} aria-haspopup="menu">
                {activeMode === "BUYER" ? (
                  userProfile?.user?.image ? (
                    <img src={userProfile.user.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-vl-secondary/10 font-vl-heading text-xs font-bold text-vl-secondary">{getInitials(displayName || "Account")}</span>
                  )
                ) : (
                  userProfile?.seller?.storeLogo ? (
                    <img src={userProfile.seller.storeLogo} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-vl-secondary/10 font-vl-heading text-xs font-bold text-vl-secondary">{getInitials(displayName || "Account")}</span>
                  )
                )}
                <span className="hidden max-w-20 truncate sm:inline">{displayName?.split(" ")[0] || "Account"}</span>
                <ChevronDown aria-hidden="true" className={`hidden h-4 w-4 text-vl-muted transition sm:block ${isAccountOpen ? "rotate-180" : ""}`} />
              </button>
              {isAccountOpen ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-vl-card border border-vl-border bg-vl-card p-2 shadow-vl-floating" role="menu">
                  <div className="border-b border-vl-border px-3 pb-3 pt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-vl-muted">{activeMode === "BUYER" ? "Your account" : "Managing store"}</p>
                    <p className="mt-1 truncate font-vl-heading text-sm font-bold text-vl-ink">{displayName || "Welcome to MiniBrands"}</p>
                    {userProfile?.user?.email ? <p className="mt-0.5 truncate text-xs text-vl-muted">{userProfile.user.email}</p> : null}
                  </div>
                  <div className="py-1">
                    {(activeMode === "BUYER" ? [[UserRound, "Profile", "/account/profile"], [Package, "Orders", "/account/orders"], [Heart, "Wishlist", "/account/wishlist"], [MapPin, "Addresses", "/account/addresses"]] : [[LayoutDashboard, "Seller dashboard", "/seller/dashboard"], [Store, "Store profile", "/seller/profile"], [Package, "Orders", "/seller/orders"], [RefreshCcw, "Returns & RMA", "/seller/returns"]]).map(([Icon, label, href]) => {
                      const MenuIcon = Icon as React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
                      return <Link key={href as string} href={href as string} onClick={() => setIsAccountOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-vl-muted transition hover:bg-vl-surface hover:text-vl-primary" role="menuitem"><MenuIcon aria-hidden={true} className="h-4 w-4" /><span>{label as string}</span></Link>;
                    })}
                  </div>
                  {userProfile?.seller ? <button suppressHydrationWarning type="button" onClick={() => handleRoleSwitch(activeMode === "BUYER" ? "SELLER" : "BUYER")} className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-vl-secondary/15 bg-vl-secondary/5 px-3 text-xs font-semibold text-vl-secondary transition hover:bg-vl-secondary/10"><ShieldCheck aria-hidden="true" className="h-4 w-4" />Switch to {activeMode === "BUYER" ? "seller" : "buyer"} mode</button> : null}
                  {userProfile ? <button suppressHydrationWarning type="button" onClick={handleSignOut} className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-vl-muted transition hover:bg-red-50 hover:text-vl-danger"><LogOut aria-hidden="true" className="h-4 w-4" />Sign out</button> : <Link href="/login?role=buyer" onClick={() => setIsAccountOpen(false)} className="mt-1 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-vl-primary hover:bg-vl-primary/5"><UserRound aria-hidden="true" className="h-4 w-4" />Sign in</Link>}
                </div>
              ) : null}
            </div>

            <div ref={moreRef} className="relative hidden lg:block">
              <button suppressHydrationWarning type="button" onClick={() => setIsMoreOpen((open) => !open)} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition ${effectiveVariant === "green" ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-vl-muted hover:bg-vl-surface hover:text-vl-ink"}`} aria-label="More options" aria-expanded={isMoreOpen}><MoreHorizontal aria-hidden="true" className="h-5 w-5" /></button>
              {isMoreOpen ? <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 rounded-vl-card border border-vl-border bg-vl-card p-2 shadow-vl-floating"><Link href={becomeSellerHref} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-vl-muted hover:bg-vl-surface hover:text-vl-primary"><Store aria-hidden="true" className="h-4 w-4" />Become a seller</Link></div> : null}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Shell */}
      <MobileNavigationShell
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
        variant={effectiveVariant}
      />
    </>
  );
}
