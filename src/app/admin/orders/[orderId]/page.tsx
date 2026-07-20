"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  User,
  Store,
  MapPin,
  Truck,
  DollarSign,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [overrideStatus, setOverrideStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/admin/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data.order || null);
        if (data.order) setOverrideStatus(data.order.status);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Order detail fetch error:", err);
        setIsLoading(false);
      });
  }, [orderId]);

  const handleUpdateStatus = async () => {
    if (!overrideStatus || overrideStatus === order.status) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/update-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: overrideStatus, reason: "Admin status override." }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (res.ok) {
        setOrder((prev: any) => ({ ...prev, status: overrideStatus }));
        setToast({ type: "success", message: `Order status updated to '${overrideStatus}'.` });
      } else {
        setToast({ type: "error", message: data.error || "Failed to update status." });
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setToast({ type: "error", message: err.message || "Failed to update status." });
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-text-muted text-xs font-medium">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
        <span>Loading order telemetry...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center text-text-muted text-xs font-medium">
        Order not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Toast */}
      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
            toast.type === "success"
              ? "bg-success-green/10 text-success-green border-success-green/30"
              : "bg-error-red/10 text-error-red border-error-red/30"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-on-surface transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Orders Directory</span>
      </Link>

      {/* Header Banner */}
      <div className="bg-surface p-6 rounded-3xl border border-border-gray/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-2xl text-on-surface">
              Order #{order.id.slice(0, 8)}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-primary/10 text-primary border border-primary/20">
              {order.status}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()} • Razorpay ID: {order.razorpayOrderId || "N/A"}
          </p>
        </div>

        {/* Override Admin Status Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={overrideStatus}
            onChange={(e) => setOverrideStatus(e.target.value)}
            className="p-2.5 rounded-xl bg-surface-container-lowest border border-border-gray/70 text-xs font-bold text-on-surface focus:outline-none"
          >
            {["created", "paid", "confirmed", "shipped", "delivered", "completed", "cancelled", "disputed"].map((st) => (
              <option key={st} value={st}>
                Set Status: {st.toUpperCase()}
              </option>
            ))}
          </select>
          <button
            onClick={handleUpdateStatus}
            disabled={isSubmitting || overrideStatus === order.status}
            className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Update Status</span>
          </button>
        </div>
      </div>

      {/* Financials & Payout Split */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase text-text-muted">Total Paid Amount</p>
          <h3 className="font-display font-extrabold text-2xl text-on-surface">
            ₹{order.totalAmount.toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-text-muted">Subtotal + Shipping + Tax</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase text-text-muted">Marketplace Commission</p>
          <h3 className="font-display font-extrabold text-2xl text-success-green">
            ₹{order.commissionAmount.toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-text-muted">Platform fee deducted</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase text-text-muted">Merchant Net Payout</p>
          <h3 className="font-display font-extrabold text-2xl text-indigo-600">
            ₹{order.sellerPayout.toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-text-muted">Escrow settlement amount</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase text-text-muted">Escrow Release Date</p>
          <h3 className="font-display font-extrabold text-lg text-accent-yellow">
            {order.escrowReleaseAt ? new Date(order.escrowReleaseAt).toLocaleDateString() : "Pending Delivery"}
          </h3>
          <p className="text-[11px] text-text-muted">Auto release countdown</p>
        </div>
      </div>

      {/* Items & Shipping Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4">
          <h3 className="font-display font-extrabold text-base text-on-surface">
            Order Line Items ({order.items.length})
          </h3>

          <div className="divide-y divide-border-gray/40">
            {order.items.map((item: any) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-on-surface">{item.productName}</p>
                  <p className="text-text-muted text-[11px]">Variant Size: {item.size} • Qty: {item.quantity}</p>
                </div>
                <span className="font-bold text-on-surface">₹{item.unitPrice * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Customer Details */}
        <div className="p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4 text-xs font-medium">
          <h3 className="font-display font-extrabold text-base text-on-surface">
            Fulfillment & Customer Info
          </h3>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-surface-container-low">
              <p className="font-bold text-text-muted uppercase text-[10px]">Buyer Customer</p>
              <p className="font-bold text-on-surface mt-1">{order.buyer.name}</p>
              <p className="text-text-muted">{order.buyer.email}</p>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low">
              <p className="font-bold text-text-muted uppercase text-[10px]">Merchant Seller</p>
              <p className="font-bold text-on-surface mt-1">{order.seller.businessName}</p>
              <p className="text-text-muted">{order.seller.category}</p>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low">
              <p className="font-bold text-text-muted uppercase text-[10px]">iCarry Courier Shipping</p>
              <p className="font-bold text-on-surface mt-1">AWB: {order.icarryAwbNumber || "Not Shipped Yet"}</p>
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline block mt-1">
                  Track iCarry Package →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
