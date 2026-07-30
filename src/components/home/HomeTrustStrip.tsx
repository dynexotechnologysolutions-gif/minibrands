import { BadgeCheck, CreditCard, RotateCcw, Star, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TrustItem {
  Icon: LucideIcon;
  label: string;
}

const trustItems: TrustItem[] = [
  { Icon: Star, label: "4.9 Customer Rating" },
  { Icon: BadgeCheck, label: "Verified Sellers" },
  { Icon: CreditCard, label: "Secure Payments" },
  { Icon: Truck, label: "Fast Delivery" },
  { Icon: RotateCcw, label: "Easy Returns" },
];

export default function HomeTrustStrip() {
  return (
    <section
      className="vl-section-shell mt-6 sm:mt-8"
      aria-label="Platform trust indicators"
    >
      <div className="flex items-center justify-center gap-3 overflow-x-auto hide-scrollbar">
        {trustItems.map(({ Icon, label }, index) => (
          <div key={label} className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[#ECECEC] bg-[#FAFAFC] px-5 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md cursor-default">
              <Icon
                aria-hidden="true"
                className="h-4 w-4 shrink-0"
                style={{ color: "#6C3BFF" }}
                strokeWidth={2.2}
              />
              <span className="whitespace-nowrap text-[14px] font-semibold text-[#111827]">
                {label}
              </span>
            </div>
            {index < trustItems.length - 1 && (
              <div className="hidden h-5 w-px shrink-0 bg-[#ECECEC] sm:block" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
