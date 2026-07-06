"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confirmOrderAction } from "@/actions/order-confirm.action";
import { shipOrderAction } from "@/actions/order-ship.action";
import StatusBadge from "@/components/order/StatusBadge";
import {
  Package,
  Search,
  CheckCircle,
  Truck,
  Printer,
  ExternalLink,
  MapPin,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText
} from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
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
    `₹${(amt / 100).toLocaleString("en-IN")}`;

  const filteredOrders = orders.filter((o) => {
    // 1. Tab match
    const tab = TABS.find((t) => t.key === activeTab);
    const matchesTab = activeTab === "all" || (tab?.statuses.includes(o.status) ?? true);
    if (!matchesTab) return false;

    // 2. Search query match
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.buyerName.toLowerCase().includes(q) ||
      o.recipientName.toLowerCase().includes(q) ||
      o.firstItemName.toLowerCase().includes(q) ||
      o.city.toLowerCase().includes(q)
    );
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

  const newOrdersCount = orders.filter((o) => o.status === "paid").length;
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const completedCount = orders.filter((o) => ["delivered", "completed"].includes(o.status)).length;

  return (
    <div className="space-y-lg">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[110] animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 font-bold text-xs border ${
              toast.type === "success"
                ? "bg-emerald-900 text-white border-emerald-800"
                : "bg-red-900 text-white border-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-base border-b border-border-gray/40 pb-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface">
            Order Management & Fulfillment
          </h1>
          <p className="text-body-sm text-text-muted mt-0.5">
            Boutique: <span className="font-bold text-on-surface">{sellerName}</span> &bull; Manage live orders, iCarry AWB labels, and shipping dispatches.
          </p>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-base">
        <div className="bg-surface-container-lowest border border-border-gray p-base rounded-xl shadow-xs">
          <span className="text-text-muted font-label-bold text-label-bold uppercase text-[10px]">Total Orders</span>
          <p className="font-headline-lg text-2xl font-black text-on-surface mt-1">{orders.length}</p>
        </div>

        <div className="bg-surface-container-lowest border border-border-gray p-base rounded-xl shadow-xs">
          <span className="text-text-muted font-label-bold text-label-bold uppercase text-[10px]">New Orders (Action Needed)</span>
          <p className="font-headline-lg text-2xl font-black text-amber-600 mt-1">{newOrdersCount}</p>
        </div>

        <div className="bg-surface-container-lowest border border-border-gray p-base rounded-xl shadow-xs">
          <span className="text-text-muted font-label-bold text-label-bold uppercase text-[10px]">In Transit / Shipped</span>
          <p className="font-headline-lg text-2xl font-black text-indigo-600 mt-1">{shippedCount}</p>
        </div>

        <div className="bg-surface-container-lowest border border-border-gray p-base rounded-xl shadow-xs">
          <span className="text-text-muted font-label-bold text-label-bold uppercase text-[10px]">Completed Orders</span>
          <p className="font-headline-lg text-2xl font-black text-success-green mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-base bg-surface-container-lowest border border-border-gray p-base rounded-xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer, item, city..."
            className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border-gray rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            suppressHydrationWarning
          />
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar w-full sm:w-auto">
          {TABS.map((tab) => {
            const count =
              tab.key === "all" ? orders.length : orders.filter((o) => tab.statuses.includes(o.status)).length;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                suppressHydrationWarning
                className={`px-3 py-1.5 rounded-full font-label-bold text-xs whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-primary text-on-primary font-bold shadow-xs"
                    : "bg-surface border border-border-gray hover:bg-surface-container-low text-text-muted"
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-surface-container text-text-muted"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List / Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="border border-dashed border-border-gray rounded-2xl bg-surface-container-lowest p-xxl text-center max-w-[540px] w-full mx-auto shadow-xs space-y-md">
          <div className="w-16 h-16 bg-surface-container text-text-muted rounded-full flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-on-surface">No Orders Found</h2>
            <p className="text-text-muted text-xs mt-1 leading-relaxed">
              No orders match the selected filter category or search criteria.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-base">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-surface-container-lowest border border-border-gray rounded-2xl p-base sm:p-lg shadow-xs hover:border-border-gray/80 transition-all space-y-md"
            >
              {/* Order Header Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-base border-b border-border-gray/50 pb-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-extrabold text-xs text-on-surface">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <StatusBadge status={order.status} />
                    {order.icarryAwbNumber && (
                      <span className="text-[10px] font-mono font-bold bg-surface-container text-text-muted px-2 py-0.5 rounded border border-border-gray">
                        AWB: {order.icarryAwbNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="font-headline-sm text-lg font-black text-on-surface">
                    {formatPrice(order.totalAmount)}
                  </p>
                  <p className="text-xs text-text-muted font-medium">
                    {order.recipientName} &bull; {order.city}
                  </p>
                </div>
              </div>

              {/* Order Content Summary */}
              <div className="flex items-center justify-between gap-base flex-wrap">
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface">
                    {order.firstItemName}
                    {order.itemCount > 1 && (
                      <span className="text-text-muted font-normal"> +{order.itemCount - 1} additional item(s)</span>
                    )}
                  </p>
                  <p className="text-body-sm text-text-muted mt-0.5">
                    Customer: <span className="font-semibold text-on-surface">{order.buyerName}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-base pt-sm border-t border-border-gray/40">
                <div className="flex items-center gap-xs flex-wrap">
                  <Link
                    href={`/seller/orders/${order.id}`}
                    className="inline-flex items-center gap-1 px-3.5 py-2 border border-border-gray hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Full Details</span>
                  </Link>

                  {order.icarryLabelUrl && (
                    <a
                      href={order.icarryLabelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3.5 py-2 border border-border-gray hover:bg-surface-container text-secondary font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print iCarry Label</span>
                    </a>
                  )}

                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3.5 py-2 border border-border-gray hover:bg-surface-container text-secondary font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Track Shipment</span>
                    </a>
                  )}
                </div>

                {/* Primary Fulfillment Action Controls */}
                <div className="flex items-center gap-xs">
                  {order.status === "paid" && (
                    <button
                      onClick={() => handleConfirm(order.id)}
                      disabled={actionLoadingId === order.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {actionLoadingId === order.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>Confirm Order (Book iCarry)</span>
                    </button>
                  )}

                  {order.status === "confirmed" && (
                    <button
                      onClick={() => {
                        setShipModal({ orderId: order.id });
                        setAwbOverride("");
                      }}
                      disabled={actionLoadingId === order.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Mark as Shipped</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ship Modal */}
      {shipModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-base">
          <div className="bg-surface-container-lowest border border-border-gray rounded-2xl max-w-[480px] w-full p-base sm:p-lg shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-md">
            <div className="flex justify-between items-center border-b border-border-gray pb-sm">
              <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">Mark Order as Shipped</h3>
              <button
                onClick={() => setShipModal(null)}
                className="text-text-muted hover:text-on-surface p-1 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-body-sm text-text-muted leading-relaxed">
              If iCarry automatically generated the tracking number, the AWB is saved. Optionally enter a manual tracking/AWB ID below.
            </p>
            <div className="space-y-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-text-muted">
                AWB / Tracking Number (Optional)
              </label>
              <input
                type="text"
                value={awbOverride}
                onChange={(e) => setAwbOverride(e.target.value)}
                placeholder="Leave blank to use default iCarry AWB"
                className="w-full border border-border-gray rounded-xl p-3 text-body-sm font-bold text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-base justify-end pt-sm border-t border-border-gray">
              <button
                onClick={() => setShipModal(null)}
                className="px-lg py-2 border border-border-gray text-secondary rounded-xl font-bold text-xs hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleShip}
                disabled={actionLoadingId === shipModal.orderId}
                className="px-xl py-2 bg-primary text-on-primary rounded-xl font-bold text-xs hover:opacity-90 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                {actionLoadingId === shipModal.orderId ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Truck className="w-3.5 h-3.5" />
                )}
                <span>Confirm Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
