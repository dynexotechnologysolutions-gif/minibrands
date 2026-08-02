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
  Menu,
  MoreHorizontal,
  Package,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
  X,
  Bell,
  LayoutGrid,
} from "lucide-react";
import { switchActiveRole } from "@/actions/switch-role.action";
import { getDefaultAddress } from "@/actions/address-get-default.action";
import { getPreciseLocation } from "@/lib/geolocation";

interface UserProfileData {
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
}

export default function HomeHeader({ userProfile, cartCount, sellerHref }: HomeHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<"BUYER" | "SELLER">("BUYER");
  const [locationText, setLocationText] = useState("Select location");
  const [wishlistCount, setWishlistCount] = useState(0);
  const accountRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userProfile) {
      fetch("/api/wishlist")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.products)) {
            setWishlistCount(data.products.length);
          }
        })
        .catch((err) => console.error("Error loading wishlist count:", err));
    }
  }, [userProfile]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(href + "/");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setIsAccountOpen(false);
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
          setLocationText(text);
          return;
        }
      }
    } catch (error) {
      console.error(error);
    }

    if (userProfile) {
      getDefaultAddress()
        .then((res) => {
          if (res.success && res.data) {
            const area = res.data.line2 || res.data.line1;
            setLocationText(area ? `${area.split(",")[0].trim()}, ${res.data.city}` : res.data.city);
          }
        })
        .catch((error) => console.error("Failed to fetch default address:", error));
    }
  }, [userProfile]);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )active_role_mode=([^;]*)/);
    setActiveMode(match?.[1] === "SELLER" && userProfile?.seller ? "SELLER" : "BUYER");
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
    } catch (error: any) {
      console.error("GPS detection failed:", error);
      setLocationText(error.message?.toLowerCase().includes("permission") ? "Select location" : "Unable to detect location");
      alert(error.message || "Failed to detect location.");
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
  const accountHref = userProfile ? "/account/profile" : "/login?role=buyer";
  const wishlistHref = userProfile ? "/wishlist" : "/login?role=buyer";
  const getInitials = (name: string) => name ? name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2) : "U";
  const displayName = activeMode === "BUYER" ? userProfile?.user?.name : userProfile?.seller?.storeName || userProfile?.seller?.businessName;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#ECECEC]/80 bg-white/92 shadow-[0_1px_16px_rgba(17,24,39,0.05)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="MiniBrands home">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-vl-heading text-lg font-extrabold text-white shadow-md transition-all duration-200 group-hover:scale-105 group-hover:rotate-3"
            style={{ background: "linear-gradient(135deg, #6C3BFF 0%, #FF4D8D 100%)" }}
          >
            M
          </span>
          <span className="hidden font-vl-heading text-lg font-extrabold tracking-[-0.04em] text-[#111827] sm:inline">MiniBrands</span>
        </Link>

        <form onSubmit={handleSearchSubmit} className="order-3 flex w-full basis-full md:order-none md:mx-auto md:w-[580px] md:basis-auto lg:w-[680px]" role="search">
          <label htmlFor="global-search" className="sr-only">Search products, brands and categories</label>
          <div className="relative w-full">
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] transition-colors duration-200" />
            <input
              id="global-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search brands, products and styles…"
              className="h-12 w-full rounded-3xl border-[1.5px] border-[#ECECEC] bg-[#F5F5F8] pl-11 pr-4 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all duration-200 focus:border-[#6C3BFF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(108,59,255,0.10)]"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 md:gap-4">
          <button suppressHydrationWarning type="button" onClick={handleHeaderLocationClick} className="hidden min-h-11 items-center gap-2 rounded-vl-control px-3 text-xs font-semibold text-vl-muted transition hover:bg-vl-surface hover:text-vl-ink xl:flex" aria-label={`Delivery location: ${locationText}`}>
            <MapPin aria-hidden="true" className="h-4 w-4 text-vl-primary" />
            <span className="max-w-28 truncate">{locationText}</span>
          </button>
          <Link href={wishlistHref} className="hidden min-h-11 min-w-11 items-center justify-center rounded-full text-[#6B7280] transition-all duration-200 hover:bg-[#FF4D8D]/8 hover:text-[#FF4D8D] sm:inline-flex" aria-label="Wishlist">
            <Heart aria-hidden="true" className="h-5 w-5" />
          </Link>
          <Link href="/cart" className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#6B7280] transition-all duration-200 hover:bg-[#6C3BFF]/8 hover:text-[#6C3BFF]" aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}>
            <ShoppingBag aria-hidden="true" className="h-5 w-5" />
            {cartCount > 0 ? <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4D8D] px-1 text-[10px] font-bold text-white">{cartCount}</span> : null}
          </Link>

          <div ref={accountRef} className="relative">
            <button suppressHydrationWarning type="button" onClick={() => setIsAccountOpen((open) => !open)} className="inline-flex min-h-11 items-center gap-2 rounded-vl-control px-2 text-sm font-semibold text-vl-ink transition hover:bg-vl-surface sm:px-3" aria-expanded={isAccountOpen} aria-haspopup="menu">
              {userProfile?.user?.image && activeMode === "BUYER" ? <img src={userProfile.user.image} alt="" className="h-7 w-7 rounded-full object-cover" /> : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-vl-secondary/10 font-vl-heading text-xs font-bold text-vl-secondary">{getInitials(displayName || "Account")}</span>}
              <span className="hidden max-w-36 truncate sm:inline">{displayName || "Account"}</span>
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
            <button suppressHydrationWarning type="button" onClick={() => setIsMoreOpen((open) => !open)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-vl-muted transition hover:bg-vl-surface hover:text-vl-ink" aria-label="More options" aria-expanded={isMoreOpen}><MoreHorizontal aria-hidden="true" className="h-5 w-5" /></button>
            {isMoreOpen ? <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 rounded-vl-card border border-vl-border bg-vl-card p-2 shadow-vl-floating"><Link href={becomeSellerHref} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-vl-muted hover:bg-vl-surface hover:text-vl-primary"><Store aria-hidden="true" className="h-4 w-4" />Become a seller</Link></div> : null}
          </div>
          <button suppressHydrationWarning type="button" onClick={() => setIsMobileMenuOpen((open) => !open)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-vl-muted transition hover:bg-vl-surface hover:text-vl-primary md:hidden" aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={isMobileMenuOpen}>{isMobileMenuOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}</button>
        </div>
      </div>

      {isMobileMenuOpen ? <div className="border-t border-vl-border bg-white px-4 py-3 shadow-vl-soft md:hidden"><button suppressHydrationWarning type="button" onClick={handleHeaderLocationClick} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold text-vl-muted hover:bg-vl-surface"><MapPin aria-hidden="true" className="h-4 w-4 text-vl-primary" />{locationText}</button><Link href={becomeSellerHref} onClick={() => setIsMobileMenuOpen(false)} className="mt-1 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-vl-muted hover:bg-vl-surface"><Store aria-hidden="true" className="h-4 w-4 text-vl-secondary" />Become a seller</Link></div> : null}

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-vl-card border border-vl-border bg-white/95 p-1.5 shadow-vl-floating backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        {[["/", "Home", Store], ["/products", "Shop", ShoppingBag], [wishlistHref, "Wishlist", Heart], [accountHref, "Account", UserRound]].map(([href, label, Icon]) => { const NavIcon = Icon as React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; return <Link key={label as string} href={href as string} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold text-vl-muted transition hover:bg-vl-surface hover:text-vl-primary"><NavIcon aria-hidden={true} className="h-4 w-4" /><span>{label as string}</span></Link>; })}
      </nav>
    </header>
  );
}
