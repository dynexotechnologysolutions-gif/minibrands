"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Menu,
  ShieldCheck,
  Zap,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Activity,
} from "lucide-react";
import GlobalAdminSearch from "./GlobalAdminSearch";
import AdminNotificationCenter from "./AdminNotificationCenter";

interface AdminTopbarProps {
  userName?: string;
  userEmail?: string;
  role?: string;
  onOpenMobileSidebar?: () => void;
}

export default function AdminTopbar({
  userName = "Founder Admin",
  userEmail = "founder@velvetlane.in",
  role = "ADMIN",
  onOpenMobileSidebar,
}: AdminTopbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-[50] h-16 bg-surface/80 backdrop-blur-md border-b border-border-gray/60 px-4 lg:px-8 flex items-center justify-between transition-all">
        {/* Left Section: Mobile Toggle & Global Search Trigger */}
        <div className="flex items-center gap-3">
          {onOpenMobileSidebar && (
            <button
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 rounded-xl border border-border-gray/60 text-text-muted hover:text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Quick Command Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-border-gray/70 hover:border-primary/50 text-text-muted hover:text-on-surface transition-all shadow-xs w-64 lg:w-96"
          >
            <Search className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-medium text-text-muted truncate">
              Search sellers, buyers, orders, products, KYC...
            </span>
            <kbd className="hidden sm:inline-block ml-auto px-1.5 py-0.5 rounded bg-surface-container border border-border-gray text-[10px] font-mono text-text-muted font-semibold">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Section: Status Pills & Action Controls */}
        <div className="flex items-center gap-3">
          {/* Live Platform Health Indicator Pill */}
          <Link
            href="/admin/system-health"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-green/10 text-success-green border border-success-green/20 text-xs font-bold hover:bg-success-green/20 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-success-green animate-pulse" />
            <span>Systems Normal</span>
          </Link>

          {/* Quick Action: KYC Queue */}
          <Link
            href="/admin/kyc-queue"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-bold transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>KYC Queue</span>
          </Link>

          {/* Notifications Trigger */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 rounded-xl border border-border-gray/60 text-text-muted hover:text-on-surface hover:bg-surface-container-low transition-colors"
            title="Admin Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error-red ring-2 ring-surface" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-surface-container-low transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {userName.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-extrabold text-on-surface leading-tight">
                  {userName}
                </p>
                <p className="text-[10px] text-primary font-bold">{role}</p>
              </div>
            </button>

            {/* Profile Menu Drawer Popup */}
            {isProfileMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-surface border border-border-gray/70 rounded-2xl shadow-xl p-2 z-[60] animate-fade-in-up"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <div className="p-2 border-b border-border-gray/40">
                  <p className="font-bold text-xs text-on-surface">{userName}</p>
                  <p className="text-[11px] text-text-muted truncate">{userEmail}</p>
                </div>
                <div className="py-1 space-y-0.5">
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-text-muted hover:bg-surface-container-low hover:text-on-surface transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Platform Settings</span>
                  </Link>
                  <Link
                    href="/admin/audit"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-text-muted hover:bg-surface-container-low hover:text-on-surface transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Audit Trail</span>
                  </Link>
                  <Link
                    href="/account"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-text-muted hover:bg-surface-container-low hover:text-on-surface transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Buyer Mode</span>
                  </Link>
                </div>
                <div className="pt-1 border-t border-border-gray/40">
                  <Link
                    href="/account"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-error-red hover:bg-error-red/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      <GlobalAdminSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Notification Drawer Center */}
      <AdminNotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  );
}
