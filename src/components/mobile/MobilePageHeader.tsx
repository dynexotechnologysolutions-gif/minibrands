"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface MobilePageHeaderProps {
  title: string;
  showBackButton?: boolean;
  count?: number;
  rightElement?: React.ReactNode;
}

export default function MobilePageHeader({
  title,
  showBackButton = true,
  count,
  rightElement,
}: MobilePageHeaderProps) {
  const router = useRouter();

  return (
    <div className="w-full flex items-center justify-between h-16 bg-white border-b border-[#ECECEC]/80 px-4 pt-[calc(env(safe-area-inset-top)+4px)] shadow-sm md:hidden">
      <div className="flex items-center gap-2">
        {showBackButton && (
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-50 text-slate-700"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-baseline gap-1.5">
          <h1 className="font-vl-heading text-sm font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          {count !== undefined && count > 0 && (
            <span className="text-[10px] font-bold text-slate-400">
              ({count} {count === 1 ? "item" : "items"})
            </span>
          )}
        </div>
      </div>
      {rightElement && (
        <div className="flex items-center justify-center min-w-[36px]">
          {rightElement}
        </div>
      )}
    </div>
  );
}
