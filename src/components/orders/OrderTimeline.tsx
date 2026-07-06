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
      <div className={`mt-md p-sm bg-error-container/30 border border-error/20 rounded-sm flex items-center gap-xs text-error ${className}`}>
        <span className="material-symbols-outlined text-sm">cancel</span>
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

  // Steps definition
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
    <div className={`w-full py-xs ${className}`}>
      {/* Connector line container */}
      <div className="relative flex items-center justify-between px-2 sm:px-6">
        {/* Background Track Line */}
        <div className="absolute left-[30px] right-[30px] sm:left-[44px] sm:right-[44px] top-4 sm:top-5 h-1 bg-surface-container-high rounded-full z-0 overflow-hidden">
          {/* Progress Filled Bar */}
          <div
            className="h-full bg-success-green transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Steps Nodes */}
        {steps.map((step, idx) => {
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
                    ? "bg-success-green text-white shadow-sm ring-2 ring-white"
                    : isCurrent
                    ? "bg-primary text-on-primary ring-4 ring-primary/20 shadow-md scale-105"
                    : "bg-surface-container-low text-text-muted border-2 border-border-gray"
                }`}
              >
                {isDone && !isCurrent ? (
                  <span
                    className="material-symbols-outlined text-base sm:text-lg font-bold"
                    style={{ fontVariationSettings: "'wght' 700" }}
                  >
                    check
                  </span>
                ) : (
                  <span
                    className="material-symbols-outlined text-sm sm:text-base"
                    style={{
                      fontVariationSettings: isCurrent
                        ? "'FILL' 1, 'wght' 600"
                        : "'FILL' 0, 'wght' 400",
                    }}
                  >
                    {step.icon}
                  </span>
                )}
              </div>

              {/* Step Labels */}
              <div className="mt-xs text-center max-w-[70px] sm:max-w-[90px]">
                <p
                  className={`text-[11px] sm:text-xs leading-tight transition-colors ${
                    isCurrent
                      ? "font-bold text-primary"
                      : isDone
                      ? "font-bold text-on-surface"
                      : "font-medium text-text-muted"
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </p>

                {/* Subtitle Status Tag (Detailed variant or active node) */}
                {isCurrent && (
                  <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-primary/10 text-primary text-[9px] font-bold uppercase rounded tracking-wider animate-pulse">
                    Current
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
