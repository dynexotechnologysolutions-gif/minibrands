"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface BottomNavigationItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  badgeCount?: number;
  showDot?: boolean;
}

export default function BottomNavigationItem({
  href,
  label,
  icon: Icon,
  isActive,
  badgeCount,
  showDot,
}: BottomNavigationItemProps) {
  return (
    <Link
      href={href}
      role="tab"
      aria-current={isActive ? "page" : undefined}
      aria-label={badgeCount ? `${label}, ${badgeCount} items` : label}
      className="relative flex flex-col items-center justify-center flex-1 h-12 select-none active:scale-95 transition-transform duration-150"
      style={{ minWidth: "48px", minHeight: "48px" }}
    >
      {/* Icon Wrapper with indicator */}
      <div className="relative flex items-center justify-center p-1 rounded-full transition-colors duration-200">
        <Icon
          className={`w-5 h-5 transition-transform duration-200 ${
            isActive
              ? "text-[#FF3E6C] scale-110 fill-[#FF3E6C]/10"
              : "text-[#6B7280]"
          }`}
        />
        
        {/* Dynamic Badge */}
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#FF3E6C] text-white text-[8px] font-extrabold border border-white shadow-sm leading-none animate-scale-in">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
        
        {/* Notification Dot */}
        {showDot && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#FF3E6C] border border-white shadow-sm" />
        )}
      </div>
      
      {/* Label */}
      <span
        className={`text-[9px] font-semibold tracking-wide transition-all duration-200 mt-0.5 max-w-[64px] truncate ${
          isActive ? "text-[#FF3E6C] font-bold" : "text-[#6B7280]"
        }`}
      >
        {label}
      </span>
      
      {/* Active Indicator Dot */}
      {isActive && (
        <span className="absolute bottom-0 w-1 h-1 rounded-full bg-[#FF3E6C] transition-all duration-300" />
      )}
    </Link>
  );
}
