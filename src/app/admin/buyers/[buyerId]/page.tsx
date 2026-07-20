"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  ShoppingBag,
  RotateCcw,
  Star,
  MapPin,
  AlertTriangle,
  ArrowLeft,
  Loader2,
} from "lucide-react";

export default function BuyerDetailPage() {
  const params = useParams();
  const buyerId = params?.buyerId as string;

  const [buyer, setBuyer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!buyerId) return;
    fetch(`/api/admin/buyers/${buyerId}`)
      .then((res) => res.json())
      .then((data) => {
        setBuyer(data.buyer || null);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Buyer detail fetch error:", err);
        setIsLoading(false);
      });
  }, [buyerId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-text-muted text-xs font-medium">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
        <span>Loading buyer profile...</span>
      </div>
    );
  }

  if (!buyer) {
    return (
      <div className="p-12 text-center text-text-muted text-xs font-medium">
        Buyer profile not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      <Link
        href="/admin/buyers"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-on-surface transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Buyers Directory</span>
      </Link>

      {/* Profile Header */}
      <div className="bg-surface p-6 rounded-3xl border border-border-gray/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary font-extrabold flex items-center justify-center text-xl shadow-md">
            {buyer.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-on-surface">{buyer.name}</h1>
            <p className="text-xs text-text-muted mt-1">{buyer.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
              buyer.isSuspended
                ? "bg-error-red/10 text-error-red border-error-red/30"
                : "bg-success-green/10 text-success-green border-success-green/30"
            }`}
          >
            {buyer.isSuspended ? "ACCOUNT SUSPENDED" : "ACCOUNT ACTIVE"}
          </span>
        </div>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase text-text-muted">Abuse Score</p>
          <h3 className={`font-display font-extrabold text-2xl ${buyer.abuseScore > 30 ? "text-error-red" : "text-success-green"}`}>
            {buyer.abuseScore.toFixed(1)} / 100
          </h3>
          <p className="text-[11px] text-text-muted">Return/Dispute fraud indicator</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase text-text-muted">Orders Placed</p>
          <h3 className="font-display font-extrabold text-2xl text-on-surface">
            {buyer.orders.length}
          </h3>
          <p className="text-[11px] text-text-muted">Lifetime purchases</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase text-text-muted">Returns Claimed</p>
          <h3 className="font-display font-extrabold text-2xl text-accent-yellow">
            {buyer.returnCount}
          </h3>
          <p className="text-[11px] text-text-muted">RMA requests filed</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase text-text-muted">Saved Addresses</p>
          <h3 className="font-display font-extrabold text-2xl text-primary">
            {buyer.addresses.length}
          </h3>
          <p className="text-[11px] text-text-muted">Delivery destinations</p>
        </div>
      </div>

      {/* Orders & Reviews Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4">
          <h3 className="font-display font-extrabold text-base text-on-surface flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" />
            <span>Order History ({buyer.orders.length})</span>
          </h3>

          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {buyer.orders.map((o: any) => (
              <div key={o.id} className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-on-surface">#{o.id.slice(0, 8)} • {o.sellerName}</p>
                  <p className="text-[10px] text-text-muted">₹{o.totalAmount} • {o.status}</p>
                </div>
                <Link href={`/admin/orders/${o.id}`} className="text-primary font-bold hover:underline">
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4">
          <h3 className="font-display font-extrabold text-base text-on-surface flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Saved Delivery Addresses ({buyer.addresses.length})</span>
          </h3>

          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {buyer.addresses.map((addr: any) => (
              <div key={addr.id} className="p-3 rounded-xl bg-surface-container-low text-xs space-y-1">
                <p className="font-bold text-on-surface">{addr.fullName} ({addr.phone})</p>
                <p className="text-text-muted">{addr.line1}, {addr.city} - {addr.pincode}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
