"use client";

import React from "react";
import { ShieldCheck, Lock, Truck, BadgeCheck } from "lucide-react";

interface StorefrontAssuranceProps {
  city: string;
}

export default function StorefrontAssurance({ city }: StorefrontAssuranceProps) {
  const items = [
    { icon: BadgeCheck, label: "Verified Seller", desc: "KYC verified boutique" },
    { icon: Lock, label: "Secure Payments", desc: "Escrow protected" },
    { icon: Truck, label: "Reliable Delivery", desc: `Ships from ${city}` },
    { icon: ShieldCheck, label: "Buyer Protection", desc: "7-day returns" },
  ];

  return (
    <div className="rounded-vl-card border border-vl-border bg-vl-card p-4 sm:p-5 shadow-vl-soft">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-vl-primary/10 text-vl-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-none text-vl-ink">{item.label}</p>
                <p className="text-[11px] leading-tight text-vl-muted mt-1">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
