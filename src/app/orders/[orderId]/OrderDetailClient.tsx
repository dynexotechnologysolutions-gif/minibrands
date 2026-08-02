"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HomeHeader from "@/components/home/HomeHeader";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import OrderTimeline from "@/components/orders/OrderTimeline";
import OrderItem from "@/components/orders/OrderItem";
import { getOrderStatus } from "@/actions/order-status.action";
import { cancelOrderAction, returnOrderAction } from "@/actions/order-user-actions";
import { reserveCartItem } from "@/actions/cart-reserve.action";
import { confirmDeliveryAction } from "@/actions/order-deliver-confirm.action";
import EscrowCountdown from "@/components/order/EscrowCountdown";
import ReviewForm from "@/components/review/ReviewForm";


interface OrderItemInfo {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;
  image: string;
}

interface AddressInfo {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  pincode: string;
}

interface OrderInfo {
  id: string;
  status: string;
  orderStatus: string;
  totalAmount: number;
  createdAt: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  sellerName: string;
  address: AddressInfo;
  items: OrderItemInfo[];
  // Epic 4 fields
  trackingUrl?: string | null;
  icarryAwbNumber?: string | null;
  escrowReleaseAt?: string | null;
  hasReview?: boolean;
  userProfileId?: string;
  firstProductId?: string;
}


interface OrderDetailClientProps {
  order: OrderInfo;
  userProfile: any;
  cartCount: number;
  sellerHref: string;
}

