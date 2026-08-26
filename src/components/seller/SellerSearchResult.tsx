"use client";

import React from "react";
import Image from "next/image";
import {
  Package,
  ShoppingBag,
  RotateCcw,
  Package2,
  ChevronRight,
} from "lucide-react";

interface SellerSearchResultProps {
  result: {
    id: string;
    type: 'product' | 'order' | 'return' | 'inventory';
    title: string;
    subtitle: string;
    href: string;
    badge?: string;
    image?: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

const typeIcons = {
  product: Package,
  order: ShoppingBag,
  return: RotateCcw,
  inventory: Package2,
};

const typeLabels = {
  product: "Product",
  order: "Order",
  return: "Return",
  inventory: "Inventory",
};

const badgeColors = {
  "Out of Stock": "bg-red-100 text-red-700 border-red-200",
  "Low Stock": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Delivered": "bg-green-100 text-green-700 border-green-200",
  "Shipped": "bg-blue-100 text-blue-700 border-blue-200",
  "Paid": "bg-green-100 text-green-700 border-green-200",
  "Pending": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Approved": "bg-green-100 text-green-700 border-green-200",
  "Rejected": "bg-red-100 text-red-700 border-red-200",
  "Pending": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Out of Stock": "bg-red-100 text-red-700 border-red-200",
  "Low Stock": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "In Stock": "bg-green-100 text-green-700 border-green-200",
};

export default function SellerSearchResult({ result, isSelected, onClick }: SellerSearchResultProps) {
  const Icon = typeIcons[result.type];
  const badgeColor = badgeColors[result.badge || ""] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-left ${
        isSelected
          ? "bg-primary/10 border-l-4 border-primary"
          : "hover:bg-vl-surface hover:border-vl-primary/30 border-l-4 border-transparent"
      }`}
      role="option"
      aria-selected={isSelected}
      tabIndex={-1}
    >
      {/* Image/Icon */}
      <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-vl-surface flex items-center justify-center">
        {result.image ? (
          <Image
            src={result.image}
            alt={result.title}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 text-vl-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {result.type === "product" && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              )}
              {result.type === "order" && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2v-5" />
              )}
              {result.type === "return" && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              )}
              {result.type === "inventory" && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              )}
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-vl-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-vl-ink truncate">{result.title}</h3>
            <p className="text-xs text-vl-muted truncate mt-0.5">{result.subtitle}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {result.badge && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColors[result.badge] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                {result.badge}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-vl-muted flex-shrink-0" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-vl-primary/10 text-vl-primary text-[10px] font-semibold">
            <Package className="w-3 h-3" />
            {typeLabels[result.type]}
          </span>
        </div>
      </div>
    </button>
  );
}