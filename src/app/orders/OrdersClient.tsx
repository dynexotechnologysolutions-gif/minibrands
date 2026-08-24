"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import HomeHeader from "@/components/home/HomeHeader";
import OrderFilters from "@/components/orders/OrderFilters";
import OrderCard from "@/components/orders/OrderCard";
import EmptyOrders from "@/components/orders/EmptyOrders";
import { CheckCircle2, Clock3, Truck, Undo2 } from "lucide-react";
import { cancelOrderAction } from "@/actions/order-user-actions";
import { reserveCartItem } from "@/actions/cart-reserve.action";

interface OrderItemInfo {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string | null;
}

interface OrderInfo {
  id: string;
  status: string;
  orderStatus: string;
  totalAmount: number;
  createdAt: string | Date;
  sellerName: string;
  items: OrderItemInfo[];
}

interface OrdersClientProps {
  initialOrders: OrderInfo[];
  userProfile: React.ComponentProps<typeof HomeHeader>["userProfile"];
  cartCount: number;
  sellerHref: string;
}

export default function OrdersClient({
  initialOrders,
  userProfile,
  cartCount,
  sellerHref,
}: OrdersClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderInfo[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [activeStatus, setActiveStatus] = useState("all");
  const [, startTransition] = useTransition();

  // Dialog / Toast states
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Rate Modal States
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateProductName, setRateProductName] = useState("");
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState("");

  // Track Modal States
  const [showTrackModal, setShowTrackModal] = useState(false);

  // Toast helper
  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 4000);
  };

  // Actions
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;

    try {
      const res = await cancelOrderAction(orderId);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, orderStatus: "CANCELLED", status: "CANCELLED" }
              : o
          )
        );
        triggerToast("Order cancelled successfully.");
      } else {
        triggerToast(res.error?.message || "Failed to cancel order.", "error");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      triggerToast(errMsg, "error");
    }
  };

  const handleReturnOrder = (orderId: string) => {
    router.push(`/orders/${orderId}/return`);
  };

  const handleBuyAgain = async (productId: string, variantId: string) => {
    try {
      const res = await reserveCartItem({ productId, variantId, quantity: 1 });
      if (res.success) {
        triggerToast("Item added to cart! Redirecting...", "success");
        startTransition(() => {
          router.push("/cart");
        });
      } else {
        triggerToast(res.error?.message || "Failed to reserve item.", "error");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to add item to cart.";
      triggerToast(errMsg, "error");
    }
  };

  const handleRateProduct = (productId: string, productName: string) => {
    console.debug("Rating product", productId);
    setRateProductName(productName);
    setRatingValue(5);
    setReviewText("");
    setShowRateModal(true);
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setShowRateModal(false);
    triggerToast("Thank you! Your product review has been submitted successfully.", "success");
  };

  const handleTrackOrder = (orderId: string) => {
    console.debug("Tracking order", orderId);
    setShowTrackModal(true);
  };

  const handleSupport = (orderId: string) => {
    triggerToast(`Connecting to Support Desk for Order ${orderId.substring(0, 8)}...`, "success");
  };

  const handleChangeAddress = (orderId: string) => {
    console.debug("Changing address for order", orderId);
    triggerToast("Change address request submitted to the boutique seller.", "success");
  };

  // Filter & Sort Logic
  const filteredOrders = orders
    .filter((order) => {
      // 1. Text Search query
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Status Filter query
      if (activeStatus === "all") return true;
      const currentStatus = (order.orderStatus || order.status || "").toLowerCase();

      if (activeStatus === "processing") {
        return ["created", "paid", "confirmed", "processing", "packed"].includes(currentStatus);
      }
      if (activeStatus === "shipped") {
        return ["shipped", "out_for_delivery", "out for delivery"].includes(currentStatus);
      }
      if (activeStatus === "delivered") {
        return ["delivered", "completed"].includes(currentStatus);
      }
      if (activeStatus === "cancelled") {
        return currentStatus === "cancelled";
      }
      if (activeStatus === "returned") {
        return ["returned", "refunded", "disputed"].includes(currentStatus);
      }

      return true;
    })
    .sort((a, b) => {
      // Sort logic
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

  // Dynamically calculate statistics
  const deliveredCount = orders.filter((o) => ["delivered", "completed"].includes((o.orderStatus || o.status || "").toLowerCase())).length;
  const processingCount = orders.filter((o) => ["created", "paid", "confirmed", "processing", "packed"].includes((o.orderStatus || o.status || "").toLowerCase())).length;
  const shippedCount = orders.filter((o) => ["shipped", "out_for_delivery", "out for delivery"].includes((o.orderStatus || o.status || "").toLowerCase())).length;
  const returnedCount = orders.filter((o) => ["returned", "refunded", "disputed"].includes((o.orderStatus || o.status || "").toLowerCase())).length;

  return (
    <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink selection:bg-vl-primary/20 pb-12">
      {/* Navigation Header */}
      <HomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      {/* Toast Alert */}
      {alertMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div
            className={`px-4 py-3 border rounded-xl shadow-vl-floating flex items-center gap-2 font-bold text-xs ${
              alertMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {alertMessage.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{alertMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Order List Section */}
      <main className="vl-section-shell flex w-full flex-grow flex-col py-6 sm:py-8 lg:py-10">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="font-vl-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-vl-ink mb-2">My Orders</h1>
          <p className="text-sm sm:text-base text-vl-muted max-w-[640px] leading-relaxed">
            Track every purchase, manage deliveries, download invoices, and reorder your favorites.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Delivered", count: deliveredCount, Icon: CheckCircle2, activeKey: "delivered", bg: "bg-emerald-50", color: "text-emerald-600" },
            { label: "Processing", count: processingCount, Icon: Clock3, activeKey: "processing", bg: "bg-amber-50", color: "text-amber-600" },
            { label: "Shipped", count: shippedCount, Icon: Truck, activeKey: "shipped", bg: "bg-sky-50", color: "text-sky-600" },
            { label: "Returns", count: returnedCount, Icon: Undo2, activeKey: "returned", bg: "bg-slate-50", color: "text-slate-600" },
          ].map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setActiveStatus(s.activeKey === activeStatus ? "all" : s.activeKey)}
              className={`text-left bg-white border rounded-xl p-3.5 flex items-center gap-3 transition-all group ${
                activeStatus === s.activeKey ? "border-vl-primary shadow-sm bg-vl-primary/[0.02]" : "border-vl-border hover:border-vl-border/80 hover:shadow-sm"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <s.Icon className="w-[18px] h-[18px] stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-vl-muted uppercase tracking-widest truncate">{s.label}</p>
                <p className="font-vl-heading font-extrabold text-xl leading-none text-vl-ink mt-0.5">{s.count}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {/* Search, Sort and Filter Tabs */}
          <OrderFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
            totalCount={orders.length}
            filteredCount={filteredOrders.length}
          />

          {/* Cards Area */}
          {filteredOrders.length === 0 ? (
            <EmptyOrders />
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onCancel={handleCancelOrder}
                  onReturn={handleReturnOrder}
                  onBuyAgain={handleBuyAgain}
                  onRate={handleRateProduct}
                  onTrack={handleTrackOrder}
                  onSupport={handleSupport}
                  onChangeAddress={handleChangeAddress}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Rate Product Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 bg-vl-ink/45 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-vl-card border border-vl-border rounded-vl-card max-w-md w-full p-6 space-y-6 shadow-vl-floating animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-vl-border/60 pb-3">
              <h3 className="font-vl-heading text-lg font-extrabold text-vl-ink">Rate & Review</h3>
              <button
                onClick={() => setShowRateModal(false)}
                className="text-vl-muted hover:text-vl-ink cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={submitReview} className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-vl-muted">Reviewing:</p>
                <p className="font-vl-heading font-bold text-sm text-vl-ink truncate">{rateProductName}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-vl-ink">Star Rating</label>
                <div className="flex gap-1 text-[28px] text-vl-accent">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      className="cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    >
                      <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: ` 'FILL' ${ratingValue >= star ? 1 : 0} ` }}>
                        grade
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-vl-ink">Comments</label>
                <textarea
                  className="w-full border border-vl-border rounded-xl text-sm outline-none focus:border-vl-primary p-3 font-vl-body text-vl-ink bg-vl-surface"
                  rows={4}
                  placeholder="Share your experience buying from this boutique..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3 justify-end border-t border-vl-border/60 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-5 py-2.5 border border-vl-border text-vl-muted rounded-xl font-bold text-xs hover:bg-vl-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-vl-primary text-white rounded-xl font-bold text-xs hover:bg-vl-primary-strong active:scale-95 transition-all cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Track Package Modal */}
      {showTrackModal && (
        <div className="fixed inset-0 z-50 bg-vl-ink/45 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-vl-card border border-vl-border rounded-vl-card max-w-md w-full p-6 space-y-6 shadow-vl-floating animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-vl-border/60 pb-3">
              <h3 className="font-vl-heading text-lg font-extrabold text-vl-ink">Package Tracking</h3>
              <button
                onClick={() => setShowTrackModal(false)}
                className="text-vl-muted hover:text-vl-ink cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4 py-2">
              <div className="bg-vl-surface border border-vl-border rounded-xl p-3">
                <p className="text-[10px] font-bold text-vl-muted uppercase tracking-wider">Logistics Carrier</p>
                <p className="font-vl-heading font-extrabold text-sm text-vl-ink">BlueDart Express Cargo</p>
                <p className="font-mono text-[11px] text-vl-muted mt-0.5">Waybill: BD984713912IN</p>
              </div>
              <div className="space-y-4 relative pl-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                <div className="relative z-10 flex gap-3 items-start">
                  <div className="w-2.5 h-2.5 bg-vl-success rounded-full ring-4 ring-vl-success/20 mt-1.5 shrink-0"></div>
                  <div>
                    <p className="font-bold text-xs text-vl-ink">In Transit - Out For Delivery</p>
                    <p className="text-[10px] text-vl-muted">Chennai Distribution Center • 08:30 AM</p>
                  </div>
                </div>
                <div className="relative z-10 flex gap-3 items-start">
                  <div className="w-2.5 h-2.5 bg-vl-primary rounded-full ring-4 ring-vl-primary/20 mt-1.5 shrink-0"></div>
                  <div>
                    <p className="font-bold text-xs text-vl-ink">Package Departed Hub</p>
                    <p className="text-[10px] text-vl-muted">Guindy Sorting Center • Yesterday, 04:15 PM</p>
                  </div>
                </div>
                <div className="relative z-10 flex gap-3 items-start">
                  <div className="w-2.5 h-2.5 bg-vl-primary rounded-full ring-4 ring-vl-primary/20 mt-1.5 shrink-0"></div>
                  <div>
                    <p className="font-bold text-xs text-vl-ink">Dispatched from Boutique</p>
                    <p className="text-[10px] text-vl-muted">Boutique Hub • 2 days ago, 11:00 AM</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-vl-border/60 pt-4 flex justify-end">
              <button
                onClick={() => setShowTrackModal(false)}
                className="px-6 py-2.5 bg-vl-primary text-white rounded-xl font-bold text-xs hover:bg-vl-primary-strong active:scale-95 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
