"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confirmOrderAction } from "@/actions/order-confirm.action";
import { shipOrderAction } from "@/actions/order-ship.action";
import StatusBadge from "@/components/order/StatusBadge";

interface SellerOrder {
  id: string;
  status: string;
  orderStatus: string;
  totalAmount: number;
  createdAt: string;
  buyerName: string;
  city: string;
  recipientName: string;
  itemCount: number;
  firstItemName: string;
  icarryAwbNumber: string | null;
  icarryLabelUrl: string | null;
  trackingUrl: string | null;
}

interface SellerOrdersClientProps {
  orders: SellerOrder[];
  sellerName: string;
}

type TabKey = "all" | "paid" | "confirmed" | "shipped" | "completed";

const TABS: { key: TabKey; label: string; statuses: string[] }[] = [
  { key: "all", label: "All Orders", statuses: [] },
  { key: "paid", label: "New Orders", statuses: ["paid"] },
  { key: "confirmed", label: "Confirmed", statuses: ["confirmed"] },
  { key: "shipped", label: "Shipped", statuses: ["shipped"] },
  { key: "completed", label: "Completed", statuses: ["delivered", "completed", "cancelled", "disputed"] },
];

export default function SellerOrdersClient({ orders, sellerName }: SellerOrdersClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Ship modal state
  const [shipModal, setShipModal] = useState<{ orderId: string } | null>(null);
  const [awbOverride, setAwbOverride] = useState("");

  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const formatPrice = (amt: number) =>
    (amt / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((o) => {
          const tab = TABS.find((t) => t.key === activeTab);
          return tab?.statuses.includes(o.status) ?? true;
        });

  const handleConfirm = async (orderId: string) => {
    if (!confirm("Confirm this order? iCarry shipment will be booked automatically.")) return;
    setActionLoadingId(orderId);
    try {
      const res = await confirmOrderAction(orderId);
      if (res.success) {
        triggerToast("Order confirmed and shipment booked.", "success");
        startTransition(() => router.refresh());
      } else {
        triggerToast(res.error?.message ?? "Failed to confirm order.", "error");
      }
    } catch {
      triggerToast("An error occurred.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleShip = async () => {
    if (!shipModal) return;
    setActionLoadingId(shipModal.orderId);
    try {
      const res = await shipOrderAction(shipModal.orderId, awbOverride.trim() || undefined);
      if (res.success) {
        triggerToast("Order marked as shipped.", "success");
        setShipModal(null);
        setAwbOverride("");
        startTransition(() => router.refresh());
      } else {
        triggerToast(res.error?.message ?? "Failed to mark as shipped.", "error");
      }
    } catch {
      triggerToast("An error occurred.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-base right-base z-50 animate-fade-in-up">
          <div className={`p-base border rounded-lg shadow-lg flex items-center gap-sm font-label-bold text-label-bold ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <span className="material-symbols-outlined">
              {toast.type === "success" ? "check_circle" : "error"}
            </span>
            {toast.text}
          </div>
        </div>
      )}

      <main className="max-w-container-max mx-auto px-4 md:px-lg py-xl flex-grow w-full space-y-lg">
        {/* Header */}
        <div>
          <Link href="/seller/dashboard" className="text-secondary font-label-bold text-label-bold hover:text-primary flex items-center gap-xs mb-sm text-xs">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Dashboard
          </Link>
          <h1 className="font-headline-lg text-headline-lg text-primary">Order Management</h1>
          <p className="font-body-md text-secondary">{sellerName}</p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-base">
          {[
            { label: "Total Orders", value: orders.length, icon: "receipt_long" },
            { label: "New Orders", value: orders.filter((o) => o.status === "paid").length, icon: "notifications_active" },
            { label: "Shipped", value: orders.filter((o) => o.status === "shipped").length, icon: "local_shipping" },
            { label: "Completed", value: orders.filter((o) => ["delivered", "completed"].includes(o.status)).length, icon: "task_alt" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white border border-border-gray rounded p-base shadow-sm">
              <div className="flex items-center gap-sm mb-xs">
                <span className="material-symbols-outlined text-secondary text-[20px]">{icon}</span>
                <span className="font-body-sm text-secondary text-xs">{label}</span>
              </div>
              <p className="font-headline-lg text-headline-lg text-primary">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-xs border-b border-border-gray overflow-x-auto">
          {TABS.map((tab) => {
            const count =
              tab.key === "all" ? orders.length : orders.filter((o) => tab.statuses.includes(o.status)).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-sm px-base text-xs font-label-bold text-label-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-secondary hover:text-primary"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-xs inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] ${
                    activeTab === tab.key ? "bg-primary text-white" : "bg-surface-container text-secondary"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-xl">
            <span className="material-symbols-outlined text-[48px] text-border-gray">receipt_long</span>
            <p className="font-body-md text-secondary mt-sm">No orders in this category.</p>
          </div>
        ) : (
          <div className="space-y-base">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white border border-border-gray rounded shadow-sm p-base">
                {/* Order row header */}
                <div className="flex items-start justify-between gap-base flex-wrap">
                  <div className="space-y-xs">
                    <div className="flex items-center gap-sm flex-wrap">
                      <span className="font-mono text-xs text-secondary select-all">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="font-label-bold text-label-bold text-primary">
                      {order.firstItemName}
                      {order.itemCount > 1 && (
                        <span className="text-secondary font-normal"> +{order.itemCount - 1} more</span>
                      )}
                    </p>
                    <p className="font-body-sm text-secondary text-xs">
                      {order.recipientName} · {order.city}
                    </p>
                  </div>
                  <div className="text-right space-y-xs">
                    <p className="font-price-lg text-price-lg text-primary">{formatPrice(order.totalAmount)}</p>
                    <p className="font-body-sm text-secondary text-xs">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Action row */}
                <div className="flex gap-sm flex-wrap mt-base pt-sm border-t border-border-gray/40">
                  <Link
                    href={`/seller/orders/${order.id}`}
                    className="flex items-center gap-xs px-base py-1.5 border border-border-gray text-primary font-label-bold text-label-bold rounded hover:bg-surface-container transition-colors cursor-pointer text-xs"
                  >
                    <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                    View Details
                  </Link>

                  {order.status === "paid" && (
                    <button
                      onClick={() => handleConfirm(order.id)}
                      disabled={actionLoadingId === order.id}
                      className="flex items-center gap-xs px-base py-1.5 bg-primary text-white font-label-bold text-label-bold rounded hover:opacity-90 transition-all active:scale-95 cursor-pointer text-xs disabled:opacity-60"
                    >
                      {actionLoadingId === order.id ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[15px]">check</span>
                      )}
                      Confirm Order
                    </button>
                  )}

                  {order.status === "confirmed" && (
                    <button
                      onClick={() => { setShipModal({ orderId: order.id }); setAwbOverride(""); }}
                      disabled={actionLoadingId === order.id}
                      className="flex items-center gap-xs px-base py-1.5 bg-primary text-white font-label-bold text-label-bold rounded hover:opacity-90 transition-all active:scale-95 cursor-pointer text-xs disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[15px]">local_shipping</span>
                      Mark as Shipped
                    </button>
                  )}

                  {order.icarryLabelUrl && (
                    <a
                      href={order.icarryLabelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-xs px-base py-1.5 border border-border-gray text-secondary font-label-bold text-label-bold rounded hover:bg-surface-container transition-colors cursor-pointer text-xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">print</span>
                      Print Label
                    </a>
                  )}

                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-xs px-base py-1.5 border border-border-gray text-secondary font-label-bold text-label-bold rounded hover:bg-surface-container transition-colors cursor-pointer text-xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">location_on</span>
                      Track Package
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Ship modal */}
      {shipModal && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-base">
          <div className="bg-white border border-border-gray rounded-lg max-w-[384px] w-full p-base shadow-xl animate-fade-in-up space-y-base">
            <div className="flex justify-between items-center border-b border-border-gray pb-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary">Mark as Shipped</h3>
              <button onClick={() => setShipModal(null)} className="text-secondary hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="font-body-sm text-secondary">
              If iCarry already booked the shipment, the AWB is pre-filled. Optionally override with a manual tracking ID.
            </p>
            <div className="space-y-xs">
              <label className="font-label-bold text-label-bold text-on-surface">AWB / Tracking Number (Optional)</label>
              <input
                type="text"
                value={awbOverride}
                onChange={(e) => setAwbOverride(e.target.value)}
                placeholder="Leave blank to use iCarry AWB"
                className="w-full border border-border-gray rounded p-sm text-body-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="flex gap-base justify-end pt-sm border-t border-border-gray">
              <button
                onClick={() => setShipModal(null)}
                className="px-base py-2 border border-border-gray text-secondary rounded font-label-bold text-label-bold hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleShip}
                disabled={actionLoadingId === shipModal.orderId}
                className="px-base py-2 bg-primary text-white rounded font-label-bold text-label-bold hover:opacity-90 active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-xs"
              >
                {actionLoadingId === shipModal.orderId ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                )}
                Confirm Shipment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
