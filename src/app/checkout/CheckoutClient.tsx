"use client";

/**
 * CheckoutClient
 * @redesigned v4.0 — visual redesign only, all hooks, server actions, and states preserved exactly.
 *
 * Purpose:
 *   Premium checkout screen featuring checkout steppers, a two-column desktop grid,
 *   active address selection indicators, shipping speed options, order items list,
 *   secure payment selections, and a vertically sticky order summary details card.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Timer,
  X,
  MapPin,
  ShoppingBag,
  BadgeCheck,
  QrCode,
  CreditCard,
  Landmark,
  ShieldCheck,
  Lock,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Truck,
} from "lucide-react";
import HomeHeader from "@/components/home/HomeHeader";
import { trackClientEvent } from "@/actions/track-event.action";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: "Chennai";
  pincode: string;
  isDefault: boolean;
}

interface CheckoutProduct {
  id: string;
  name: string;
  price: number; // in paise
  size: string;
  image: string;
  sellerName: string;
  isSellerVerified: boolean;
  quantity: number;
  variantId: string;
}

interface CheckoutClientProps {
  reservationId?: string;
  createdAt: string;
  products: CheckoutProduct[];
  mode: "BUY_NOW" | "CART_CHECKOUT";
  checkoutSessionId?: string;
  addresses: Address[];
  buyerEmail: string;
  buyerName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userProfile: any;
  cartCount: number;
  sellerHref: string;
  initialAddressId?: string;
}

// Local sub-component: Checkout progress stepper
function CheckoutStepper() {
  return (
    <div className="mb-8 flex items-center justify-center gap-2 border-b border-vl-border pb-5 text-sm font-semibold sm:gap-4 md:justify-start">
      <Link href="/cart" className="flex items-center gap-1 text-vl-muted hover:text-vl-primary transition-colors">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-vl-primary/10 text-[10px] font-bold text-vl-primary">✔</span>
        Cart
      </Link>
      <ChevronRight className="h-4.5 w-4.5 text-vl-border shrink-0" />
      <span className="flex items-center gap-1.5 text-vl-primary font-bold">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-vl-primary text-[10px] font-bold text-white">2</span>
        Secure Checkout
      </span>
      <ChevronRight className="h-4.5 w-4.5 text-vl-border shrink-0" />
      <span className="flex items-center gap-1.5 text-vl-muted">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-vl-border text-[10px] font-bold text-vl-muted">3</span>
        Order Confirmed
      </span>
    </div>
  );
}

// Local sub-component: Single address card render
function AddressCard({
  address,
  isSelected,
  onSelect,
}: {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      onClick={onSelect}
      className={`flex items-start gap-4 p-4 border rounded-vl-card cursor-pointer transition-all duration-vl-fast ${
        isSelected
          ? "border-vl-primary bg-vl-primary/5 shadow-vl-soft"
          : "border-vl-border bg-vl-card hover:border-vl-primary hover:shadow-vl-soft"
      }`}
    >
      <input
        type="radio"
        name="checkout-address"
        checked={isSelected}
        onChange={onSelect}
        className="mt-1 h-4 w-4 cursor-pointer text-vl-primary focus:ring-vl-primary border-vl-border accent-vl-primary"
      />
      <div className="text-sm text-vl-muted flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="font-bold text-vl-ink text-base">{address.fullName}</span>
          {address.isDefault && (
            <span className="text-[10px] font-bold text-vl-success bg-vl-success/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Default
            </span>
          )}
        </div>
        <p className="leading-relaxed">{address.line1}</p>
        {address.line2 && <p className="leading-relaxed">{address.line2}</p>}
        <p className="leading-relaxed">{address.city} - {address.pincode}</p>
        <p className="mt-2 font-medium text-vl-ink">Phone: {address.phone}</p>
      </div>
    </label>
  );
}

export default function CheckoutClient({
  reservationId,
  createdAt,
  products,
  mode: _mode,
  checkoutSessionId,
  addresses,
  buyerEmail,
  buyerName,
  userProfile,
  cartCount,
  sellerHref,
  initialAddressId,
}: CheckoutClientProps) {
  const router = useRouter();
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    initialAddressId || addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || ""
  );
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(900);
  const [expiredTracked, setExpiredTracked] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>("upi");

  // Initialize and tick countdown timer
  useEffect(() => {
    const calculateTime = () => {
      const createdTime = new Date(createdAt).getTime();
      const durationMs = 15 * 60 * 1000;
      const elapsedMs = Date.now() - createdTime;
      const leftSeconds = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));
      setSecondsLeft(leftSeconds);

      if (leftSeconds === 0 && !expiredTracked) {
        setExpiredTracked(true);
        if (reservationId) {
          trackClientEvent("reservation_expired", {
            reservationId,
            productId: products[0]?.id || "",
            context: "checkout",
          });
          trackClientEvent("cart_abandoned", {
            reservationId,
            productId: products[0]?.id || "",
            context: "checkout",
          });
        }
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [createdAt, reservationId, products, expiredTracked]);

  // Load Razorpay Script dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!selectedAddressId) {
      setErrorMessage("Please select a delivery address.");
      return;
    }

    setIsPaying(true);
    setErrorMessage(null);

    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addressId: selectedAddressId,
          sessionId: checkoutSessionId || undefined,
          reservationId: reservationId || undefined,
        }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json();
        setErrorMessage(errData.error || "Failed to initialize order checkout.");
        setIsPaying(false);
        return;
      }

      const { razorpayOrderId, amount, currency, keyId } = await orderRes.json();

      // 2. Handle Development/Sandbox Mock Flow
      const isMockOrder =
        razorpayOrderId.startsWith("order_mock_") ||
        !keyId ||
        keyId.includes("mock");

      if (isMockOrder) {
        console.log(`[Checkout SDK Mock] Bypassing Razorpay checkout iframe for mock order ID: ${razorpayOrderId}`);
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
            razorpay_order_id: razorpayOrderId,
            razorpay_signature: "mock_signature",
          }),
        });

        if (!verifyRes.ok) {
          const errData = await verifyRes.json();
          setErrorMessage(errData.error || "Payment verification failed.");
          setIsPaying(false);
          return;
        }

        const verifyData = await verifyRes.json();
        router.push(`/order/success/${verifyData.orderId}`);
        return;
      }

      // 3. Handle Production Real Razorpay Flow
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setErrorMessage("Failed to load Razorpay Payment Gateway. Please check your internet connection.");
        setIsPaying(false);
        return;
      }

      const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

      const options = {
        key: keyId,
        amount: amount, // in paisa
        currency: currency,
        name: "MINIBRANDS",
        description: `Order checkout for ${products.map(p => p.name).join(", ")}`,
        image: "https://cdn.prod.website-files.com/67a7409c10857ea8dcbc42d5/67a7409c10857ea8dcbc4c3c_everything%20you%20need%20to%20know%20about%20Session-timeout%20in%20GA%201.png",
        order_id: razorpayOrderId,
        handler: async function (paymentResponse: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const errData = await verifyRes.json();
              setErrorMessage(errData.error || "Payment verification failed.");
              setIsPaying(false);
              return;
            }

            const verifyData = await verifyRes.json();
            router.push(`/order/success/${verifyData.orderId}`);
          } catch (verifyErr) {
            const error = verifyErr as Error;
            setErrorMessage(error.message || "An unexpected error occurred during payment verification.");
            setIsPaying(false);
          }
        },
        prefill: {
          name: selectedAddress?.fullName || buyerName,
          email: buyerEmail,
          contact: selectedAddress?.phone || "",
        },
        theme: {
          color: "#FF3E6C",
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
        notes: {
          address: `${selectedAddress?.line1}, ${selectedAddress?.line2 || ""}, ${selectedAddress?.city} - ${selectedAddress?.pincode}`,
          products: products.map(p => `${p.name} (Qty: ${p.quantity})`).join(", "),
        },
        modal: {
          ondismiss: function () {
            setErrorMessage("Payment was cancelled or closed. You can retry.");
            setIsPaying(false);
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      
      rzp.on("payment.failed", function (response: { error: { description: string } }) {
        setErrorMessage(response.error.description || "Payment failed. Please try again.");
        setIsPaying(false);
      });

      rzp.open();
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message || "An unexpected error occurred during payment setup.");
      setIsPaying(false);
    }
  };

  const isExpired = secondsLeft <= 0;
  const isNearExpiration = secondsLeft > 0 && secondsLeft < 180;

  const formatPrice = (amt: number) => {
    return (amt / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  const formatTime = (secs: number) => {
    if (secs <= 0) return "Expired";
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, "0")}`;
  };

  // Price calculation
  const subtotal = products.reduce((acc, p) => acc + p.price * p.quantity, 0); // in paise
  const platformFee = subtotal > 10000 ? 1000 : 0; // ₹10 platform fee if subtotal > 100 rupees
  const packagingFee = subtotal > 10000 ? 5900 : 0; // ₹59 secured packaging fee if subtotal > 100 rupees
  const displayPrice = subtotal - platformFee - packagingFee;

  const totalQuantityCount = products.reduce((acc, p) => acc + p.quantity, 0);
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const redirectUrlParam = checkoutSessionId
    ? `sessionId=${checkoutSessionId}`
    : `reservationId=${reservationId}`;

  return (
    <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink selection:bg-vl-primary/20">
      <HomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      <main className="vl-section-shell flex w-full flex-grow flex-col py-6 sm:py-8 lg:py-10 pb-28 lg:pb-10">
        {/* Stepper progress indicator */}
        <CheckoutStepper />

        {/* Hold Reservation status banner */}
        <div
          role="alert"
          className={`mb-6 flex items-center justify-between rounded-vl-card border p-4 shadow-vl-soft transition-all duration-vl-fast ${
            isExpired
              ? "border-vl-danger/25 bg-vl-danger/10 text-red-950"
              : isNearExpiration
              ? "border-vl-warning bg-vl-warning/10 text-amber-950 animate-pulse"
              : "border-vl-border bg-vl-card text-vl-ink"
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-bold sm:text-sm">
            <Timer aria-hidden="true" className={`h-4.5 w-4.5 shrink-0 ${isExpired ? "text-vl-danger" : isNearExpiration ? "text-vl-warning" : "text-vl-primary"}`} />
            <span>
              {isExpired
                ? "Your cart hold has expired."
                : `Items reserved for ${formatTime(secondsLeft)} before releasing.`}
            </span>
          </div>
          {isExpired && (
            <Link
              href="/cart"
              className="text-xs font-bold text-vl-primary hover:underline uppercase tracking-wider"
            >
              Return to Cart
            </Link>
          )}
        </div>

        {/* Error Notification Alert */}
        {errorMessage && (
          <div
            role="status"
            className="mb-6 flex items-center justify-between rounded-vl-card border border-vl-danger/25 bg-vl-danger/10 p-4 text-xs font-bold text-red-950 shadow-vl-soft sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-vl-danger shrink-0 animate-ping" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              aria-label="Dismiss error"
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full text-vl-muted hover:bg-vl-surface hover:text-vl-ink transition-colors"
            >
              <X aria-hidden="true" className="h-4.5 w-4.5" />
            </button>
          </div>
        )}

        {/* Main 2-Column split desktop grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 items-start">
          
          {/* LEFT COLUMN: Steps contents (~65%) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Address Section Card */}
            {!isChangingAddress ? (
              <section className="rounded-vl-card border border-vl-border bg-vl-card p-6 shadow-vl-soft">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin aria-hidden="true" className="text-vl-primary h-5 w-5 shrink-0" />
                    <h2 className="font-vl-heading text-lg font-bold text-vl-ink">Delivery Address</h2>
                  </div>
                  <button
                    onClick={() => setIsChangingAddress(true)}
                    className="text-vl-primary font-bold text-sm hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
                {selectedAddress ? (
                  <div className="text-sm text-vl-muted leading-relaxed">
                    <p className="font-bold text-vl-ink text-base mb-1">{selectedAddress.fullName}</p>
                    <p>{selectedAddress.line1}</p>
                    {selectedAddress.line2 && <p>{selectedAddress.line2}</p>}
                    <p>{selectedAddress.city} - {selectedAddress.pincode}</p>
                    <p className="mt-2.5">
                      <span className="font-bold text-vl-ink">Phone:</span>{" "}
                      {selectedAddress.phone}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-vl-danger mb-4 font-bold text-sm">No delivery address selected.</p>
                    <Link
                      href={`/account/addresses?redirectTo=${encodeURIComponent(`/checkout?${redirectUrlParam}`)}&${redirectUrlParam}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-ink px-6 text-sm font-bold text-white hover:bg-vl-ink/90 active:scale-[0.98] transition-all"
                    >
                      Add Shipping Address
                    </Link>
                  </div>
                )}
              </section>
            ) : (
              <section className="rounded-vl-card border border-vl-border bg-vl-card p-6 shadow-vl-soft">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin aria-hidden="true" className="text-vl-primary h-5 w-5 shrink-0" />
                    <h2 className="font-vl-heading text-lg font-bold text-vl-ink">Select Shipping Address</h2>
                  </div>
                  <button
                    onClick={() => setIsChangingAddress(false)}
                    className="text-vl-primary font-bold text-sm hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-vl-muted text-sm mb-4">No shipping addresses found.</p>
                    <Link
                      href={`/account/addresses?redirectTo=${encodeURIComponent(`/checkout?${redirectUrlParam}`)}&${redirectUrlParam}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-6 text-sm font-bold text-white hover:bg-vl-primary-strong active:scale-[0.98] transition-all"
                    >
                      Create Shipping Address
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      {addresses.map((addr) => (
                        <AddressCard
                          key={addr.id}
                          address={addr}
                          isSelected={selectedAddressId === addr.id}
                          onSelect={() => setSelectedAddressId(addr.id)}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-vl-border">
                      <Link
                        href={`/account/addresses?redirectTo=${encodeURIComponent(`/checkout?${redirectUrlParam}`)}&${redirectUrlParam}`}
                        className="text-vl-primary font-bold text-sm hover:underline"
                      >
                        Manage Saved Addresses
                      </Link>
                      <button
                        onClick={() => setIsChangingAddress(false)}
                        className="inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-ink px-6 text-sm font-bold text-white hover:bg-vl-ink/90 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        Apply Address
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* 2. Delivery Method Section */}
            <section className="rounded-vl-card border border-vl-border bg-vl-card p-6 shadow-vl-soft">
              <div className="flex items-center gap-2 mb-4">
                <Truck aria-hidden="true" className="text-vl-primary h-5 w-5 shrink-0" />
                <h2 className="font-vl-heading text-lg font-bold text-vl-ink">Delivery Method</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="p-4 border-2 border-vl-primary bg-vl-primary/5 rounded-vl-card flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-vl-primary flex items-center justify-center text-white shrink-0 mt-0.5">
                    <span className="text-[10px]">✔</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-vl-ink text-sm">Standard Delivery</h3>
                    <p className="text-xs text-vl-muted mt-1 leading-relaxed">Estimated Delivery by Tomorrow. Secured package shipping via air dispatch.</p>
                    <span className="inline-block mt-2.5 text-xs font-bold text-vl-success bg-vl-success/10 px-2 py-0.5 rounded-full">FREE</span>
                  </div>
                </div>
                <div className="p-4 border border-vl-border bg-vl-surface opacity-60 rounded-vl-card flex items-start gap-3 select-none">
                  <div className="h-5 w-5 rounded-full border border-vl-border shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-vl-ink text-sm">Express Delivery</h3>
                    <p className="text-xs text-vl-muted mt-1 leading-relaxed">Same-day delivery (Unavailable for this zipcode area).</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Order Items Review Section */}
            <section className="rounded-vl-card border border-vl-border bg-vl-card p-6 shadow-vl-soft">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag aria-hidden="true" className="text-vl-primary h-5 w-5 shrink-0" />
                <h2 className="font-vl-heading text-lg font-bold text-vl-ink">Review Items ({totalQuantityCount})</h2>
              </div>

              <div className="divide-y divide-vl-border">
                {products.map((item) => (
                  <div key={item.id + "-" + item.variantId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="w-20 h-24 flex-shrink-0 bg-vl-surface border border-vl-border rounded-vl-control overflow-hidden relative shadow-sm">
                      <Image
                        fill
                        className="object-cover"
                        alt={item.name}
                        src={item.image}
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 flex-wrap sm:flex-nowrap">
                        <h3 className="font-bold text-vl-ink text-sm sm:text-base truncate">{item.name}</h3>
                        <p className="font-vl-heading font-extrabold text-vl-ink text-base shrink-0">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                      
                      <div className="mt-1 flex items-center gap-1">
                        <BadgeCheck aria-hidden="true" className="text-vl-success h-4 w-4 shrink-0" />
                        <span className="text-[10px] font-bold text-vl-success uppercase tracking-wider">
                          {item.isSellerVerified ? "Verified Seller" : "Boutique Seller"}
                        </span>
                      </div>
                      
                      <p className="text-xs text-vl-muted mt-1">Size: {item.size} | Qty: {item.quantity}</p>
                      <p className="text-xs text-vl-success font-semibold mt-2.5 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-vl-success inline-block"></span>
                        Delivery tomorrow by 2:00 PM
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Payment Method Card */}
            <section className="rounded-vl-card border border-vl-border bg-vl-card p-6 shadow-vl-soft">
              <div className="flex items-center gap-2 mb-5">
                <Lock aria-hidden="true" className="text-vl-primary h-5 w-5 shrink-0" />
                <h2 className="font-vl-heading text-lg font-bold text-vl-ink">Payment Method</h2>
              </div>
              
              <div className="space-y-3.5" role="radiogroup" aria-label="Payment method">
                {/* UPI Option */}
                <label
                  onClick={() => setSelectedPayment("upi")}
                  className={`flex items-center justify-between p-4 border rounded-vl-card cursor-pointer transition-all duration-vl-fast ${
                    selectedPayment === "upi"
                      ? "border-vl-primary bg-vl-primary/5"
                      : "border-vl-border bg-vl-card hover:border-vl-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment-option"
                      checked={selectedPayment === "upi"}
                      onChange={() => setSelectedPayment("upi")}
                      className="h-4 w-4 text-vl-primary focus:ring-vl-primary border-vl-border accent-vl-primary"
                    />
                    <div className="flex items-center gap-3">
                      <QrCode aria-hidden="true" className="h-5 w-5 text-vl-muted shrink-0" />
                      <div>
                        <p className="font-bold text-vl-ink text-sm">UPI (GPay / PhonePe / Paytm)</p>
                        <p className="text-xs text-vl-muted mt-0.5">Pay directly via instant UPI gateway</p>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Card Option */}
                <label
                  onClick={() => setSelectedPayment("card")}
                  className={`flex items-center justify-between p-4 border rounded-vl-card cursor-pointer transition-all duration-vl-fast ${
                    selectedPayment === "card"
                      ? "border-vl-primary bg-vl-primary/5"
                      : "border-vl-border bg-vl-card hover:border-vl-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment-option"
                      checked={selectedPayment === "card"}
                      onChange={() => setSelectedPayment("card")}
                      className="h-4 w-4 text-vl-primary focus:ring-vl-primary border-vl-border accent-vl-primary"
                    />
                    <div className="flex items-center gap-3">
                      <CreditCard aria-hidden="true" className="h-5 w-5 text-vl-muted shrink-0" />
                      <div>
                        <p className="font-bold text-vl-ink text-sm">Credit / Debit Card</p>
                        <p className="text-xs text-vl-muted mt-0.5">Secure credit card gateway processed by Razorpay</p>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Net Banking */}
                <label
                  onClick={() => setSelectedPayment("netbanking")}
                  className={`flex items-center justify-between p-4 border rounded-vl-card cursor-pointer transition-all duration-vl-fast ${
                    selectedPayment === "netbanking"
                      ? "border-vl-primary bg-vl-primary/5"
                      : "border-vl-border bg-vl-card hover:border-vl-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment-option"
                      checked={selectedPayment === "netbanking"}
                      onChange={() => setSelectedPayment("netbanking")}
                      className="h-4 w-4 text-vl-primary focus:ring-vl-primary border-vl-border accent-vl-primary"
                    />
                    <div className="flex items-center gap-3">
                      <Landmark aria-hidden="true" className="h-5 w-5 text-vl-muted shrink-0" />
                      <div>
                        <p className="font-bold text-vl-ink text-sm">Net Banking</p>
                        <p className="text-xs text-vl-muted mt-0.5">Select from 50+ major Indian banks</p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Sticky summary (~35%) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Shield Protection Banner */}
            <div className="bg-vl-ink text-white p-5 rounded-vl-card flex gap-4 items-start shadow-vl-soft">
              <ShieldCheck aria-hidden="true" className="h-7 w-7 text-vl-accent shrink-0" />
              <div>
                <h3 className="font-bold text-sm mb-1 uppercase tracking-wider text-vl-accent">Shield Protection</h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Your transaction is fully secure. Funds are safely held escrowed and released to sellers only upon confirmation of delivery.
                </p>
              </div>
            </div>

            {/* Price details breakdown summary */}
            <section className="rounded-vl-card border border-vl-border bg-vl-card overflow-hidden shadow-vl-soft">
              <div className="p-5 border-b border-vl-border bg-vl-surface">
                <h2 className="font-vl-heading text-base font-bold text-vl-ink">Price Details</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between text-sm text-vl-muted">
                  <span>Price ({totalQuantityCount} {totalQuantityCount === 1 ? "item" : "items"})</span>
                  <span className="font-semibold text-vl-ink">{formatPrice(displayPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-vl-muted">
                  <span>Delivery Charges</span>
                  <span className="text-vl-success font-bold uppercase text-xs bg-vl-success/10 px-2 py-0.5 rounded-full">FREE</span>
                </div>
                {packagingFee > 0 && (
                  <div className="flex justify-between text-sm text-vl-muted">
                    <span>Secured Packaging Fee</span>
                    <span className="font-semibold text-vl-ink">{formatPrice(packagingFee)}</span>
                  </div>
                )}
                {platformFee > 0 && (
                  <div className="flex justify-between text-sm text-vl-muted">
                    <span>Platform Fee</span>
                    <span className="font-semibold text-vl-ink">{formatPrice(platformFee)}</span>
                  </div>
                )}
                
                <div className="pt-4 border-t border-dashed border-vl-border">
                  <div className="flex justify-between items-baseline mb-5">
                    <span className="font-vl-heading text-base font-bold text-vl-ink">Total Payable</span>
                    <span className="font-vl-heading text-2xl font-extrabold text-vl-primary">{formatPrice(subtotal)}</span>
                  </div>
                  
                  {/* Checkout CTA */}
                  <button
                    onClick={handlePayment}
                    disabled={isExpired || !selectedAddressId || isPaying}
                    className="w-full inline-flex min-h-[52px] items-center justify-center gap-2 rounded-vl-control bg-vl-primary text-sm font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.25)] transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isPaying ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Lock aria-hidden="true" className="h-4 w-4" />
                    )}
                    <span>
                      {isPaying ? "Processing Securely..." : `Pay Securely ${formatPrice(subtotal)}`}
                    </span>
                  </button>
                </div>
                
                <p className="text-[10px] text-center text-vl-muted leading-relaxed">
                  By completing the checkout, you agree to our{" "}
                  <a className="underline hover:text-vl-primary" href="/terms">Terms of Service</a>. Transactions are secured by standard 256-bit SSL encryption.
                </p>
              </div>

              {/* Trust badges footer */}
              <div className="border-t border-vl-border bg-vl-surface px-5 py-4 flex justify-around items-center gap-4 text-vl-muted">
                <div className="flex flex-col items-center gap-1 text-center shrink-0">
                  <Lock aria-hidden="true" className="h-4.5 w-4.5 text-vl-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">SSL Encrypted</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center shrink-0">
                  <ShieldCheck aria-hidden="true" className="h-4.5 w-4.5 text-vl-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Secure Gate</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center shrink-0">
                  <CheckCircle2 aria-hidden="true" className="h-4.5 w-4.5 text-vl-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">100% Assurance</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {/* MOBILE STICKY CTA BAR (Mobile viewport bottom-fixed drawer) */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-vl-border p-4 lg:hidden flex items-center justify-between gap-4 shadow-vl-large"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-vl-muted uppercase tracking-wider">Total Payable</span>
          <span className="text-lg font-extrabold text-vl-primary">{formatPrice(subtotal)}</span>
        </div>
        <button
          type="button"
          onClick={handlePayment}
          disabled={isExpired || !selectedAddressId || isPaying}
          className="flex-1 max-w-[220px] inline-flex min-h-11 items-center justify-center gap-2 rounded-vl-control bg-vl-primary text-xs font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.25)] transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98] disabled:opacity-50"
        >
          {isPaying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lock aria-hidden="true" className="h-3.5 w-3.5" />
          )}
          <span>{isPaying ? "PAYING..." : "PAY SECURELY"}</span>
        </button>
      </div>
    </div>
  );
}
