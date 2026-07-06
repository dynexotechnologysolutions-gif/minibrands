"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  ShoppingBag, 
  RotateCcw, 
  Store, 
  ShieldCheck, 
  Star, 
  BarChart3, 
  Settings, 
  LogOut,
  UserCheck
} from "lucide-react";

interface SellerSidebarProps {
  storeName?: string;
  storeEmail?: string;
  isKycVerified?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function SellerSidebar({
  storeName = "Merchant Store",
  storeEmail = "seller@velvetlane.in",
  isKycVerified = true,
  isOpenMobile = false,
  onCloseMobile,
}: SellerSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Overview", href: "/seller/dashboard", icon: LayoutDashboard },
    { label: "Products", href: "/seller/products", icon: Package },
    { label: "Inventory", href: "/seller/inventory", icon: Boxes },
    { label: "Orders", href: "/seller/orders", icon: ShoppingBag },
    { label: "Returns & RMA", href: "/seller/returns", icon: RotateCcw },
    { label: "Store Profile", href: "/seller/profile", icon: Store },
    { label: "Verification", href: "/seller/verification", icon: ShieldCheck },
    { label: "Customer Reviews", href: "/seller/reviews", icon: Star },
    { label: "Analytics", href: "/seller/analytics", icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-[55] lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`flex flex-col h-screen fixed left-0 top-0 bg-surface border-r border-border-gray z-[60] transition-all duration-300 w-[260px] ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header Badge */}
        <div className="p-base lg:p-lg flex items-center justify-between border-b border-border-gray/40">
          <Link href="/seller/dashboard" className="flex items-center gap-sm overflow-hidden whitespace-nowrap">
            <div className="w-9 h-9 bg-primary rounded-lg flex-shrink-0 flex items-center justify-center text-on-primary shadow-sm">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-headline-sm text-headline-sm font-extrabold text-on-surface leading-tight tracking-tight">
                Seller Hub
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold flex items-center gap-1">
                {isKycVerified ? (
                  <>
                    <UserCheck className="w-3 h-3 text-success-green inline" />
                    Verified Merchant
                  </>
                ) : (
                  "Pending Onboarding"
                )}
              </p>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-text-muted hover:text-on-surface"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-base space-y-1 mt-md custom-scrollbar overflow-y-auto overflow-x-hidden">
          <div className="px-md py-xs text-[10px] uppercase font-bold text-text-muted tracking-widest">
            Merchant Operations
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== "/seller/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-md px-md py-sm rounded-lg transition-all text-body-sm font-medium ${
                  isActive
                    ? "bg-surface-container-low text-primary font-bold border-r-4 border-primary shadow-xs"
                    : "text-text-muted hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : "text-secondary"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Store Profile Card */}
        <div className="p-base border-t border-border-gray bg-surface-container-lowest">
          <div className="bg-surface-container-low p-sm rounded-xl flex items-center gap-sm overflow-hidden border border-border-gray/40">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center font-bold text-sm">
              {storeName.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="font-label-bold text-label-bold truncate text-on-surface">{storeName}</p>
              <p className="text-[11px] text-text-muted truncate">{storeEmail}</p>
            </div>
          </div>
          <Link
            href="/account"
            className="mt-sm w-full flex items-center justify-center gap-xs px-sm py-1.5 text-xs font-bold text-secondary hover:text-primary hover:bg-surface-container rounded-lg transition-colors border border-border-gray/50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch to Buyer Mode</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
