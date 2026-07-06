"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Menu, 
  Search, 
  Plus, 
  Bell, 
  HelpCircle, 
  Sparkles,
  ExternalLink
} from "lucide-react";

interface SellerTopbarProps {
  onToggleMobileSidebar: () => void;
  sellerId?: string;
  unreadNotifications?: number;
}

export default function SellerTopbar({
  onToggleMobileSidebar,
  sellerId,
  unreadNotifications = 2,
}: SellerTopbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/seller/inventory?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="flex justify-between items-center w-full px-base md:px-lg h-16 sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-border-gray shadow-xs">
      <div className="flex items-center gap-base md:gap-lg flex-1">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-surface-container-low text-on-surface transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, SKUs, inventory..."
            className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low border border-border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-body-md text-body-md text-on-surface transition-all placeholder:text-text-muted"
          />
        </form>
      </div>

      <div className="flex items-center gap-xs md:gap-base ml-base">
        {/* Public Storefront Link */}
        {sellerId && (
          <Link
            href={`/sellers/${sellerId}`}
            target="_blank"
            className="hidden sm:flex items-center gap-xs px-md py-1.5 border border-border-gray rounded-lg text-body-sm font-bold text-secondary hover:bg-surface-container-low transition-colors"
            title="View Public Storefront"
          >
            <span>Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}

        {/* Notification Bell Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors text-on-surface relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-secondary" />
            {unreadNotifications > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error-red rounded-full ring-2 ring-surface" />
            )}
          </button>

          {/* Notification Popup Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-border-gray rounded-xl shadow-xl z-50 p-base space-y-sm">
              <div className="flex justify-between items-center border-b border-border-gray pb-xs">
                <span className="font-label-bold text-label-bold text-on-surface">Merchant Alerts</span>
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                  {unreadNotifications} New
                </span>
              </div>
              <div className="space-y-sm text-body-sm">
                <div className="p-xs bg-accent-yellow/10 border-l-2 border-accent-yellow rounded text-xs text-on-surface">
                  <p className="font-bold">Low Stock Warning</p>
                  <p className="text-text-muted text-[11px]">3 items have dropped below reorder threshold.</p>
                </div>
                <div className="p-xs bg-success-green/10 border-l-2 border-success-green rounded text-xs text-on-surface">
                  <p className="font-bold">New Return Request</p>
                  <p className="text-text-muted text-[11px]">Order #6744d8 requires inspection.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-border-gray mx-1 hidden sm:block" />

        {/* Primary CTA: Add Product */}
        <Link
          href="/seller/products/new"
          className="px-3 md:px-base py-2 bg-primary text-on-primary font-label-bold text-xs md:text-label-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-xs whitespace-nowrap shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>
    </header>
  );
}
