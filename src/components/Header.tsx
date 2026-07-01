"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShoppingBag, 
  Store, 
  User, 
  LogOut, 
  ChevronDown, 
  Menu, 
  X, 
  ClipboardList, 
  ShoppingCart,
  LayoutDashboard,
  Heart
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

import { switchActiveRole } from "@/actions/switch-role.action";

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

interface HeaderProps {
  userProfile?: UserProfileData | null;
  sellerHref: string;
}

export default function Header({ userProfile, sellerHref }: HeaderProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeMode, setActiveMode] = useState<"BUYER" | "SELLER">("BUYER");

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
        setIsDropdownOpen(false);
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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
      router.refresh();
      router.push("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // Get user's initial letters for avatar
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
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200/40 bg-white/75 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="group flex items-center gap-2">
              <span className="font-display font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
                Velvet Lane
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/products" 
              className="text-slate-600 hover:text-indigo-600 font-medium text-sm transition-colors flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shop Catalog</span>
            </Link>
          </nav>

          {/* Desktop Auth Actions & User Profile */}
          <div className="hidden md:flex items-center gap-4">
            {userProfile ? (
              /* Authenticated User Menu */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white/50 hover:bg-white text-slate-700 text-sm font-semibold transition-all shadow-sm cursor-pointer"
                >
                  {activeMode === "BUYER" ? (
                    userProfile.user.image ? (
                      <img src={userProfile.user.image} alt={userProfile.user.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {getInitials(userProfile.user.name)}
                      </div>
                    )
                  ) : (
                    userProfile.seller?.storeLogo ? (
                      <img src={userProfile.seller.storeLogo} alt={userProfile.seller.storeName || userProfile.seller.businessName} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {getInitials(userProfile.seller?.storeName || userProfile.seller?.businessName || "Store")}
                      </div>
                    )
                  )}
                  <span className="max-w-[120px] truncate">
                    {activeMode === "BUYER"
                      ? userProfile.user.name.split(" ")[0]
                      : (userProfile.seller?.storeName || userProfile.seller?.businessName || "Store").split(" ")[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/60 bg-white p-2 shadow-xl animate-fade-in-up z-50">
                    <div className="px-3 py-2.5 mb-1.5">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {activeMode === "BUYER" ? "Signed In As" : "Managing Store"}
                      </p>
                      <p className="text-sm font-bold text-slate-800 truncate mt-0.5">
                        {activeMode === "BUYER"
                          ? userProfile.user.name
                          : (userProfile.seller?.storeName || userProfile.seller?.businessName)}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{userProfile.user.email}</p>
                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700">
                        {activeMode === "SELLER" ? "Seller Partner" : "Buyer Account"}
                      </span>
                    </div>

                    <div className="border-t border-slate-100 my-1"></div>

                    {/* Role-Specific Links */}
                    {activeMode === "BUYER" ? (
                      <>
                        <Link
                          href="/account/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          href="/account/orders"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                        >
                          <ClipboardList className="w-4 h-4 text-slate-400" />
                          <span>My Orders</span>
                        </Link>
                        <Link
                          href="/account/wishlist"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                        >
                          <Heart className="w-4 h-4 text-slate-400" />
                          <span>My Wishlist</span>
                        </Link>
                        <Link
                          href="/account/addresses"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                        >
                          <ShoppingCart className="w-4 h-4 text-slate-400" />
                          <span>Saved Addresses</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/seller/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-purple-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          <span>Seller Dashboard</span>
                        </Link>
                        <Link
                          href="/seller/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-purple-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Store Profile</span>
                        </Link>
                        <Link
                          href="/seller/products"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-purple-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                        >
                          <ShoppingBag className="w-4 h-4 text-slate-400" />
                          <span>Products</span>
                        </Link>
                      </>
                    )}

                    {/* Role Switcher Action */}
                    {userProfile.seller && (
                      <>
                        <div className="border-t border-slate-100 my-1"></div>
                        <div className="px-3 py-1">
                          <button
                            type="button"
                            onClick={() => handleRoleSwitch(activeMode === "BUYER" ? "SELLER" : "BUYER")}
                            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-center text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer"
                          >
                            <span>Switch to {activeMode === "BUYER" ? "Seller Mode" : "Buyer Mode"}</span>
                          </button>
                        </div>
                      </>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold text-left transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-slate-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Unauthenticated CTAs */
              <>
                <Link
                  href="/login?role=buyer"
                  className="text-slate-600 hover:text-indigo-600 font-semibold text-sm px-3 py-2 transition-colors"
                >
                  Buyer Sign In
                </Link>
                <Link
                  href="/login?role=buyer"
                  className="border border-indigo-100 hover:bg-indigo-50 text-indigo-700 font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-sm"
                >
                  Buyer Sign Up
                </Link>
                <Link
                  href={sellerHref}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-xl text-sm shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Store className="w-4 h-4" />
                  <span>Seller Portal</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 focus:outline-none transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/40 bg-white/95 backdrop-blur-lg animate-fade-in-up px-4 pt-2 pb-6 space-y-4 shadow-inner">
          <div className="flex flex-col gap-2">
            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              <span>Shop Catalog</span>
            </Link>
          </div>

          <div className="border-t border-slate-100 my-2"></div>

          {userProfile ? (
            /* Mobile Authenticated Options */
            <div className="space-y-4">
              <div className="px-2.5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Signed In As</p>
                <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{userProfile.user.name}</p>
                <p className="text-xs text-slate-500 truncate">{userProfile.user.email}</p>
              </div>

              <div className="flex flex-col gap-1">
                {userProfile.role === "BUYER" ? (
                  <>
                    <Link
                      href="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                    >
                      <ClipboardList className="w-4 h-4 text-slate-400" />
                      <span>My Orders</span>
                    </Link>
                    <Link
                      href="/cart"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                    >
                      <ShoppingCart className="w-4 h-4 text-slate-400" />
                      <span>My Shopping Cart</span>
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                    >
                      <Heart className="w-4 h-4 text-slate-400" />
                      <span>My Wishlist</span>
                    </Link>
                  </>
                ) : (
                  <Link
                    href={sellerHref}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                    <span>Seller Dashboard</span>
                  </Link>
                )}

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold text-left transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-slate-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Mobile Unauthenticated Options */
            <div className="flex flex-col gap-3">
              <Link
                href="/login?role=buyer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all"
              >
                Buyer Sign In
              </Link>
              <Link
                href="/login?role=buyer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-semibold text-sm transition-all"
              >
                Buyer Sign Up
              </Link>
              <Link
                href={sellerHref}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-sm transition-all"
              >
                <Store className="w-4 h-4" />
                <span>Seller Portal</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
