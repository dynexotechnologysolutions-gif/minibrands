"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Users,
  Package,
  ShieldCheck,
  RotateCcw,
  DollarSign,
  Star,
  BarChart3,
  Bell,
  Settings,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface AdminSidebarProps {
  userName?: string;
  userEmail?: string;
  role?: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function AdminSidebar({
  userName = "Founder Admin",
  userEmail = "founder@velvetlane.in",
  role = "ADMIN",
  isOpenMobile = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const mainNavItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "KYC Queue", href: "/admin/kyc-queue", icon: ShieldCheck, badge: "Review" },
    { label: "Sellers", href: "/admin/sellers", icon: Store },
    { label: "Buyers", href: "/admin/buyers", icon: Users },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { label: "Returns", href: "/admin/returns", icon: RotateCcw },
    { label: "Refunds", href: "/admin/refunds", icon: DollarSign },
  ];

  const secondaryNavItems = [
    { label: "Finance & Escrow", href: "/admin/finance", icon: DollarSign },
    { label: "Reviews", href: "/admin/reviews", icon: Star },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Notifications", href: "/admin/notifications", icon: Bell },
    { label: "Platform Settings", href: "/admin/settings", icon: Settings },
    { label: "Audit Logs", href: "/admin/audit", icon: FileText },
    { label: "System Health", href: "/admin/system-health", icon: Activity },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-surface border-r border-border-gray/70 z-[80] transition-all duration-300 flex flex-col shadow-sm ${
          isCollapsed ? "w-[80px]" : "w-[260px]"
        } ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-border-gray/50 flex items-center justify-between bg-surface-container-lowest h-16">
          <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-indigo-600 to-black text-white flex items-center justify-center font-extrabold shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="font-display font-extrabold text-base text-on-surface leading-tight tracking-tight truncate">
                  Founder Hub
                </h1>
                <p className="text-[10px] uppercase font-bold tracking-widest text-primary flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-primary" />
                  {role} Portal
                </p>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-text-muted hover:text-on-surface hover:bg-surface-container-low transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {/* Main Core Section */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase text-text-muted tracking-widest mb-2">
                Core Marketplace
              </p>
            )}
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                      isActive
                        ? "bg-primary/10 text-primary font-bold shadow-xs border border-primary/20"
                        : "text-text-muted hover:bg-surface-container-low hover:text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? "text-primary" : "text-secondary"
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isCollapsed && item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-error-red/10 text-error-red border border-error-red/20">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Platform Management Section */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase text-text-muted tracking-widest mb-2">
                Management & System
              </p>
            )}
            <nav className="space-y-1">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                      isActive
                        ? "bg-primary/10 text-primary font-bold shadow-xs border border-primary/20"
                        : "text-text-muted hover:bg-surface-container-low hover:text-on-surface"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? "text-primary" : "text-secondary"
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer Admin User Badge */}
        <div className="p-3 border-t border-border-gray/50 bg-surface-container-lowest">
          <div className="bg-surface-container-low p-2.5 rounded-xl flex items-center gap-3 border border-border-gray/40">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary font-bold flex items-center justify-center text-xs flex-shrink-0">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden flex-1">
                <p className="font-bold text-xs text-on-surface truncate leading-tight">
                  {userName}
                </p>
                <p className="text-[10px] text-text-muted truncate">{userEmail}</p>
              </div>
            )}
          </div>
          <Link
            href="/account"
            className="mt-2 w-full flex items-center justify-center gap-2 py-1.5 text-xs font-bold text-secondary hover:text-primary hover:bg-surface-container rounded-lg transition-colors border border-border-gray/50"
          >
            <LogOut className="w-3.5 h-3.5" />
            {!isCollapsed && <span>Switch View</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
