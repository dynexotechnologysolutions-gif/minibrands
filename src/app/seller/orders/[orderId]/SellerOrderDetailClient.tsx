"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confirmOrderAction } from "@/actions/order-confirm.action";
import { shipOrderAction } from "@/actions/order-ship.action";
import StatusBadge from "@/components/order/StatusBadge";
import EscrowCountdown from "@/components/order/EscrowCountdown";
import OrderTimeline from "@/components/orders/OrderTimeline";

interface OrderItem {
  id: string;
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;
  image: string;
}

interface SellerOrderDetailProps {
  order: {
    id: string;
    status: string;
    orderStatus: string;
    totalAmount: number;
    subtotal: number;
    shipping: number;
    commissionAmount: number;
    createdAt: string;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    icarryOrderId: string | null;
    icarryAwbNumber: string | null;
    icarryLabelUrl: string | null;
    trackingUrl: string | null;
    escrowReleaseAt: string | null;
    buyerName: string;
    address: {
      fullName: string;
      phone: string;
      line1: string;
      line2: string | null;
      city: string;
      pincode: string;
    };
    items: OrderItem[];
  };
  sellerName: string;
}

export default function SellerOrderDetailClient({ order, sellerName }: SellerOrderDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  const [awbOverride, setAwbOverride] = useState("");
  const [showShipForm, setShowShipForm] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [logistics, setLogistics] = useState({
    icarryOrderId: order.icarryOrderId,
    icarryAwbNumber: order.icarryAwbNumber,
    icarryLabelUrl: order.icarryLabelUrl,
    trackingUrl: order.trackingUrl,
  });

  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const formatPrice = (amt: number) =>
    (amt / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  const sellerAmount = order.totalAmount - order.commissionAmount;

  const handleConfirm = async () => {
    if (!confirm("Confirm this order? iCarry shipment will be booked automatically.")) return;
    setIsConfirming(true);
    try {
      const res = await confirmOrderAction(order.id);
      if (res.success) {
        setCurrentStatus("confirmed");
        if (res.data) {
          setLogistics({
            icarryOrderId: res.data.icarryOrderId ?? null,
            icarryAwbNumber: res.data.awbNumber ?? null,
            icarryLabelUrl: res.data.labelUrl ?? null,
            trackingUrl: res.data.trackingUrl ?? null,
          });
        }
        triggerToast("Order confirmed! Shipment booked with iCarry.", "success");
        startTransition(() => router.refresh());
      } else {
        triggerToast(res.error?.message ?? "Failed to confirm order.", "error");
      }
    } catch {
      triggerToast("An unexpected error occurred.", "error");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleShip = async () => {
    setIsShipping(true);
    try {
      const res = await shipOrderAction(order.id, awbOverride.trim() || undefined);
      if (res.success) {
        setCurrentStatus("shipped");
        if (res.data?.trackingUrl) {
          setLogistics((prev) => ({
            ...prev,
            trackingUrl: res.data!.trackingUrl ?? prev.trackingUrl,
            icarryAwbNumber: res.data!.awbNumber ?? prev.icarryAwbNumber,
          }));
        }
        triggerToast("Order marked as shipped.", "success");
        setShowShipForm(false);
        startTransition(() => router.refresh());
      } else {
        triggerToast(res.error?.message ?? "Failed to ship order.", "error");
      }
    } catch {
      triggerToast("An unexpected error occurred.", "error");
    } finally {
      setIsShipping(false);
    }
  };

  const TIMELINE_STEPS = [
    { key: "created", label: "Order Placed" },
    { key: "paid", label: "Payment Confirmed" },
    { key: "confirmed", label: "Seller Confirmed" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "completed", label: "Payout Released" },
  ];

  const statusOrder = ["created", "paid", "confirmed", "shipped", "delivered", "completed"];
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="space-y-lg">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[110] animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 font-bold text-xs border ${
              toast.type === "success"
                ? "bg-emerald-900 text-white border-emerald-800"
                : "bg-red-900 text-white border-red-800"
            }`}
          >
            <span className="material-symbols-outlined">
              {toast.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Header & Back Navigation */}
      <div className="border-b border-border-gray/40 pb-md space-y-xs">
        <Link href="/seller/orders" className="text-text-muted font-bold text-xs hover:text-on-surface flex items-center gap-xs">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to All Orders
        </Link>
        <div className="flex items-start justify-between gap-base flex-wrap pt-xs">
          <div>
            <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-body-sm text-text-muted mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
              })}
            </p>
          </div>
          <StatusBadge status={currentStatus} />
        </div>
      </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start">
          {/* Left: Timeline + Items + Address */}
          <div className="lg:col-span-8 space-y-lg">
            {/* Order Status Timeline */}
            {!["cancelled", "returned", "refunded"].includes((order.orderStatus || currentStatus || "").toLowerCase()) && (
              <div className="bg-white border border-border-gray rounded-lg p-base sm:p-md space-y-md shadow-sm">
                <div className="flex items-center justify-between border-b border-border-gray/40 pb-sm">
                  <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-xs">
                    <span className="material-symbols-outlined text-primary text-xl">route</span>
                    Order Status Timeline
                  </h3>
                  <span className="text-xs font-bold text-success-green bg-success-green/10 px-sm py-0.5 rounded-full uppercase tracking-wider">
                    {currentStatus.toLowerCase() === "delivered" || order.orderStatus?.toLowerCase() === "delivered" ? "Delivered" : "On Schedule"}
                  </span>
                </div>
                <OrderTimeline status={currentStatus} orderStatus={order.orderStatus} variant="detailed" />
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white border border-border-gray rounded p-base shadow-sm space-y-base">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-sm">
                <span className="material-symbols-outlined text-secondary">shopping_bag</span>
                Order Items
              </h3>
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-base py-base border-b border-border-gray/30 last:border-0 last:pb-0">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded border border-border-gray object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-label-bold text-label-bold text-primary">{item.name}</p>
                    <p className="font-body-sm text-secondary text-xs">Size: {item.size} · Qty: {item.quantity}</p>
                    <p className="font-price-lg text-price-lg text-primary text-sm mt-xs">{formatPrice(item.unitPrice)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Address */}
            <div className="bg-white border border-border-gray rounded p-base shadow-sm space-y-xs">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-sm mb-base">
                <span className="material-symbols-outlined text-secondary">location_on</span>
                Ship To
              </h3>
              <p className="font-label-bold text-label-bold text-primary">{order.address.fullName}</p>
              <p className="font-body-sm text-body-sm text-on-surface">{order.address.line1}</p>
              {order.address.line2 && <p className="font-body-sm text-body-sm text-on-surface">{order.address.line2}</p>}
              <p className="font-body-sm text-body-sm text-on-surface">{order.address.city} — {order.address.pincode}</p>
              <p className="font-body-sm text-secondary text-xs mt-xs">📞 {order.address.phone}</p>
            </div>
          </div>

          {/* Right: Actions + Payment */}
          <div className="lg:col-span-4 space-y-lg">
            {/* Action panel */}
            <div className="bg-white border border-border-gray rounded p-base shadow-sm space-y-base">
              <h3 className="font-headline-sm text-headline-sm text-primary border-b border-border-gray pb-sm">Actions</h3>

              {currentStatus === "paid" && (
                <button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="w-full py-3 bg-primary text-white font-label-bold text-label-bold rounded hover:opacity-90 transition-all active:scale-95 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-xs"
                >
                  {isConfirming ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Confirming...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">check_circle</span> Confirm Order</>
                  )}
                </button>
              )}

              {currentStatus === "confirmed" && !showShipForm && (
                <button
                  onClick={() => setShowShipForm(true)}
                  className="w-full py-3 bg-primary text-white font-label-bold text-label-bold rounded hover:opacity-90 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                  Mark as Shipped
                </button>
              )}

              {currentStatus === "confirmed" && showShipForm && (
                <div className="space-y-base border border-border-gray rounded p-sm">
                  <p className="font-label-bold text-label-bold text-primary text-xs">Shipping Details</p>
                  <input
                    type="text"
                    value={awbOverride}
                    onChange={(e) => setAwbOverride(e.target.value)}
                    placeholder="AWB override (optional)"
                    className="w-full border border-border-gray rounded p-sm text-body-sm outline-none focus:border-primary text-xs"
                  />
                  <div className="flex gap-sm">
                    <button
                      onClick={() => setShowShipForm(false)}
                      className="flex-1 py-2 border border-border-gray text-secondary font-label-bold text-label-bold rounded hover:bg-surface-container cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleShip}
                      disabled={isShipping}
                      className="flex-1 py-2 bg-primary text-white font-label-bold text-label-bold rounded hover:opacity-90 cursor-pointer disabled:opacity-60 text-xs flex items-center justify-center gap-xs"
                    >
                      {isShipping ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : "Confirm Shipped"}
                    </button>
                  </div>
                </div>
              )}

              {/* iCarry info */}
              {logistics.icarryAwbNumber && (
                <div className="space-y-xs pt-sm border-t border-border-gray/40">
                  <p className="font-label-bold text-label-bold text-xs text-primary">iCarry Shipment</p>
                  <p className="font-body-sm text-secondary text-xs">AWB: <span className="font-mono">{logistics.icarryAwbNumber}</span></p>
                  <div className="flex gap-sm">
                    {logistics.icarryLabelUrl && (
                      <a href={logistics.icarryLabelUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-xs text-xs text-secondary hover:text-primary border border-border-gray rounded px-sm py-1 transition-colors">
                        <span className="material-symbols-outlined text-[13px]">print</span> Print Label
                      </a>
                    )}
                    {logistics.trackingUrl && (
                      <a href={logistics.trackingUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-xs text-xs text-secondary hover:text-primary border border-border-gray rounded px-sm py-1 transition-colors">
                        <span className="material-symbols-outlined text-[13px]">location_on</span> Track
                      </a>
                    )}
                  </div>
                </div>
              )}

              {(currentStatus === "delivered" || currentStatus === "completed") && !order.escrowReleaseAt && (
                <div className="p-sm bg-emerald-50 border border-emerald-100 rounded text-center">
                  <span className="material-symbols-outlined text-emerald-500 text-[28px]">task_alt</span>
                  <p className="font-label-bold text-label-bold text-emerald-800 text-xs mt-xs">
                    {currentStatus === "completed" ? "Payout Released" : "Delivery Confirmed"}
                  </p>
                </div>
              )}
            </div>

            {/* Escrow countdown */}
            {(currentStatus === "delivered" || currentStatus === "completed") && order.escrowReleaseAt && (
              <EscrowCountdown escrowReleaseAt={order.escrowReleaseAt} />
            )}

            {/* Payment summary */}
            <div className="bg-white border border-border-gray rounded p-base shadow-sm space-y-base">
              <h3 className="font-headline-sm text-headline-sm text-primary border-b border-border-gray pb-sm">Payment</h3>
              <div className="space-y-sm text-xs">
                {[
                  { label: "Subtotal", value: order.subtotal },
                  { label: "Shipping", value: order.shipping },
                  { label: "Total Collected", value: order.totalAmount, bold: true },
                  { label: "Platform Commission", value: -order.commissionAmount },
                  { label: "Your Payout", value: sellerAmount, bold: true, highlight: true },
                ].map(({ label, value, bold, highlight }) => (
                  <div key={label} className={`flex justify-between items-baseline ${bold ? "pt-xs border-t border-border-gray/40" : ""}`}>
                    <span className={`font-body-sm ${bold ? "font-label-bold text-label-bold text-primary" : "text-secondary"}`}>{label}</span>
                    <span className={`font-mono ${bold ? "font-price-lg text-price-lg" : ""} ${highlight ? "text-emerald-700" : "text-primary"}`}>
                      {value >= 0 ? formatPrice(value) : `- ${formatPrice(-value)}`}
                    </span>
                  </div>
                ))}
              </div>

              {order.razorpayPaymentId && (
                <div className="pt-sm border-t border-border-gray/40">
                  <p className="font-body-sm text-[10px] text-secondary uppercase tracking-wider">Payment ID</p>
                  <p className="font-mono text-xs text-primary select-all break-all mt-xs">{order.razorpayPaymentId}</p>
                </div>
              )}
            </div>

            {/* Escrow note */}
            <div className="p-base bg-surface border border-border-gray rounded flex items-start gap-sm">
              <span className="material-symbols-outlined text-secondary mt-xs">verified_user</span>
              <div>
                <p className="font-label-bold text-label-bold text-primary text-xs">Escrow Security</p>
                <p className="font-body-sm text-[11px] text-secondary leading-relaxed mt-xs">
                  Velvet holds payment in escrow. Your payout is released automatically 7 days after the buyer confirms delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
