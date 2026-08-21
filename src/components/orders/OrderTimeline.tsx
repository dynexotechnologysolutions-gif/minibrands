import React from "react";

interface OrderTimelineProps {
  status: string;
  orderStatus?: string | null;
  className?: string;
  variant?: "compact" | "detailed";
}

export default function OrderTimeline({
  status,
  orderStatus,
  className = "",
  variant = "compact",
}: OrderTimelineProps) {
  const currentStatus = (orderStatus || status || "").toLowerCase();

  // If order is cancelled or returned, render status alert or return null
  if (["cancelled", "returned", "refunded", "disputed"].includes(currentStatus)) {
    return (
      <div className={`mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-vl-danger ${className}`}>
        <span className="material-symbols-outlined text-sm font-bold">cancel</span>
        <span className="font-bold text-xs uppercase tracking-wider">
          Order {currentStatus.replace("_", " ")}
        </span>
      </div>
    );
  }

  // Determine completion of each stage
  const isPackedDone = [
    "paid",
    "confirmed",
    "processing",
    "packed",
    "shipped",
    "out_for_delivery",
    "out for delivery",
    "delivered",
    "completed",
  ].includes(currentStatus);

  const isShippedDone = [
    "shipped",
    "out_for_delivery",
    "out for delivery",
    "delivered",
    "completed",
  ].includes(currentStatus);

  const isDeliveredDone = ["delivered", "completed"].includes(currentStatus);

  if (variant === "detailed") {
    // 8 stages list
    const detailedSteps = [
      {
        key: "ordered",
        label: "Order Placed",
        icon: "shopping_bag",
        desc: "Order successfully submitted to the marketplace.",
        isDone: true,
        isCurrent: currentStatus === "created",
      },
      {
        key: "paid",
        label: "Payment Confirmed",
        icon: "verified",
        desc: "Secure transaction validation completed via Razorpay.",
        isDone: ["paid", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "out for delivery", "delivered", "completed"].includes(currentStatus),
        isCurrent: currentStatus === "paid",
      },
      {
        key: "confirmed",
        label: "Seller Accepted",
        icon: "store",
        desc: "Independent boutique has accepted and confirmed your order.",
        isDone: ["confirmed", "processing", "packed", "shipped", "out_for_delivery", "out for delivery", "delivered", "completed"].includes(currentStatus),
        isCurrent: currentStatus === "confirmed",
      },
      {
        key: "preparing",
        label: "Preparing Package",
        icon: "published_with_changes",
        desc: "The seller is packing your items and labeling your box.",
        isDone: ["processing", "packed", "shipped", "out_for_delivery", "out for delivery", "delivered", "completed"].includes(currentStatus),
        isCurrent: currentStatus === "processing",
      },
      {
        key: "packed",
        label: "Packed",
        icon: "inventory_2",
        desc: "Your package is ready and waiting for dispatch courier pickup.",
        isDone: ["packed", "shipped", "out_for_delivery", "out for delivery", "delivered", "completed"].includes(currentStatus),
        isCurrent: currentStatus === "packed",
      },
      {
        key: "shipped",
        label: "Shipped",
        icon: "local_shipping",
        desc: "Dispatched from boutique hub. On the way to Chennai center.",
        isDone: ["shipped", "out_for_delivery", "out for delivery", "delivered", "completed"].includes(currentStatus),
        isCurrent: currentStatus === "shipped",
      },
      {
        key: "out_for_delivery",
        label: "Out for Delivery",
        icon: "explore",
        desc: "Logistics partner is bringing the package to your doorstep today.",
        isDone: ["out_for_delivery", "out for delivery", "delivered", "completed"].includes(currentStatus),
        isCurrent: ["out_for_delivery", "out for delivery"].includes(currentStatus),
      },
      {
        key: "delivered",
        label: "Delivered",
        icon: "home",
        desc: "Delivered successfully! Payment escrow release initiated.",
        isDone: ["delivered", "completed"].includes(currentStatus),
        isCurrent: ["delivered", "completed"].includes(currentStatus),
      },
    ];

    return (
      <div className={`space-y-6 relative pl-2 before:absolute before:left-[26px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100 ${className}`}>
        {detailedSteps.map((step, idx) => {
          const isDone = step.isDone;
          const isCurrent = step.isCurrent;
          const nextStepDone = idx < detailedSteps.length - 1 ? detailedSteps[idx + 1].isDone : false;

          return (
            <div key={step.key} className="flex gap-4 items-start relative z-10 group">
              {/* Connector line overlay for active node state */}
              {isDone && nextStepDone && (
                <div className="absolute left-[17px] top-9 w-0.5 h-10 bg-vl-primary/60 -z-10" />
              )}
              
              {/* Circle Icon */}
              <div
                className={`w-9 h-9 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isDone && !isCurrent
                    ? "bg-vl-primary text-white shadow-sm ring-2 ring-white"
                    : isCurrent
                    ? "bg-vl-primary text-white ring-4 ring-vl-primary/20 shadow-md scale-105"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                {isDone && !isCurrent ? (
                  <span className="material-symbols-outlined text-base font-bold">check</span>
                ) : (
                  <span className="material-symbols-outlined text-base sm:text-lg">{step.icon}</span>
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-bold ${isCurrent ? "text-vl-primary" : isDone ? "text-vl-ink" : "text-vl-muted"}`}>
                    {step.label}
                  </h4>
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 bg-vl-primary/10 text-vl-primary text-[9px] font-bold uppercase rounded tracking-wider animate-pulse">
                      Current
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 leading-normal ${isCurrent ? "text-vl-ink/80 font-medium" : isDone ? "text-vl-muted" : "text-slate-400"}`}>
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Steps definition for compact horizontal view
  const steps = [
    {
      key: "ordered",
      label: "Order Placed",
      shortLabel: "Ordered",
      icon: "shopping_bag",
      isDone: true,
      isCurrent: !isPackedDone,
    },
    {
      key: "packed",
      label: "Packed & Ready",
      shortLabel: "Packed",
      icon: "inventory_2",
      isDone: isPackedDone,
      isCurrent: isPackedDone && !isShippedDone,
    },
    {
      key: "shipped",
      label: "In Transit",
      shortLabel: "Shipped",
      icon: "local_shipping",
      isDone: isShippedDone,
      isCurrent: isShippedDone && !isDeliveredDone,
    },
    {
      key: "delivered",
      label: "Delivered",
      shortLabel: "Delivered",
      icon: "home",
      isDone: isDeliveredDone,
      isCurrent: isDeliveredDone,
    },
  ];

  // Progress percentage calculation
  let progressPercent = 0;
  if (isDeliveredDone) {
    progressPercent = 100;
  } else if (isShippedDone) {
    progressPercent = 66.66;
  } else if (isPackedDone) {
    progressPercent = 33.33;
  } else {
    progressPercent = 0;
  }

  return (
    <div className={`w-full py-2 ${className}`}>
      {/* Connector line container */}
      <div className="relative flex items-center justify-between px-2 sm:px-6">
        {/* Background Track Line */}
        <div className="absolute top-4 sm:top-5 left-4 sm:left-10 right-4 sm:right-10 h-1 bg-slate-100 rounded-full z-0 overflow-hidden">
          {/* Progress Filled Bar */}
          <div
            className="h-full bg-vl-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Steps Nodes */}
        {steps.map((step) => {
          const isDone = step.isDone;
          const isCurrent = step.isCurrent;

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-col items-center group cursor-default"
            >
              {/* Icon Circle */}
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDone && !isCurrent
                    ? "bg-vl-primary text-white shadow-sm ring-2 ring-white"
                    : isCurrent
                    ? "bg-vl-primary text-white ring-4 ring-vl-primary/20 shadow-md scale-105"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                {isDone && !isCurrent ? (
                  <span
                    className="material-symbols-outlined text-base sm:text-lg font-bold"
                  >
                    check
                  </span>
                ) : (
                  <span
                    className="material-symbols-outlined text-sm sm:text-base"
                  >
                    {step.icon}
                  </span>
                )}
              </div>

              {/* Step Labels */}
              <div className="mt-2 text-center max-w-[70px] sm:max-w-[90px] min-h-[40px] flex flex-col items-center">
                <p
                  className={`text-[11px] sm:text-xs leading-tight transition-colors ${
                    isCurrent
                      ? "font-bold text-vl-primary"
                      : isDone
                      ? "font-bold text-vl-ink"
                      : "font-medium text-slate-400"
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </p>

                {/* Subtitle Status Tag (Detailed variant or active node) */}
                {isCurrent && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-vl-primary/10 text-vl-primary text-[9px] font-bold uppercase rounded tracking-wider animate-pulse whitespace-nowrap">
                    Active
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
