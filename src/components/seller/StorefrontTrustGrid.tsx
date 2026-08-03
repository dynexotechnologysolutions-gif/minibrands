"use client";

import React from "react";
import { ShieldCheck, Truck, ThumbsUp, Lock } from "lucide-react";

interface StorefrontTrustGridProps {
  city: string;
  storeDisplayName: string;
}

export default function StorefrontTrustGrid({ city, storeDisplayName }: StorefrontTrustGridProps) {
  const points = [
    {
      title: "KYC Verified Merchant",
      description: `Government-issued credentials & address fully verified to guarantee authentic boutique legitimacy.`,
      icon: ShieldCheck,
      color: "bg-emerald-500/10 text-vl-success",
    },
    {
      title: "Escrow Protection System",
      description: "Your payment is held safely and only released to the boutique after you confirm delivery package arrival.",
      icon: Lock,
      color: "bg-vl-primary/10 text-vl-primary",
    },
    {
      title: "Direct Local Dispatch",
      description: `All pieces are securely packaged and shipped directly from the boutique's studio in ${city}.`,
      icon: Truck,
      color: "bg-indigo-500/10 text-indigo-600",
    },
    {
      title: "Marketplace Guarantee",
      description: "Enjoy full buyer purchase protection with 7-day hassle-free returns for fabric quality issues.",
      icon: ThumbsUp,
      color: "bg-amber-500/10 text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-vl-heading text-lg font-bold tracking-tight text-vl-ink">
          Why Shop With {storeDisplayName}
        </h2>
        <p className="text-xs text-vl-muted">
          Trust-first, escrow-protected buying guarantees
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {points.map((p, i) => {
          const Icon = p.icon;
          return (
            <div
              key={i}
              className="p-5 bg-vl-card border border-vl-border rounded-vl-card shadow-vl-soft hover:shadow-vl-medium transition duration-vl-standard flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${p.color}`}>
                  <Icon className="w-5 h-5 shrink-0" />
                </span>
                <h4 className="font-vl-heading text-sm font-bold text-vl-ink">
                  {p.title}
                </h4>
                <p className="text-xs leading-relaxed text-vl-muted">
                  {p.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
