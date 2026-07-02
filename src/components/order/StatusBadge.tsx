"use client";

import React from "react";

type OrderStatusValue =
  | "created"
  | "paid"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_CONFIG: Record<
  OrderStatusValue,
  { label: string; bgColor: string; textColor: string; borderColor: string; icon: string }
> = {
  created: {
    label: "Awaiting Payment",
    bgColor: "bg-slate-50",
    textColor: "text-slate-600",
    borderColor: "border-slate-200",
    icon: "hourglass_empty",
  },
  paid: {
    label: "Payment Confirmed",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-100",
    icon: "payments",
  },
  confirmed: {
    label: "Order Confirmed",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-100",
    icon: "check_circle",
  },
  shipped: {
    label: "Shipped",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-100",
    icon: "local_shipping",
  },
  delivered: {
    label: "Delivered",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-100",
    icon: "inventory_2",
  },
  completed: {
    label: "Completed",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-800",
    borderColor: "border-emerald-200",
    icon: "task_alt",
  },
  cancelled: {
    label: "Cancelled",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-100",
    icon: "cancel",
  },
  disputed: {
    label: "Returned",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-100",
    icon: "undo",
  },
};

/**
 * Maps OrderStatus to a styled pill badge with icon.
 * Handles unknown statuses gracefully with a neutral style.
 */
export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config =
    STATUS_CONFIG[status as OrderStatusValue] ?? {
      label: status,
      bgColor: "bg-slate-50",
      textColor: "text-slate-600",
      borderColor: "border-slate-200",
      icon: "circle",
    };

  return (
    <span
      className={`inline-flex items-center gap-xs px-sm py-1 rounded-full border font-label-bold text-[11px] leading-none ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
        {config.icon}
      </span>
      {config.label}
    </span>
  );
}
