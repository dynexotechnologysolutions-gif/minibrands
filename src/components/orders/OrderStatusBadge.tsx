import React from "react";

interface OrderStatusBadgeProps {
  status: string;
  orderStatus?: string | null;
  date?: string | Date | null;
}

export default function OrderStatusBadge({ status, orderStatus, date }: OrderStatusBadgeProps) {
  // Normalize the status string
  const currentStatus = (orderStatus || status || "").toLowerCase();

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  if (currentStatus === "delivered" || currentStatus === "completed") {
    return (
      <div className="flex items-center gap-sm text-success-green font-label-bold text-label-bold">
        <span className="material-symbols-outlined text-[18px]">check_circle</span>
        Delivered{formattedDate ? ` on ${formattedDate}` : ""}
      </div>
    );
  }

  if (currentStatus === "shipped" || currentStatus === "out_for_delivery" || currentStatus === "out for delivery") {
    const defaultDeliveryEstimate = date
      ? new Date(new Date(date).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "soon";

    return (
      <div className="flex items-center gap-sm text-primary font-label-bold text-label-bold">
        <span className="material-symbols-outlined text-[18px]">local_shipping</span>
        {currentStatus === "shipped" ? `Arriving by ${defaultDeliveryEstimate}` : "Out For Delivery"}
      </div>
    );
  }

  if (currentStatus === "cancelled") {
    return (
      <div className="flex items-center gap-sm text-error-red font-label-bold text-label-bold">
        <span className="material-symbols-outlined text-[18px]">cancel</span>
        Cancelled
      </div>
    );
  }

  if (currentStatus === "returned" || currentStatus === "disputed") {
    return (
      <div className="flex items-center gap-sm text-secondary font-label-bold text-label-bold">
        <span className="material-symbols-outlined text-[18px]">keyboard_return</span>
        Returned
      </div>
    );
  }

  if (currentStatus === "refunded") {
    return (
      <div className="flex items-center gap-sm text-secondary font-label-bold text-label-bold">
        <span className="material-symbols-outlined text-[18px]">payments</span>
        Refunded
      </div>
    );
  }

  // Processing, Created, Paid, Confirmed, Packed, etc.
  let label = "Processing";
  if (currentStatus === "created") label = "Pending Verification";
  else if (currentStatus === "paid") label = "Confirmed";
  else if (currentStatus === "confirmed") label = "Processing";
  else if (currentStatus === "packed") label = "Packed";

  return (
    <div className="flex items-center gap-sm text-accent-yellow font-label-bold text-label-bold">
      <span className="material-symbols-outlined text-[18px]">inventory</span>
      {label}
    </div>
  );
}
