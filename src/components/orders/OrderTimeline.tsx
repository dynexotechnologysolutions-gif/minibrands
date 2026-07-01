import React from "react";

interface OrderTimelineProps {
  status: string;
  orderStatus?: string | null;
}

export default function OrderTimeline({ status, orderStatus }: OrderTimelineProps) {
  const currentStatus = (orderStatus || status || "").toLowerCase();

  // Define active flags for each step
  // Steps: Ordered -> Packed -> Shipped -> Delivered
  let orderedActive = true;
  let packedActive = false;
  let shippedActive = false;
  let deliveredActive = false;
  let progressWidth = "w-0";

  if (["paid", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "out for delivery", "delivered", "completed"].includes(currentStatus)) {
    packedActive = true;
    progressWidth = "w-1/3";
  }
  if (["shipped", "out_for_delivery", "out for delivery", "delivered", "completed"].includes(currentStatus)) {
    shippedActive = true;
    progressWidth = "w-2/3";
  }
  if (["delivered", "completed"].includes(currentStatus)) {
    deliveredActive = true;
    progressWidth = "w-full";
  }

  // If order is cancelled or returned, we do not render the timeline
  if (["cancelled", "returned", "refunded", "disputed"].includes(currentStatus)) {
    return null;
  }

  return (
    <div className="mt-lg pt-base border-t border-border-gray">
      <div className="relative flex items-center justify-between px-4 max-w-md">
        {/* Connector Line */}
        <div className="absolute left-8 right-8 top-1.5 h-1 bg-gray-200 z-0">
          <div className={`h-full bg-primary ${progressWidth}`}></div>
        </div>

        {/* Step 1: Ordered */}
        <div className={`relative z-10 flex flex-col items-center gap-1 text-center ${orderedActive ? "" : "opacity-40"}`}>
          <div className={`w-3 h-3 rounded-full border-4 border-white shadow-sm ${orderedActive ? "bg-primary" : "bg-gray-200"}`}></div>
          <span className={`font-body-sm text-[10px] ${orderedActive ? "text-primary font-bold" : "text-secondary font-bold"} uppercase tracking-tight`}>Ordered</span>
        </div>

        {/* Step 2: Packed */}
        <div className={`relative z-10 flex flex-col items-center gap-1 text-center ${packedActive ? "" : "opacity-40"}`}>
          <div className={`w-3 h-3 rounded-full border-4 border-white shadow-sm ${packedActive ? "bg-primary" : "bg-gray-200"}`}></div>
          <span className={`font-body-sm text-[10px] ${packedActive ? "text-primary font-bold" : "text-secondary font-bold"} uppercase tracking-tight`}>Packed</span>
        </div>

        {/* Step 3: Shipped */}
        <div className={`relative z-10 flex flex-col items-center gap-1 text-center ${shippedActive ? "" : "opacity-40"}`}>
          <div className={`w-3 h-3 rounded-full border-4 border-white shadow-sm ${shippedActive ? "bg-primary" : "bg-gray-200"}`}></div>
          <span className={`font-body-sm text-[10px] ${shippedActive ? "text-primary font-bold" : "text-secondary font-bold"} uppercase tracking-tight`}>Shipped</span>
        </div>

        {/* Step 4: Delivered */}
        <div className={`relative z-10 flex flex-col items-center gap-1 text-center ${deliveredActive ? "" : "opacity-40"}`}>
          <div className={`w-3 h-3 rounded-full border-4 border-white shadow-sm ${deliveredActive ? "bg-primary" : "bg-gray-200"}`}></div>
          <span className={`font-body-sm text-[10px] ${deliveredActive ? "text-primary font-bold" : "text-secondary font-bold"} uppercase tracking-tight`}>Delivered</span>
        </div>
      </div>
    </div>
  );
}
