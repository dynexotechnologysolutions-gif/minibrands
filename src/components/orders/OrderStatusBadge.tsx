import React from "react";

interface OrderStatusBadgeProps {
  status: string;
  orderStatus?: string | null;
  date?: string | Date | null;
}

export default function OrderStatusBadge({ status, orderStatus, date }: OrderStatusBadgeProps) {
  const currentStatus = (orderStatus || status || "").toLowerCase();

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  // Delivered/Completed
  if (currentStatus === "delivered" || currentStatus === "completed") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-[0_1px_2px_rgba(16,185,129,0.05)]">
        <span className="material-symbols-outlined text-[15px] font-bold">check_circle</span>
        <span>Delivered{formattedDate ? ` on ${formattedDate}` : ""}</span>
      </div>
    );
  }

  // Shipped / Out for Delivery
  if (currentStatus === "shipped" || currentStatus === "out_for_delivery" || currentStatus === "out for delivery") {
    const defaultDeliveryEstimate = date
      ? new Date(new Date(date).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "soon";

    if (currentStatus === "shipped") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100">
          <span className="material-symbols-outlined text-[15px] font-bold">local_shipping</span>
          <span>Arriving by {defaultDeliveryEstimate}</span>
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
          <span className="material-symbols-outlined text-[15px] font-bold">local_shipping</span>
          <span>Out For Delivery</span>
        </div>
      );
    }
  }

  // Cancelled
  if (currentStatus === "cancelled") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
        <span className="material-symbols-outlined text-[15px] font-bold">cancel</span>
        <span>Cancelled</span>
      </div>
    );
  }

  // Returned / Disputed
  if (currentStatus === "returned" || currentStatus === "disputed") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
        <span className="material-symbols-outlined text-[15px] font-bold">keyboard_return</span>
        <span>Returned</span>
      </div>
    );
  }

  // Refunded
  if (currentStatus === "refunded") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100">
        <span className="material-symbols-outlined text-[15px] font-bold">payments</span>
        <span>Refunded</span>
      </div>
    );
  }

  // Processing, Created, Paid, Confirmed, Packed, etc.
  let label = "Processing";
  let colorClasses = "bg-pink-50 text-vl-primary border-pink-100/60";
  let iconName = "inventory";

  if (currentStatus === "created") {
    label = "Pending Verification";
    colorClasses = "bg-amber-50 text-amber-700 border-amber-100";
    iconName = "schedule";
  } else if (currentStatus === "paid") {
    label = "Confirmed";
    colorClasses = "bg-pink-50 text-vl-primary border-pink-100/60";
    iconName = "verified";
  } else if (currentStatus === "confirmed") {
    label = "Processing";
    colorClasses = "bg-pink-50 text-vl-primary border-pink-100/60";
    iconName = "published_with_changes";
  } else if (currentStatus === "packed") {
    label = "Packed";
    colorClasses = "bg-violet-50 text-violet-700 border-violet-100";
    iconName = "inventory_2";
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colorClasses}`}>
      <span className="material-symbols-outlined text-[15px] font-bold">{iconName}</span>
      <span>{label}</span>
    </div>
  );
}
