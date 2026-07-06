"use client";

import React from "react";
import { 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  RotateCcw 
} from "lucide-react";

export interface KpiData {
  totalItems: number;
  healthyStock: number;
  lowStock: number;
  outOfStock: number;
  totalOrders?: number;
  totalRevenue?: number; // in paise or rupees
  activeReturns?: number;
}

interface SellerKpiGridProps {
  data: KpiData;
  onFilterSelect?: (filter: "ALL" | "LOW" | "OUT") => void;
  activeFilter?: string;
}

export default function SellerKpiGrid({ data, onFilterSelect, activeFilter = "ALL" }: SellerKpiGridProps) {
  const healthyPercent = data.totalItems > 0 
    ? ((data.healthyStock / data.totalItems) * 100).toFixed(1) 
    : "100";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-base">
      {/* 1. Total Items */}
      <div 
        onClick={() => onFilterSelect && onFilterSelect("ALL")}
        className={`bg-surface-container-lowest border p-base rounded-xl shadow-xs transition-all cursor-pointer ${
          activeFilter === "ALL" ? "border-primary ring-2 ring-primary/10" : "border-border-gray hover:border-primary/50"
        }`}
      >
        <div className="flex justify-between items-start mb-sm">
          <span className="text-text-muted font-label-bold text-label-bold">Total Inventory Items</span>
          <Package className="w-5 h-5 text-primary" />
        </div>
        <div className="font-headline-lg text-2xl md:text-headline-lg font-black text-on-surface">
          {data.totalItems.toLocaleString()}
        </div>
        <div className="text-body-sm text-success-green mt-xs flex items-center gap-xs font-semibold">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Active listings ready</span>
        </div>
      </div>

      {/* 2. Healthy Stock */}
      <div className="bg-surface-container-lowest border border-border-gray p-base rounded-xl shadow-xs">
        <div className="flex justify-between items-start mb-sm">
          <span className="text-text-muted font-label-bold text-label-bold">Healthy Stock</span>
          <CheckCircle2 className="w-5 h-5 text-success-green" />
        </div>
        <div className="font-headline-lg text-2xl md:text-headline-lg font-black text-on-surface">
          {data.healthyStock.toLocaleString()}
        </div>
        <div className="text-body-sm text-text-muted mt-xs">
          {healthyPercent}% of catalog
        </div>
      </div>

      {/* 3. Low Stock */}
      <div 
        onClick={() => onFilterSelect && onFilterSelect("LOW")}
        className={`bg-surface-container-lowest border p-base rounded-xl shadow-xs border-l-4 border-l-accent-yellow transition-all cursor-pointer ${
          activeFilter === "LOW" ? "border-accent-yellow ring-2 ring-accent-yellow/20" : "border-border-gray hover:border-accent-yellow"
        }`}
      >
        <div className="flex justify-between items-start mb-sm">
          <span className="text-text-muted font-label-bold text-label-bold">Low Stock (&le; 10)</span>
          <AlertTriangle className="w-5 h-5 text-accent-yellow" />
        </div>
        <div className="font-headline-lg text-2xl md:text-headline-lg font-black text-on-surface">
          {data.lowStock.toLocaleString()}
        </div>
        <div className="text-body-sm text-accent-yellow mt-xs font-bold flex items-center gap-xs">
          <span>Action Required</span>
        </div>
      </div>

      {/* 4. Out of Stock */}
      <div 
        onClick={() => onFilterSelect && onFilterSelect("OUT")}
        className={`bg-surface-container-lowest border p-base rounded-xl shadow-xs border-l-4 border-l-error-red transition-all cursor-pointer ${
          activeFilter === "OUT" ? "border-error-red ring-2 ring-error-red/20" : "border-border-gray hover:border-error-red"
        }`}
      >
        <div className="flex justify-between items-start mb-sm">
          <span className="text-text-muted font-label-bold text-label-bold">Out of Stock</span>
          <XCircle className="w-5 h-5 text-error-red" />
        </div>
        <div className="font-headline-lg text-2xl md:text-headline-lg font-black text-on-surface">
          {data.outOfStock.toLocaleString()}
        </div>
        <div className="text-body-sm text-error-red mt-xs font-bold flex items-center gap-xs">
          <span>Urgent Restock</span>
        </div>
      </div>
    </div>
  );
}
