"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import HomeHeader from "@/components/home/HomeHeader";
import OrderFilters from "@/components/orders/OrderFilters";
import OrderCard from "@/components/orders/OrderCard";
import EmptyOrders from "@/components/orders/EmptyOrders";
import { cancelOrderAction, returnOrderAction } from "@/actions/order-user-actions";
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
  userProfile: any;
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
  const [isPending, startTransition] = useTransition();

  // Dialog / Toast states
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Rate Modal States
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateProductName, setRateProductName] = useState("");
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState("");

  // Track Modal States
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackOrderId, setTrackOrderId] = useState("");

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
        // Update local status
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: "cancelled", orderStatus: "cancelled" } : o
          )
        );
        triggerToast("Order cancelled successfully.", "success");
        startTransition(() => {
          router.refresh();
        });
      } else {
        triggerToast(res.error?.message || "Failed to cancel order.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("An error occurred. Please try again.", "error");
    }
  };

  const handleReturnOrder = (orderId: string) => {
    router.push(`/orders/${orderId}/return`);
  };

  const handleBuyAgain = async (productId: string, variantId: string) => {
    try {
      const res = await reserveCartItem({ productId, variantId, quantity: 1 });
      if (res.success) {
        triggerToast("Product added to cart. Redirecting...", "success");
        router.push("/cart");
      } else {
        triggerToast(res.error?.message || "Product is out of stock.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to reorder. Please try again.", "error");
    }
  };

  const handleRateProduct = (productId: string, productName: string) => {
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
    setTrackOrderId(orderId);
    setShowTrackModal(true);
  };

  const handleSupport = (orderId: string) => {
    triggerToast(`Connecting to Support Desk for Order ${orderId.substring(0, 8)}...`, "success");
  };

  const handleChangeAddress = (orderId: string) => {
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

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col w-full">
      {/* Navigation Header */}
      <HomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      {/* Toast Alert */}
      {alertMessage && (
        <div className="fixed bottom-base right-base z-50 animate-fade-in-up">
          <div
            className={`p-base border rounded-lg shadow-lg flex items-center gap-sm font-label-bold text-label-bold ${
              alertMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <span className="material-symbols-outlined">
              {alertMessage.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{alertMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Order List Section */}
      <main className="max-w-container-max mx-auto px-4 md:px-lg py-xl flex-grow w-full">
        {/* Header Section */}
        <div className="mb-xl">
          <h1 className="font-headline-lg text-headline-lg text-primary">My Orders</h1>
          <p className="font-body-lg text-body-lg text-secondary">Track, manage and review your purchases</p>
        </div>

        <div className="space-y-lg">
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
            <div className="space-y-base">
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
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-base">
          <div className="bg-white border border-border-gray rounded-lg max-w-[448px] w-full p-base space-y-base shadow-xl animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-border-gray pb-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary">Rate & Review</h3>
              <button
                onClick={() => setShowRateModal(false)}
                className="text-secondary hover:text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={submitReview} className="space-y-base">
              <div>
                <p className="font-body-sm text-secondary">Reviewing:</p>
                <p className="font-label-bold text-label-bold text-primary truncate">{rateProductName}</p>
              </div>
              <div className="space-y-xs">
                <label className="font-label-bold text-label-bold text-on-surface">Star Rating</label>
                <div className="flex gap-xs text-[28px] text-accent-yellow">
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
              <div className="space-y-xs">
                <label className="font-label-bold text-label-bold text-on-surface">Comments</label>
                <textarea
                  className="w-full border-border-gray rounded text-body-sm outline-none focus:border-primary p-sm"
                  rows={4}
                  placeholder="Share your experience buying from this boutique..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-base justify-end border-t border-border-gray pt-base">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-base py-2 border border-border-gray text-secondary rounded font-label-bold text-label-bold hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-base py-2 bg-primary text-white rounded font-label-bold text-label-bold hover:opacity-90 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-base">
          <div className="bg-white border border-border-gray rounded-lg max-w-[448px] w-full p-base space-y-base shadow-xl animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-border-gray pb-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary">Package Tracking</h3>
              <button
                onClick={() => setShowTrackModal(false)}
                className="text-secondary hover:text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-lg py-sm">
              <div>
                <p className="font-body-sm text-secondary">Logistics Carrier:</p>
                <p className="font-label-bold text-label-bold text-primary">BlueDart Express Cargo</p>
                <p className="font-body-sm text-[11px] text-secondary">Waybill No: BD984713912IN</p>
              </div>
              <div className="space-y-base relative pl-base border-l border-border-gray">
                <div className="relative">
                  <div className="absolute -left-[23px] top-[2px] w-3 h-3 bg-success-green rounded-full border-2 border-white"></div>
                  <p className="font-label-bold text-label-bold text-primary">In Transit - Out For Delivery</p>
                  <p className="font-body-sm text-secondary text-[11px]">Chennai Distribution Center • 08:30 AM</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[23px] top-[2px] w-3 h-3 bg-primary rounded-full border-2 border-white"></div>
                  <p className="font-label-bold text-label-bold text-primary">Package Departed Hub</p>
                  <p className="font-body-sm text-secondary text-[11px]">Guindy Sorting Center • Yesterday, 04:15 PM</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[23px] top-[2px] w-3 h-3 bg-primary rounded-full border-2 border-white"></div>
                  <p className="font-label-bold text-label-bold text-primary">Dispatched from Boutique</p>
                  <p className="font-body-sm text-secondary text-[11px]">Boutique Hub • 2 days ago, 11:00 AM</p>
                </div>
              </div>
            </div>
            <div className="border-t border-border-gray pt-base flex justify-end">
              <button
                onClick={() => setShowTrackModal(false)}
                className="px-xl py-2 bg-primary text-white rounded font-label-bold text-label-bold hover:opacity-90 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-surface-container border-t border-border-gray w-full mt-xxl py-xl px-4 md:px-lg">
        <div className="max-w-container-max mx-auto grid grid-cols-2 md:grid-cols-4 gap-lg">
          <div>
            <h4 className="font-headline-sm text-headline-sm font-bold text-primary mb-base">MINIBRANDS</h4>
            <p className="font-body-sm text-body-sm text-on-surface">Experience the joy of high-density shopping with the most trusted brands in India.</p>
          </div>
          <div>
            <h5 className="font-label-bold text-label-bold text-primary mb-md">About</h5>
            <ul className="space-y-sm">
              <li><a className="font-body-sm text-body-sm text-secondary hover:text-primary transition-colors" href="#">About Us</a></li>
              <li><a className="font-body-sm text-body-sm text-secondary hover:text-primary transition-colors" href="#">Contact Us</a></li>
              <li><a className="font-body-sm text-body-sm text-secondary hover:text-primary transition-colors" href="#">Seller Policies</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-label-bold text-label-bold text-primary mb-md">Support</h5>
            <ul className="space-y-sm">
              <li><a className="font-body-sm text-body-sm text-secondary hover:text-primary transition-colors" href="#">Help Center</a></li>
              <li><a className="font-body-sm text-body-sm text-secondary hover:text-primary transition-colors" href="#">Terms of Service</a></li>
              <li><a className="font-body-sm text-body-sm text-secondary hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-label-bold text-label-bold text-primary mb-md">Connect</h5>
            <div className="flex gap-base">
              <span className="material-symbols-outlined text-secondary hover:text-primary cursor-pointer">face_nod</span>
              <span className="material-symbols-outlined text-secondary hover:text-primary cursor-pointer">hub</span>
              <span className="material-symbols-outlined text-secondary hover:text-primary cursor-pointer">alternate_email</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-lg">© 2024 MINIBRANDS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
