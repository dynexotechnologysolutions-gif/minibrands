"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Lock, Menu, ShoppingBag, Bell, Heart, Mic, Maximize, Sofa, Utensils, Flower2, GlassWater, Sparkles, HeartPulse, Gamepad, Tv, MoreHorizontal } from "lucide-react";
import MobileSearchHeader from "./MobileSearchHeader";
import MobilePageHeader from "./MobilePageHeader";
import { useWishlist } from "@/features/catalog/hooks/useWishlist";
import { UserProfileData } from "@/components/home/HomeHeader";

interface MobileHeaderProps {
  userProfile?: UserProfileData | null;
  cartCount: number;
}

const CATEGORY_ICONS = [
  { label: "Home Decor", icon: Sofa,          href: "/products?category=home_decor" },
  { label: "Kitchen",   icon: Utensils,       href: "/products?category=kitchen" },
  { label: "Spiritual", icon: Flower2,         href: "/products?category=spiritual" },
  { label: "Bottles",   icon: GlassWater,      href: "/products?category=bottles" },
  { label: "Beauty",    icon: Sparkles,        href: "/products?category=beauty" },
  { label: "Wellness",  icon: HeartPulse,      href: "/products?category=wellness" },
  { label: "Toys",      icon: Gamepad,         href: "/products?category=toys" },
  { label: "Electronics", icon: Tv,            href: "/products?category=electronics" },
  { label: "More",      icon: MoreHorizontal,  href: "/products" },
];

export default function MobileHeader({ userProfile, cartCount }: MobileHeaderProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { wishlist = [] } = useWishlist();
  const [activeMode, setActiveMode] = useState<"BUYER" | "SELLER">("BUYER");

  useEffect(() => {
    const match      = document.cookie.match(/(?:^|; )active_role_mode=([^;]*)/);
    const cookieVal  = match ? match[1] : null;
    const resolved   = cookieVal === "SELLER" && userProfile?.seller ? "SELLER" : "BUYER";
    const t = setTimeout(() => setActiveMode(resolved), 0);
    return () => clearTimeout(t);
  }, [userProfile]);

  const getInitials = (name: string) =>
    name
      ? name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
      : "U";

  const displayName =
    activeMode === "BUYER"
      ? userProfile?.user?.name || "User"
      : userProfile?.seller?.storeName || userProfile?.seller?.businessName || "Store";

  const isHome         = pathname === "/";
  const isExplore      = pathname === "/products";
  const isExploreQuery = pathname.startsWith("/products") && !pathname.startsWith("/products/");
  const isWishlist     = pathname === "/account/wishlist" || pathname === "/wishlist";
  const isCart         = pathname === "/cart";
  const isAccount      = pathname === "/account/profile";
  const isCheckout     = pathname === "/checkout";

  /* ─── 1. HOME HEADER ─────────────────────────────────────── */
  if (isHome) {
    const avatarUrl = activeMode === "BUYER" ? userProfile?.user?.image : userProfile?.seller?.storeLogo;
    const avatar = avatarUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
    ) : (
      <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center font-vl-heading text-[9px] font-bold text-white">
        {getInitials(displayName)}
      </div>
    );

    return (
      <div className="w-full flex flex-col bg-[#0F7F7F] border-b border-[#0A5C5C]/20 px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-0 shadow-sm md:hidden">

        {/* Top row */}
        <div className="w-full flex items-center justify-between h-10">
          <div className="flex items-center gap-3">
            <button className="text-white hover:opacity-85 active:scale-95 transition-transform" aria-label="Menu">
              <Menu className="w-5.5 h-5.5" />
            </button>
            <Link href="/" className="flex items-center gap-2" aria-label="MiniBrands Home">
              <ShoppingBag className="w-5.5 h-5.5 text-white shrink-0" />
              <div className="flex flex-col">
                <span className="font-vl-heading text-[15px] font-extrabold tracking-tight text-white leading-none">MiniBrands</span>
                <span className="text-[7.5px] font-semibold text-white/75 tracking-wide mt-0.5 whitespace-nowrap">Many Stores. One Trusted Place.</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3.5">
            <Link href="/wishlist" className="relative text-white hover:opacity-85" aria-label="Wishlist">
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E53935] px-1 text-[8px] font-bold text-white border border-[#0F7F7F]">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <button className="relative text-white hover:opacity-85 cursor-pointer" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E53935] px-1 text-[8px] font-bold text-white border border-[#0F7F7F]">3</span>
            </button>
            <Link href="/cart" className="relative text-white hover:opacity-85" aria-label="Cart">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E53935] px-1 text-[8px] font-bold text-white border border-[#0F7F7F]">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href={userProfile ? "/account/profile" : "/login?role=buyer"}
              className="flex items-center justify-center w-7 h-7 rounded-full overflow-hidden border border-white/20 shrink-0"
              aria-label="Profile"
            >
              {avatar}
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <div className="w-full mt-3">
          <div
            onClick={() => router.push("/products")}
            className="w-full relative flex items-center h-10 px-3.5 bg-white rounded-xl text-slate-400 cursor-pointer shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.03)]"
          >
            <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
            <span className="text-[11.5px] text-slate-400 flex-grow font-medium">Search products, brands or stores...</span>
            <div className="flex items-center gap-2.5 text-slate-400 shrink-0">
              <Mic className="w-4 h-4" />
              <Maximize className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Category icon ribbon — bare icons, no circle bg */}
        <div className="flex overflow-x-auto gap-5 hide-scrollbar py-2.5 scroll-smooth">
          {CATEGORY_ICONS.map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-[3px] shrink-0 select-none active:scale-95 transition-transform"
            >
              <Icon className="w-[18px] h-[18px] text-white stroke-[1.5]" />
              <span className="text-[8.5px] font-semibold text-white/80 whitespace-nowrap leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  /* ─── 2. EXPLORE / SEARCH ───────────────────────────────── */
  if (isExplore || isExploreQuery) return <MobileSearchHeader />;

  /* ─── 3. CHECKOUT ───────────────────────────────────────── */
  if (isCheckout) return (
    <MobilePageHeader title="Secure Checkout" showBackButton={false} rightElement={<Lock className="w-4 h-4 text-[#2E7D32]" />} />
  );

  /* ─── 4. CART ───────────────────────────────────────────── */
  if (isCart) return (
    <MobilePageHeader
      title="My Cart"
      showBackButton={true}
      rightElement={
        <Link href="/products" className="text-xs font-semibold text-vl-primary">Continue shopping</Link>
      }
    />
  );

  /* ─── 5. ACCOUNT ────────────────────────────────────────── */
  if (isAccount) return <MobilePageHeader title="My Account" showBackButton={false} />;

  /* ─── 6. WISHLIST ───────────────────────────────────────── */
  if (isWishlist) return <MobilePageHeader title="Wishlist" showBackButton={true} />;

  /* ─── DEFAULT ───────────────────────────────────────────── */
  return <MobilePageHeader title="" showBackButton={true} />;
}
