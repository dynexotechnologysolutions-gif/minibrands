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

  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 4000);
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

  const currentNormalizedStatus = (orderStatus || status || "").toLowerCase();
  const isDelivered = currentNormalizedStatus === "delivered" || currentNormalizedStatus === "completed";
  const isShipped = currentNormalizedStatus === "shipped" || currentNormalizedStatus === "out_for_delivery" || currentNormalizedStatus === "out for delivery";
  const isCancelled = currentNormalizedStatus === "cancelled";
  const isReturned = currentNormalizedStatus === "returned" || currentNormalizedStatus === "refunded" || currentNormalizedStatus === "disputed";
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

      {/* Main Container */}
      <main className="max-w-container-max mx-auto px-4 md:px-lg py-xl flex-grow w-full space-y-lg">
        {/* Navigation & Title */}
        <div>
          <Link
            href="/orders"
            className="text-secondary font-label-bold text-label-bold hover:text-primary transition-colors flex items-center gap-xs mb-sm cursor-pointer select-none"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Orders
          </Link>
          <h1 className="font-headline-lg text-headline-lg text-primary">Order Details</h1>
          <p className="font-body-md text-secondary">
            Placed on {new Date(order.createdAt).toLocaleString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Outer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start">
          
          {/* Left Panel: Items & Address */}
          <div className="lg:col-span-8 space-y-lg">
            
            {/* Status Banner */}
            <div className={`p-base border rounded shadow-sm flex items-start gap-base ${
              isDelivered
                ? "bg-emerald-50/20 border-emerald-100"
                : isCancelled
                ? "bg-red-50/20 border-red-100"
                : "bg-white border-border-gray"
            }`}>
              <div className="mt-xs">
                <OrderStatusBadge
                  status={order.status}
                  orderStatus={order.orderStatus}
                  date={order.createdAt}
                />
              </div>
              <div className="flex-1">
                <h4 className="font-label-bold text-label-bold text-primary">
                  {isDelivered && "Order Delivered Successfully"}
                  {isShipped && "Items are in Transit"}
                  {isProcessing && "Your order is being processed by the boutique"}
                  {isCancelled && "Transaction Cancelled"}
                  {isReturned && "Return Completed"}
                </h4>
                <p className="font-body-sm text-secondary mt-xs">
                  {isDelivered && "Thank you for shopping on Velvet. Payout released to the boutique seller."}
                  {isShipped && "The shipping partner is delivering your package to Chennai."}
                  {isProcessing && "The seller is packaging your items and generating shipping labels."}
                  {isCancelled && "This order has been cancelled and any stock reserved has been released."}
                  {isReturned && "Items returned successfully. Refund processed to original payment method."}
                </p>
              </div>
            </div>

            {/* Order Items Card */}
            <div className="bg-white border border-border-gray rounded p-base space-y-base shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-sm">
                <span className="material-symbols-outlined text-secondary">shopping_bag</span>
                Order Items
              </h3>
              <div className="space-y-base pt-xs">
                {order.items.map((item) => (
                  <div key={item.id} className="space-y-base border-b border-border-gray/30 last:border-0 pb-base last:pb-0">
                    <OrderItem
                      name={item.name}
                      price={item.unitPrice}
                      quantity={item.quantity}
                      image={item.image}
                      variantSize={item.size}
                      sellerName={order.sellerName}
                    />
                    <div className="flex gap-base">
                      {isDelivered && (
                        <>
                          <button
                            onClick={() => handleBuyAgain(item.productId, item.variantId)}
                            className="flex items-center gap-xs px-base py-1.5 bg-accent-yellow text-primary font-label-bold text-label-bold rounded hover:opacity-90 transition-transform active:scale-95 cursor-pointer text-xs"
                          >
                            <span className="material-symbols-outlined text-[16px]">refresh</span>
                            Buy It Again
                          </button>
                          <button
                            onClick={() => handleRateProduct(item.productId, item.name)}
                            className="flex items-center gap-xs px-base py-1.5 border border-border-gray text-primary font-label-bold text-label-bold rounded hover:bg-surface-container transition-transform active:scale-95 cursor-pointer text-xs"
                          >
                            <span className="material-symbols-outlined text-[16px]">grade</span>
                            Write Review
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Form / Already Reviewed card — shown when delivered */}
            {isDelivered && (
              <div className="bg-white border border-border-gray rounded p-base space-y-base shadow-sm">
                <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-sm">
                  <span className="material-symbols-outlined text-secondary">grade</span>
                  {hasReview ? "Your Review" : "Rate Your Purchase"}
                </h3>
                {hasReview ? (
                  <div className="flex items-center gap-sm p-sm bg-emerald-50 border border-emerald-100 rounded">
                    <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                    <p className="font-body-sm text-emerald-800">You have already reviewed this order. Thank you!</p>
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
                  <p className="font-body-sm text-secondary text-xs">Review submission is not available for this order.</p>
                )}
              </div>
            )}

            {/* Shipping Address Card */}
            <div className="bg-white border border-border-gray rounded p-base space-y-base shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-sm">
                <span className="material-symbols-outlined text-secondary">local_shipping</span>
                Delivery Address
              </h3>
              <div className="pt-xs text-body-md text-on-surface leading-relaxed">
                <p className="font-label-bold text-label-bold text-primary mb-xs">{order.address.fullName}</p>
                <p>{order.address.line1}</p>
                {order.address.line2 && <p>{order.address.line2}</p>}
                <p>{order.address.city} - {order.address.pincode}</p>
                <p className="mt-sm text-secondary font-body-sm text-xs">Mobile Number: {order.address.phone}</p>
              </div>
            </div>
          </div>

          {/* Right Panel: Payments & Actions */}
          <div className="lg:col-span-4 space-y-lg">
            
            {/* Payment Summary */}
            <div className="bg-white border border-border-gray rounded p-base space-y-base shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary border-b border-border-gray pb-sm">
                Payment Details
              </h3>
              <div className="space-y-md text-body-sm text-secondary font-medium">
                <div>
                  <span className="text-secondary font-body-sm block text-[10px] uppercase tracking-wider text-slate-400">Order ID</span>
                  <span className="text-primary font-mono select-all break-all">{order.id}</span>
                </div>
                {order.razorpayOrderId && (
                  <div>
                    <span className="text-secondary font-body-sm block text-[10px] uppercase tracking-wider text-slate-400">Payment Order ID</span>
                    <span className="text-primary font-mono select-all break-all">{order.razorpayOrderId}</span>
                  </div>
                )}
                {order.razorpayPaymentId && (
                  <div>
                    <span className="text-secondary font-body-sm block text-[10px] uppercase tracking-wider text-slate-400">Razorpay Transaction ID</span>
                    <span className="text-primary font-mono select-all break-all">{order.razorpayPaymentId}</span>
                  </div>
                )}
                <div className="pt-sm border-t border-border-gray/30 flex justify-between items-baseline">
                  <span className="text-primary font-label-bold">Total Amount Paid</span>
                  <span className="font-price-lg text-price-lg text-primary">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Interactive Order Timeline */}
            {!isCancelled && !isReturned && (
              <div className="bg-white border border-border-gray rounded p-base space-y-base shadow-sm">
                <h3 className="font-headline-sm text-headline-sm text-primary">
                  Order Status Timeline
                </h3>
                <OrderTimeline status={order.status} orderStatus={order.orderStatus} />
              </div>
            )}

            {/* Main Action Side buttons */}
            <div className="space-y-base">
              {isShipped && (
                <button
                  onClick={handleTrackOrder}
                  className="w-full py-3 bg-primary text-white font-label-bold text-label-bold rounded hover:opacity-90 transition-transform active:scale-95 cursor-pointer shadow-sm text-center"
                >
                  Track Package
                </button>
              )}
              {isShipped && (
                <button
                  onClick={handleConfirmDelivery}
                  disabled={isConfirmingDelivery}
                  className="w-full py-3 bg-emerald-600 text-white font-label-bold text-label-bold rounded hover:opacity-90 transition-transform active:scale-95 cursor-pointer shadow-sm text-center disabled:opacity-60 flex items-center justify-center gap-xs"
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
                    className="w-full py-3 border border-error-red text-error-red font-label-bold text-label-bold rounded hover:bg-error-container transition-transform active:scale-95 cursor-pointer text-center"
                  >
                    Cancel Order
                  </button>
                  <button
                    onClick={handleChangeAddress}
                    className="w-full py-3 border border-border-gray bg-white text-primary font-label-bold text-label-bold rounded hover:bg-surface-container transition-transform active:scale-95 cursor-pointer text-center"
                  >
                    Change Shipping Address
                  </button>
                </>
              )}
              {canReturn && (
                <Link
                  href={`/orders/${order.id}/return`}
                  className="w-full py-3 border border-error-red text-error-red font-label-bold text-label-bold rounded hover:bg-error-container transition-transform active:scale-95 cursor-pointer text-center block"
                >
                  Request Return / Exchange
                </Link>
              )}
              {(currentNormalizedStatus === "disputed" || currentNormalizedStatus === "returned") && (
                <Link
                  href={`/orders/${order.id}/return/track`}
                  className="w-full py-3 border border-primary text-primary font-label-bold text-label-bold rounded hover:bg-surface-container transition-transform active:scale-95 cursor-pointer text-center block"
                >
                  Track Return Progress →
                </Link>
              )}
              <button
                onClick={handleSupport}
                className="w-full py-3 border border-border-gray bg-white text-secondary font-label-bold text-label-bold rounded hover:bg-surface-container transition-transform active:scale-95 cursor-pointer text-center"
              >
                Contact Support Desk
              </button>
            </div>

            {/* Escrow countdown — shown when delivered */}
            {isDelivered && escrowReleaseAt && (
              <EscrowCountdown escrowReleaseAt={escrowReleaseAt} />
            )}

            {/* Completed banner */}
            {currentNormalizedStatus === "completed" && (
              <div className="p-base bg-emerald-50 border border-emerald-100 rounded flex items-start gap-sm">
                <span className="material-symbols-outlined text-emerald-500 mt-xs">task_alt</span>
                <div>
                  <p className="font-label-bold text-label-bold text-emerald-800 text-xs">Payment Released</p>
                  <p className="font-body-sm text-[11px] text-emerald-700 leading-normal mt-xs">
                    Funds have been released to the boutique seller. Thank you for shopping on Velvet!
                  </p>
                </div>
              </div>
            )}

            {/* Escrow Security Gate banner */}
            <div className="p-base bg-surface border border-border-gray rounded flex items-start gap-sm">
              <span className="material-symbols-outlined text-secondary mt-xs">verified_user</span>
              <div className="space-y-xs">
                <p className="font-label-bold text-label-bold text-primary text-xs">Escrow Security Gate</p>
                <p className="font-body-sm text-[11px] text-secondary leading-normal">
                  Your funds are protected. Velvet holds payments in escrow, releasing them to sellers only after package delivery confirmation.
                </p>
              </div>
            </div>


          </div>
        </div>
      </main>

      {/* Star Rating Modal */}
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