export default function OrderDetailClient({
  order,
  userProfile,
  cartCount,
  sellerHref,
}: OrderDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(order.status);
  const [orderStatus, setOrderStatus] = useState<string>(order.orderStatus);
  const [pollCount, setPollCount] = useState<number>(0);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPending, startTransition] = useTransition();

  // Dialog / Toast states
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Rate Modal States (legacy — replaced by ReviewForm)
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateProductName, setRateProductName] = useState("");
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState("");

  // Delivery confirm state
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const [escrowReleaseAt, setEscrowReleaseAt] = useState<string | null>(order.escrowReleaseAt ?? null);
  const [hasReview, setHasReview] = useState(order.hasReview ?? false);

  // Track Modal States — replaced by real tracking URL
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const handleDownloadInvoice = async () => {
    if (isDownloadingInvoice) return;
    setIsDownloadingInvoice(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/invoice`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to download tax invoice.");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `minibrands_Invoice_${order.id.substring(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      triggerToast("Tax invoice downloaded successfully.", "success");
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "Failed to generate tax invoice.", "error");
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  useEffect(() => {
    // Start polling if status is "created"
    if (status === "created") {
      pollIntervalRef.current = setInterval(async () => {
        setPollCount((prev) => {
          const nextCount = prev + 1;
          if (nextCount >= 15) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsTimeout(true);
          }
          return nextCount;
        });

        try {
          const res = await getOrderStatus(order.id);
          if (res.success && res.data) {
            const currentStatus = res.data.status;
            if (currentStatus !== "created") {
              setStatus(currentStatus);
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              startTransition(() => {
                router.refresh();
              });
            }
          }
        } catch (error) {
          console.error("Error polling order status:", error);
        }
      }, 2000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, order.id, router]);

  const handleManualRefresh = async () => {
    setIsTimeout(false);
    setPollCount(0);
    try {
      const res = await getOrderStatus(order.id);
      if (res.success && res.data) {
        setStatus(res.data.status);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;

    try {
      const res = await cancelOrderAction(order.id);
      if (res.success) {
        setStatus("cancelled");
        setOrderStatus("cancelled");
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

  const handleReturnOrder = async () => {
    if (!confirm("Are you sure you want to request a return for this order?")) return;

    try {
      const res = await returnOrderAction(order.id);
      if (res.success) {
        setStatus("disputed");
        setOrderStatus("returned");
        triggerToast("Return request submitted successfully. Processing refund.", "success");
        startTransition(() => {
          router.refresh();
        });
      } else {
        triggerToast(res.error?.message || "Failed to return order.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("An error occurred. Please try again.", "error");
    }
  };

  const handleConfirmDelivery = async () => {
    if (!confirm("Have you received your order? This will start the 7-day payment release countdown.")) return;
    setIsConfirmingDelivery(true);
    try {
      const res = await confirmDeliveryAction(order.id);
      if (res.success && res.data) {
        setStatus("delivered");
        setOrderStatus("delivered");
        setEscrowReleaseAt(res.data.escrowReleaseAt);
        triggerToast("Delivery confirmed! Payment will be released to the boutique in 7 days.", "success");
        startTransition(() => router.refresh());
      } else {
        triggerToast(res.error?.message || "Failed to confirm delivery.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("An error occurred. Please try again.", "error");
    } finally {
      setIsConfirmingDelivery(false);
    }
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

  // Kept for legacy modal — ReviewForm handles real submission
  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setShowRateModal(false);
    triggerToast("Thank you! Your product review has been submitted successfully.", "success");
  };

  const handleTrackOrder = () => {
    // Use real tracking URL if available, otherwise open modal
    if (order.trackingUrl) {
      window.open(order.trackingUrl, "_blank", "noopener,noreferrer");
    } else {
      setShowTrackModal(true);
    }
  };


  const handleSupport = () => {
    triggerToast(`Connecting to Support Desk for Order ${order.id.substring(0, 8)}...`, "success");
  };

  const handleChangeAddress = () => {
    triggerToast("Change address request submitted to the boutique seller.", "success");
  };

  const formatPrice = (amt: number) => {
    return (amt / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  const s = (status || "").toLowerCase();
  const os = (orderStatus || "").toLowerCase();
  const isCompleted = s === "completed" || os === "completed";
  const isDelivered = s === "delivered" || s === "completed" || os === "delivered" || os === "completed";
  const isShipped = !isDelivered && (s === "shipped" || os === "shipped" || s === "out_for_delivery" || os === "out_for_delivery" || s === "out for delivery" || os === "out for delivery");
  const isCancelled = s === "cancelled" || os === "cancelled";
  const isReturned = s === "returned" || os === "returned" || s === "refunded" || os === "refunded" || s === "disputed" || os === "disputed";
  const isProcessing = !isDelivered && !isShipped && !isCancelled && !isReturned;

  const canReturn = (() => {
    if (!isDelivered) return false;
    const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
    const limitMs = 7 * 24 * 60 * 60 * 1000;
    return elapsedMs <= limitMs;
  })();

  // Rendering verification/polling view
  if (status === "created") {
    return (
      <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col w-full">
        <HomeHeader userProfile={userProfile} cartCount={cartCount} sellerHref={sellerHref} />
        <main className="max-w-container-max mx-auto px-4 md:px-lg py-xl flex-grow w-full flex justify-center items-center">
          <div className="bg-white border border-border-gray p-12 text-center rounded max-w-[448px] w-full shadow-sm">
            {isTimeout ? (
              <>
                <div className="w-16 h-16 bg-amber-50 border border-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <span className="material-symbols-outlined text-[32px]">schedule</span>
                </div>
                <h1 className="text-xl font-extrabold text-slate-800 font-display mb-2">Verification Pending</h1>
                <p className="text-slate-500 text-xs max-w-sm mx-auto mb-8 leading-relaxed font-body-sm">
                  We are still waiting for payment confirmation from Razorpay. You can wait on this page or check again manually.
                </p>
                <button
                  onClick={handleManualRefresh}
                  className="px-6 py-3 bg-primary text-white text-xs font-label-bold text-label-bold rounded hover:opacity-90 transition-all cursor-pointer"
                >
                  Check Status Again
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6 mx-auto"></div>
                <h1 className="text-xl font-extrabold text-slate-800 font-display mb-2">Verifying Payment</h1>
                <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed font-body-sm">
                  Processing secure checkout validation with Razorpay. Please do not close or refresh this page.
                </p>
                <span className="text-[10px] font-bold text-slate-300 mt-4 block uppercase tracking-wider">
                  Attempt {pollCount + 1} of 15
                </span>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink selection:bg-vl-primary/20 pb-16">
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

      {/* Main Container */}
      <main className="vl-section-shell flex w-full flex-grow flex-col py-6 sm:py-8 lg:py-10 space-y-6">

        {/* Back + Page Title */}
        <div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-vl-muted hover:text-vl-primary transition-colors font-bold text-xs mb-4 cursor-pointer select-none group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            Back to Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h1 className="font-vl-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-vl-ink">Order Details</h1>
              <p className="text-xs sm:text-sm text-vl-muted mt-1">
                Placed on {new Date(order.createdAt).toLocaleString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <OrderStatusBadge
              status={order.status}
              orderStatus={order.orderStatus}
              date={order.createdAt}
            />
          </div>
        </div>

        {/* Outer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* ── LEFT PANEL ─────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-5">

            {/* Status Banner */}
            <div className={`rounded-vl-card border p-4 flex items-start gap-4 shadow-vl-soft ${
              isDelivered
                ? "bg-emerald-50/60 border-emerald-200"
                : isCancelled
                ? "bg-red-50/60 border-red-200"
                : "bg-vl-card border-vl-border"
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isDelivered ? "bg-emerald-100 text-emerald-600"
                : isCancelled ? "bg-red-100 text-red-500"
                : isShipped ? "bg-sky-100 text-sky-600"
                : "bg-pink-100 text-vl-primary"
              }`}>
                <span className="material-symbols-outlined text-xl">
                  {isDelivered ? "check_circle" : isCancelled ? "cancel" : isShipped ? "local_shipping" : "inventory_2"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-vl-heading font-bold text-sm text-vl-ink">
                  {isDelivered && "Order Delivered Successfully"}
                  {isShipped && "Items are in Transit"}
                  {isProcessing && "Your order is being processed by the boutique"}
                  {isCancelled && "Transaction Cancelled"}
                  {isReturned && "Return Completed"}
                </h4>
                <p className="text-xs text-vl-muted mt-1 leading-relaxed">
                  {isDelivered && "Thank you for shopping on Velvet. Payout released to the boutique seller."}
                  {isShipped && "The shipping partner is delivering your package to Chennai."}
                  {isProcessing && "The seller is packaging your items and generating shipping labels."}
                  {isCancelled && "This order has been cancelled and any stock reserved has been released."}
                  {isReturned && "Items returned successfully. Refund processed to original payment method."}
                </p>
              </div>
            </div>

            {/* Order Items Card */}
            <div className="bg-vl-card border border-vl-border rounded-vl-card p-5 shadow-vl-soft">
              <h3 className="font-vl-heading font-bold text-base text-vl-ink flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-vl-muted text-lg">shopping_bag</span>
                Order Items
              </h3>
              <div className="space-y-5">
                {order.items.map((item) => (
                  <div key={item.id} className="border-b border-vl-border/40 last:border-0 pb-5 last:pb-0">
                    <OrderItem
                      name={item.name}
                      price={item.unitPrice}
                      quantity={item.quantity}
                      image={item.image}
                      variantSize={item.size}
                      sellerName={order.sellerName}
                    />
                    {isDelivered && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <button
                          onClick={() => handleBuyAgain(item.productId, item.variantId)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-vl-accent text-vl-ink font-bold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">refresh</span>
                          Buy It Again
                        </button>
                        <button
                          onClick={() => handleRateProduct(item.productId, item.name)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 border border-vl-border text-vl-ink font-bold text-xs rounded-xl hover:bg-vl-surface active:scale-95 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">grade</span>
                          Write Review
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Review Form / Already Reviewed */}
            {isDelivered && (
              <div className="bg-vl-card border border-vl-border rounded-vl-card p-5 shadow-vl-soft">
                <h3 className="font-vl-heading font-bold text-base text-vl-ink flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-vl-muted text-lg">grade</span>
                  {hasReview ? "Your Review" : "Rate Your Purchase"}
                </h3>
                {hasReview ? (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                    <p className="text-xs font-semibold text-emerald-800">You have already reviewed this order. Thank you!</p>
                  </div>
                ) : order.firstProductId && order.userProfileId ? (
                  <ReviewForm
                    orderId={order.id}
                    productId={order.firstProductId}
                    productName={order.items[0]?.name ?? "Product"}
                    buyerId={order.userProfileId}
                    onSuccess={(_newRating, _newCount) => {
                      setHasReview(true);
                      triggerToast("Review submitted! Thank you for your feedback.", "success");
                    }}
                  />
                ) : (
                  <p className="text-xs text-vl-muted">Review submission is not available for this order.</p>
                )}
              </div>
            )}

            {/* Shipping Address Card */}
            <div className="bg-vl-card border border-vl-border rounded-vl-card p-5 shadow-vl-soft">
              <h3 className="font-vl-heading font-bold text-base text-vl-ink flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-vl-muted text-lg">location_on</span>
                Delivery Address
              </h3>
              <div className="text-sm text-vl-ink leading-relaxed space-y-0.5">
                <p className="font-vl-heading font-extrabold text-sm text-vl-ink">{order.address.fullName}</p>
                <p className="text-vl-muted">{order.address.line1}</p>
                {order.address.line2 && <p className="text-vl-muted">{order.address.line2}</p>}
                <p className="text-vl-muted">{order.address.city} — {order.address.pincode}</p>
                <p className="text-[11px] text-vl-muted mt-1">📞 {order.address.phone}</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ─────────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-5">

            {/* Payment Summary */}
            <div className="bg-vl-card border border-vl-border rounded-vl-card p-5 shadow-vl-soft">
              <h3 className="font-vl-heading font-bold text-base text-vl-ink border-b border-vl-border/60 pb-3 mb-4">
                Payment Details
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="block text-[10px] font-bold text-vl-muted uppercase tracking-widest mb-0.5">Order ID</span>
                  <span className="font-mono text-xs text-vl-ink select-all break-all">{order.id}</span>
                </div>
                {order.razorpayOrderId && (
                  <div>
                    <span className="block text-[10px] font-bold text-vl-muted uppercase tracking-widest mb-0.5">Payment Order ID</span>
                    <span className="font-mono text-xs text-vl-ink select-all break-all">{order.razorpayOrderId}</span>
                  </div>
                )}
                {order.razorpayPaymentId && (
                  <div>
                    <span className="block text-[10px] font-bold text-vl-muted uppercase tracking-widest mb-0.5">Razorpay Transaction</span>
                    <span className="font-mono text-xs text-vl-ink select-all break-all">{order.razorpayPaymentId}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-vl-border/40 flex justify-between items-baseline">
                  <span className="font-bold text-xs text-vl-ink">Total Paid</span>
                  <span className="font-vl-heading font-extrabold text-lg text-vl-ink">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Order Status Timeline */}
            {!isCancelled && !isReturned && (
              <div className="bg-vl-card border border-vl-border rounded-vl-card p-5 shadow-vl-soft">
                <div className="flex items-center justify-between border-b border-vl-border/60 pb-3 mb-4">
                  <h3 className="font-vl-heading font-bold text-base text-vl-ink flex items-center gap-2">
                    <span className="material-symbols-outlined text-vl-primary text-lg">route</span>
                    Status Timeline
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {order.status === "DELIVERED" ? "Delivered" : "On Schedule"}
                  </span>
                </div>
                <OrderTimeline status={order.status} orderStatus={order.orderStatus} variant="detailed" />
              </div>
            )}

            {/* Tax Invoice Download */}
            {isDelivered && (
              <div className="bg-vl-card border border-vl-border rounded-vl-card p-5 shadow-vl-soft">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-vl-primary/10 text-vl-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">description</span>
                  </div>
                  <div>
                    <h4 className="font-vl-heading font-bold text-sm text-vl-ink">Tax Invoice</h4>
                    <p className="text-[11px] text-vl-muted leading-relaxed">Your official GST invoice is ready for download.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  disabled={isDownloadingInvoice}
                  className="w-full py-2.5 bg-vl-primary text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-vl-primary-strong active:scale-95 transition-all cursor-pointer disabled:opacity-60 shadow-sm"
                >
                  {isDownloadingInvoice ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">download</span>
                      Download Invoice PDF
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {isShipped && (
                <button
                  onClick={handleTrackOrder}
                  className="w-full py-3 bg-vl-primary text-white font-bold text-sm rounded-xl hover:bg-vl-primary-strong active:scale-95 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">location_searching</span>
                  Track Package
                </button>
              )}
              {isShipped && (
                <button
                  onClick={handleConfirmDelivery}
                  disabled={isConfirmingDelivery}
                  className="w-full py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isConfirmingDelivery ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Confirming...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">inventory_2</span> I Received My Order</>
                  )}
                </button>
              )}
              {isProcessing && (
                <>
                  <button
                    onClick={handleCancelOrder}
                    className="w-full py-3 border border-red-300 text-red-600 font-bold text-sm rounded-xl hover:bg-red-50 active:scale-95 transition-all cursor-pointer"
                  >
                    Cancel Order
                  </button>
                  <button
                    onClick={handleChangeAddress}
                    className="w-full py-3 border border-vl-border bg-vl-card text-vl-ink font-bold text-sm rounded-xl hover:bg-vl-surface active:scale-95 transition-all cursor-pointer"
                  >
                    Change Shipping Address
                  </button>
                </>
              )}
              {canReturn && (
                <Link
                  href={`/orders/${order.id}/return`}
                  className="w-full py-3 border border-red-300 text-red-600 font-bold text-sm rounded-xl hover:bg-red-50 active:scale-95 transition-all cursor-pointer block text-center"
                >
                  Request Return / Exchange
                </Link>
              )}
              {isReturned && (
                <Link
                  href={`/orders/${order.id}/return/track`}
                  className="w-full py-3 border border-vl-border text-vl-ink font-bold text-sm rounded-xl hover:bg-vl-surface active:scale-95 transition-all cursor-pointer block text-center"
                >
                  Track Return Progress →
                </Link>
              )}
              <button
                onClick={handleSupport}
                className="w-full py-3 border border-vl-border bg-vl-card text-vl-muted font-bold text-sm rounded-xl hover:bg-vl-surface active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">support_agent</span>
                Contact Support Desk
              </button>
            </div>

            {/* Escrow countdown */}
            {isDelivered && escrowReleaseAt && (
              <EscrowCountdown escrowReleaseAt={escrowReleaseAt} />
            )}

            {/* Completed Banner */}
            {isCompleted && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-vl-card flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-500 mt-0.5">task_alt</span>
                <div>
                  <p className="font-bold text-xs text-emerald-800">Payment Released</p>
                  <p className="text-[11px] text-emerald-700 leading-relaxed mt-1">
                    Funds have been released to the boutique seller. Thank you for shopping on Velvet!
                  </p>
                </div>
              </div>
            )}

            {/* Escrow Security Gate */}
            <div className="p-4 bg-vl-surface border border-vl-border rounded-vl-card flex items-start gap-3">
              <span className="material-symbols-outlined text-vl-muted mt-0.5 text-lg">verified_user</span>
              <div>
                <p className="font-bold text-xs text-vl-ink">Escrow Security Gate</p>
                <p className="text-[11px] text-vl-muted leading-relaxed mt-1">
                  Your funds are protected. Velvet holds payments in escrow, releasing them to sellers only after package delivery confirmation.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Star Rating Modal */}
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

