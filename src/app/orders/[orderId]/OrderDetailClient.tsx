"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HomeHeader from "@/components/home/HomeHeader";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import OrderTimeline from "@/components/orders/OrderTimeline";
import OrderItem from "@/components/orders/OrderItem";
import { getOrderStatus } from "@/actions/order-status.action";
import { cancelOrderAction } from "@/actions/order-user-actions";
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
  userProfile: React.ComponentProps<typeof HomeHeader>["userProfile"];
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
  const [, startTransition] = useTransition();

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
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Failed to generate tax invoice.";
      triggerToast(errMsg, "error");
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

  const [mountTime] = useState(() => Date.now());
  const canReturn = (() => {
    if (!isDelivered) return false;
    const elapsedMs = mountTime - new Date(order.createdAt).getTime();
    const limitMs = 7 * 24 * 60 * 60 * 1000;
    return elapsedMs <= limitMs;
  })();

  const OrderStatusHeroInternal = ({
    isDelivered,
    isCancelled,
    isShipped,
    isProcessing,
    isReturned,
    orderDate,
    onTrackOrder,
  }: {
    isDelivered: boolean;
    isCancelled: boolean;
    isShipped: boolean;
    isProcessing: boolean;
    isReturned: boolean;
    orderDate: string;
    onTrackOrder: () => void;
  }) => (
    <section className="bg-white border border-border-gray rounded-vl-card p-lg space-y-md shadow-sm">
      <div className="flex flex-col gap-sm">
        <div className="flex items-center gap-xs">
          <span className={`flex items-center justify-center w-8 h-8 rounded-full ${
            isDelivered ? "bg-emerald-100 text-emerald-600" : 
            isCancelled ? "bg-red-100 text-red-600" : 
            isShipped ? "bg-blue-100 text-blue-600" : 
            "bg-primary/10 text-primary"
          }`}>
            <span className="material-symbols-outlined text-lg">
              {isDelivered && "check_circle"}
              {isShipped && "local_shipping"}
              {isProcessing && "task_alt"}
              {isCancelled && "cancel"}
              {isReturned && "settings_backup_restore"}
            </span>
          </span>
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {isDelivered && "Order Delivered"}
            {isShipped && "Items in Transit"}
            {isProcessing && "Order Confirmed"}
            {isCancelled && "Transaction Cancelled"}
            {isReturned && "Return Completed"}
          </h2>
        </div>
        <p className="font-body-md text-secondary ml-10">
          {isDelivered && `Delivered on ${new Date(orderDate).toLocaleDateString("en-IN")}`}
          {isShipped && "Arriving soon—track your package below."}
          {isProcessing && "Your order is being packaged by the boutique."}
          {isCancelled && "This order has been cancelled."}
          {isReturned && "Return process is completed."}
        </p>
      </div>
      {isShipped && (
        <button
          onClick={onTrackOrder}
          className="mt-lg w-full py-3 bg-primary text-white font-label-bold text-label-bold rounded-vl-control hover:opacity-90 transition-transform active:scale-95 cursor-pointer shadow-sm text-center text-sm"
        >
          Track Package
        </button>
      )}
    </section>
  );


  // Order Status Hero Component
  const OrderStatusHero = () => (
    <section className="bg-white border border-border-gray rounded-vl-card p-lg space-y-md shadow-sm">
      <div className="flex flex-col gap-sm">
        <div className="flex items-center gap-xs">
          <span className={`w-3 h-3 rounded-full ${isDelivered ? "bg-emerald-500" : isCancelled ? "bg-red-500" : "bg-primary"}`}></span>
          <h2 className="font-vl-heading text-lg font-bold text-primary">
            {isDelivered && "Order Delivered"}
            {isShipped && "Items in Transit"}
            {isProcessing && "Order Confirmed"}
            {isCancelled && "Transaction Cancelled"}
            {isReturned && "Return Completed"}
          </h2>
        </div>
        <p className="text-sm text-secondary">
          {isDelivered && `Delivered on ${new Date(order.createdAt).toLocaleDateString("en-IN")}`}
          {isShipped && "Arriving soon—track your package below."}
          {isProcessing && "Your order is being packaged by the boutique."}
          {isCancelled && "This order has been cancelled."}
          {isReturned && "Return process is completed."}
        </p>
      </div>
      {isShipped && (
        <button
          onClick={handleTrackOrder}
          className="mt-lg w-full py-3 bg-primary text-white font-bold rounded-vl-control hover:opacity-90 transition-transform active:scale-95 cursor-pointer shadow-sm text-center text-sm"
        >
          Track Package
        </button>
      )}
    </section>
  );

  return (
    <div className="bg-vl-surface text-on-surface font-vl-body min-h-screen flex flex-col w-full">
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
            className={`p-base border rounded-lg shadow-lg flex items-center gap-sm font-bold ${
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
            className="text-secondary font-bold hover:text-primary transition-colors flex items-center gap-xs mb-sm cursor-pointer select-none text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Orders
          </Link>
          <h1 className="font-vl-heading text-2xl font-extrabold text-primary">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-secondary text-sm">
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
              
              <Link
                href="/orders"
                className="flex items-center gap-2 text-primary font-bold text-sm hover:underline mb-4"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Back to Orders
              </Link>
            
            <OrderStatusHeroInternal 
              isDelivered={isDelivered}

              isCancelled={isCancelled}
              isShipped={isShipped}
              isProcessing={isProcessing}
              isReturned={isReturned}
              orderDate={order.createdAt}
              onTrackOrder={handleTrackOrder}
            />

            {/* Order Items Card */}
            <div className="bg-white border border-border-gray rounded-vl-card p-base space-y-base shadow-sm">
              <h3 className="font-vl-heading text-lg font-bold text-primary flex items-center gap-sm">
                <span className="material-symbols-outlined text-secondary">shopping_bag</span>
                Items ({order.items.length})
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
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address Card */}
            <div className="bg-white border border-border-gray rounded-vl-card p-base space-y-base shadow-sm">
              <h3 className="font-vl-heading text-lg font-bold text-primary flex items-center gap-sm">
                <span className="material-symbols-outlined text-secondary">local_shipping</span>
                Delivery Address
              </h3>
              <div className="pt-xs text-sm text-on-surface leading-relaxed">
                <p className="font-bold text-primary mb-xs">{order.address.fullName}</p>
                <p>{order.address.line1}</p>
                {order.address.line2 && <p>{order.address.line2}</p>}
                <p>{order.address.city} - {order.address.pincode}</p>
                <p className="mt-sm text-secondary text-xs">Mobile Number: {order.address.phone}</p>
              </div>
            </div>
          </div>

          {/* Right Panel: Payments & Actions */}
          <div className="lg:col-span-4 space-y-lg">
            
            {/* Payment Summary */}
            <div className="bg-white border border-border-gray rounded-vl-card p-base space-y-base shadow-sm">
              <h3 className="font-vl-heading text-lg font-bold text-primary border-b border-border-gray pb-sm">
                Payment Details
              </h3>
              <div className="space-y-md text-sm text-secondary font-medium">
                <div className="pt-sm border-t border-border-gray/30 flex justify-between items-baseline">
                  <span className="text-primary font-bold">Total Amount Paid</span>
                  <span className="font-vl-heading text-xl font-extrabold text-primary">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Compact Order Journey */}
            {!isCancelled && !isReturned && (
              <div className="bg-white border border-border-gray rounded-vl-card p-4 shadow-sm">
                <h3 className="font-vl-heading text-base font-bold text-primary flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">route</span>
                  Order Journey
                </h3>
                <OrderTimeline status={order.status} orderStatus={order.orderStatus} variant="compact" />
              </div>
            )}
            
            {/* Escrow Security Gate banner */}
            <div className="p-base bg-surface border border-border-gray rounded-vl-card flex items-start gap-sm">
              <span className="material-symbols-outlined text-secondary mt-xs">verified_user</span>
              <div className="space-y-xs">
                <p className="font-bold text-primary text-sm">Escrow Security Gate</p>
                <p className="text-secondary text-xs leading-normal">
                  Your funds are protected. Velvet holds payments in escrow, releasing them to sellers only after package delivery confirmation.
                </p>
              </div>
            </div>

             {/* Main Action Side buttons */}
             <div className="space-y-base">
                {isShipped && (
                  <button
                    onClick={handleConfirmDelivery}
                    disabled={isConfirmingDelivery}
                    className="w-full py-3 bg-emerald-600 text-white font-bold rounded-vl-control hover:opacity-90 transition-transform active:scale-95 cursor-pointer shadow-sm text-center disabled:opacity-60 flex items-center justify-center gap-xs"
                  >
                    {isConfirmingDelivery ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Confirming...</>
                    ) : (
                      <><span className="material-symbols-outlined text-[18px]">inventory_2</span> I Received My Order</>
                    )}
                  </button>
                )}
                {isDelivered && (
                    <button
                        onClick={() => handleRateProduct(order.items[0].productId, order.items[0].name)}
                        className="w-full py-3 border border-border-gray bg-white text-primary font-bold rounded-vl-control hover:bg-surface-container transition-transform active:scale-95 cursor-pointer text-center"
                    >
                        Write Review
                    </button>
                )}
                <button
                    onClick={handleSupport}
                    className="w-full py-3 border border-border-gray bg-white text-secondary font-bold rounded-vl-control hover:bg-surface-container transition-transform active:scale-95 cursor-pointer text-center"
                >
                    Contact Support
                </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

}
