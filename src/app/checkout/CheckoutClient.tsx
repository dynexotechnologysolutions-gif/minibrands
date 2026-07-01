"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createOrder } from "@/actions/order-create.action";
import { createCheckoutOrder } from "@/actions/checkout-order-create.action";
import { mockConfirmPayment } from "@/actions/payment-mock-confirm.action";
import { trackClientEvent } from "@/actions/track-event.action";
import HomeHeader from "@/components/home/HomeHeader";

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
  userProfile: any;
  cartCount: number;
  sellerHref: string;
  initialAddressId?: string;
}

export default function CheckoutClient({
  reservationId,
  createdAt,
  products,
  mode,
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
        handler: async function (paymentResponse: any) {
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
          } catch (verifyErr: any) {
            setErrorMessage(verifyErr.message || "An unexpected error occurred during payment verification.");
            setIsPaying(false);
          }
        },
        prefill: {
          name: selectedAddress?.fullName || buyerName,
          email: buyerEmail,
          contact: selectedAddress?.phone || "",
        },
        theme: {
          color: "#000000",
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

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on("payment.failed", function (response: any) {
        setErrorMessage(response.error.description || "Payment failed. Please try again.");
        setIsPaying(false);
      });

      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during payment setup.");
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
    <div className="text-on-surface bg-background font-sans min-h-screen flex flex-col w-full">
      {/* Reused Header */}
      <HomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      <main className="mt-xxl pt-lg max-w-container-max mx-auto px-base md:px-lg pb-xxl w-full flex-grow">
        {/* Checkout Progress (Subtle) */}
        <div className="flex items-center gap-base mb-lg text-body-sm text-secondary">
          <Link href="/cart" className="hover:text-primary transition-colors">Cart</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-label-bold text-primary">Secure Checkout</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-secondary/50">Order Success</span>
        </div>

        {/* Hold Reservation status banner */}
        <div
          className={`mb-base p-4 rounded border flex items-center justify-between transition-colors shadow-sm ${
            isExpired
              ? "bg-error-container border-error text-on-error-container"
              : isNearExpiration
              ? "bg-accent-yellow/10 border-accent-yellow text-accent-yellow animate-pulse"
              : "bg-surface-container-lowest border-border-gray text-primary"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="material-symbols-outlined text-base">timer</span>
            <span>
              {isExpired
                ? "Your cart hold has expired."
                : `Items reserved for ${formatTime(secondsLeft)} before releasing.`}
            </span>
          </div>
          {isExpired && (
            <Link
              href="/cart"
              className="text-xs font-extrabold underline uppercase tracking-wider hover:opacity-80"
            >
              Return to Cart
            </Link>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-base p-4 bg-error-container border border-error text-on-error-container rounded text-xs font-bold shadow-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="cursor-pointer hover:opacity-80">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start">
          {/* Left Column: Content Review */}
          <div className="lg:col-span-8 space-y-base">
            {/* Address Card */}
            {!isChangingAddress ? (
              <section className="bg-surface-container-lowest p-lg border border-border-gray rounded shadow-sm">
                <div className="flex justify-between items-start mb-md">
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                    <h2 className="font-headline-sm text-headline-sm">Shipping Address</h2>
                  </div>
                  <button
                    onClick={() => setIsChangingAddress(true)}
                    className="text-primary font-label-bold text-body-sm hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
                {selectedAddress ? (
                  <div className="text-body-md text-on-surface-variant">
                    <p className="font-bold text-on-surface">{selectedAddress.fullName}</p>
                    <p className="">{selectedAddress.line1}</p>
                    {selectedAddress.line2 && <p className="">{selectedAddress.line2}</p>}
                    <p className="">{selectedAddress.city} - {selectedAddress.pincode}</p>
                    <p className="mt-sm">
                      <span className="font-semibold text-on-surface">Phone:</span>{" "}
                      {selectedAddress.phone}
                    </p>
                  </div>
                ) : (
                  <div className="text-body-md text-on-surface-variant text-center py-sm">
                    <p className="text-error-red mb-sm font-bold">No shipping address selected.</p>
                    <Link
                      href={`/account/addresses?redirectTo=${encodeURIComponent(`/checkout?${redirectUrlParam}`)}&${redirectUrlParam}`}
                      className="inline-block px-4 py-2 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider rounded"
                    >
                      Add Address
                    </Link>
                  </div>
                )}
              </section>
            ) : (
              <section className="bg-surface-container-lowest p-lg border border-border-gray rounded shadow-sm">
                <div className="flex justify-between items-start mb-md">
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                    <h2 className="font-headline-sm text-headline-sm">Select Shipping Address</h2>
                  </div>
                  <button
                    onClick={() => setIsChangingAddress(false)}
                    className="text-primary font-label-bold text-body-sm hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-secondary font-body-sm mb-4">No shipping addresses found.</p>
                    <Link
                      href={`/account/addresses?redirectTo=${encodeURIComponent(`/checkout?${redirectUrlParam}`)}&${redirectUrlParam}`}
                      className="inline-block px-4 py-2 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider rounded"
                    >
                      Create Address
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-sm">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <label
                          key={addr.id}
                          className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-surface-container-low"
                              : "border-border-gray hover:bg-surface-container-low"
                          }`}
                        >
                          <input
                            type="radio"
                            name="checkout-address"
                            value={addr.id}
                            checked={isSelected}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 w-4 h-4 text-primary focus:ring-primary border-slate-300 transition-all cursor-pointer"
                          />
                          <div className="text-body-sm text-secondary">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-primary">{addr.fullName}</span>
                              {addr.isDefault && (
                                <span className="text-[10px] font-bold text-success-green bg-surface-container px-1 rounded uppercase tracking-wider">
                                  Default
                                </span>
                              )}
                            </div>
                            <p>{addr.line1}</p>
                            {addr.line2 && <p>{addr.line2}</p>}
                            <p>{addr.city} - {addr.pincode}</p>
                            <p className="mt-1">Phone: {addr.phone}</p>
                          </div>
                        </label>
                      );
                    })}

                    <div className="flex items-center justify-between pt-sm">
                      <Link
                        href={`/account/addresses?redirectTo=${encodeURIComponent(`/checkout?${redirectUrlParam}`)}&${redirectUrlParam}`}
                        className="text-primary font-bold text-body-sm hover:underline"
                      >
                        Manage Addresses
                      </Link>
                      <button
                        onClick={() => setIsChangingAddress(false)}
                        className="bg-primary text-on-primary px-4 py-2 rounded text-body-sm font-label-bold hover:opacity-90 cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Order Review Card */}
            <section className="bg-surface-container-lowest p-lg border border-border-gray rounded shadow-sm">
              <div className="flex items-center gap-sm mb-lg">
                <span className="material-symbols-outlined text-primary">shopping_bag</span>
                <h2 className="font-headline-sm text-headline-sm">Order Summary ({totalQuantityCount} {totalQuantityCount === 1 ? "Item" : "Items"})</h2>
              </div>

              {/* Item Card list */}
              {products.map((item) => (
                <div key={item.id + "-" + item.variantId} className="flex gap-base py-base border-b border-border-gray last:border-0">
                  <div className="w-24 h-24 flex-shrink-0 bg-surface-container border border-border-gray rounded overflow-hidden">
                    <img className="w-full h-full object-cover" alt={item.name} src={item.image} />
                  </div>
                  <div className="flex-1">
                     <div className="flex justify-between items-start">
                       <h3 className="font-label-bold text-body-lg text-primary">{item.name}</h3>
                       <p className="font-price-lg text-price-lg text-primary">{formatPrice(item.price * item.quantity)}</p>
                     </div>
                     <div className="mt-xs inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-[10px] font-bold text-secondary uppercase tracking-tight">
                       <span
                         className="material-symbols-outlined text-[12px]"
                         style={{ fontVariationSettings: "'FILL' 1" }}
                       >
                         verified
                       </span>
                       {item.isSellerVerified ? "Verified Seller" : "Boutique Seller"}
                     </div>
                     <p className="text-body-sm text-on-surface-variant mt-xs">Variant: {item.size} | Qty: {item.quantity}</p>
                     <p className="text-body-sm text-success-green font-semibold mt-xs">Estimated Delivery: Tomorrow, 10 AM - 2 PM</p>
                  </div>
                </div>
              ))}
            </section>

            {/* Payment Method Card */}
            <section className="bg-surface-container-lowest p-lg border border-border-gray rounded shadow-sm">
              <div className="flex items-center gap-sm mb-lg">
                <span className="material-symbols-outlined text-primary">payments</span>
                <h2 className="font-headline-sm text-headline-sm">Select Payment Method</h2>
              </div>
              <div className="space-y-md">
                {/* UPI Option */}
                <div className="relative">
                  <input
                    checked={selectedPayment === "upi"}
                    onChange={() => setSelectedPayment("upi")}
                    className="peer hidden payment-radio"
                    id="upi"
                    name="payment"
                    type="radio"
                  />
                  <label
                    className="flex items-center justify-between p-base border border-border-gray rounded cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-surface-container-low"
                    htmlFor="upi"
                  >
                    <div className="flex items-center gap-base">
                      <span className="material-symbols-outlined text-primary">qr_code_2</span>
                      <div>
                        <p className="font-label-bold text-body-lg text-primary">UPI (GPay, PhonePe, Paytm)</p>
                        <p className="text-body-sm text-on-surface-variant">Pay directly from your bank account</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-5 bg-surface-container rounded-sm"></div>
                      <div className="w-8 h-5 bg-surface-container rounded-sm"></div>
                    </div>
                  </label>
                </div>
                {/* Card Option */}
                <div className="relative">
                  <input
                    checked={selectedPayment === "card"}
                    onChange={() => setSelectedPayment("card")}
                    className="peer hidden payment-radio"
                    id="card"
                    name="payment"
                    type="radio"
                  />
                  <label
                    className="flex items-center justify-between p-base border border-border-gray rounded cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-surface-container-low"
                    htmlFor="card"
                  >
                    <div className="flex items-center gap-base">
                      <span className="material-symbols-outlined text-primary">credit_card</span>
                      <div>
                        <p className="font-label-bold text-body-lg text-primary">Credit / Debit Card</p>
                        <p className="text-body-sm text-on-surface-variant">All major cards accepted. Secure 128-bit encryption.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-secondary opacity-50">contactless</span>
                    </div>
                  </label>
                </div>
                {/* Net Banking */}
                <div className="relative">
                  <input
                    checked={selectedPayment === "netbanking"}
                    onChange={() => setSelectedPayment("netbanking")}
                    className="peer hidden payment-radio"
                    id="netbanking"
                    name="payment"
                    type="radio"
                  />
                  <label
                    className="flex items-center justify-between p-base border border-border-gray rounded cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-surface-container-low"
                    htmlFor="netbanking"
                  >
                    <div className="flex items-center gap-base">
                      <span className="material-symbols-outlined text-primary">account_balance</span>
                      <div>
                        <p className="font-label-bold text-body-lg text-primary">Net Banking</p>
                        <p className="text-body-sm text-on-surface-variant">Select from 50+ Indian banks</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Summary & Escrow */}
          <div className="lg:col-span-4 space-y-base sticky top-24">
            {/* Escrow Explainer */}
            <section className="bg-primary text-on-primary p-lg rounded flex gap-base items-start shadow-sm">
              <span
                className="material-symbols-outlined text-accent-yellow text-headline-md"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
              <div>
                <h3 className="font-label-bold text-body-lg mb-xs">MINIBRANDS Shield Protection</h3>
                <p className="text-body-sm text-on-primary-container leading-relaxed">
                  Your payment is protected. Funds are held securely and released to the seller only after successful delivery confirmation.
                </p>
              </div>
            </section>

            {/* Payment Summary */}
            <section className="bg-surface-container-lowest border border-border-gray rounded overflow-hidden shadow-sm">
              <div className="p-lg bg-surface-container-low border-b border-border-gray">
                <h2 className="font-headline-sm text-headline-sm text-primary">Order Summary</h2>
              </div>
              <div className="p-lg space-y-md">
                <div className="flex justify-between text-body-md text-on-surface-variant">
                  <span>Price ({totalQuantityCount} {totalQuantityCount === 1 ? "item" : "items"})</span>
                  <span>{formatPrice(displayPrice)}</span>
                </div>
                <div className="flex justify-between text-body-md text-on-surface-variant">
                  <span>Delivery Charges</span>
                  <span className="text-success-green font-semibold">FREE</span>
                </div>
                {packagingFee > 0 && (
                  <div className="flex justify-between text-body-md text-on-surface-variant">
                    <span>Secured Packaging Fee</span>
                    <span>{formatPrice(packagingFee)}</span>
                  </div>
                )}
                {platformFee > 0 && (
                  <div className="flex justify-between text-body-md text-on-surface-variant">
                    <span>Platform Fee</span>
                    <span>{formatPrice(platformFee)}</span>
                  </div>
                )}
                <div className="pt-base border-t border-dashed border-border-gray">
                  <div className="flex justify-between items-baseline mb-base">
                    <span className="font-headline-sm text-headline-sm text-primary">Total Payable</span>
                    <span className="font-headline-md text-headline-md text-primary">{formatPrice(subtotal)}</span>
                  </div>
                  {/* CTA */}
                  <button
                    onClick={handlePayment}
                    disabled={isExpired || !selectedAddressId || isPaying}
                    className="w-full bg-primary text-on-primary py-lg rounded-lg font-headline-sm flex items-center justify-center gap-base active:scale-[0.98] transition-transform hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="material-symbols-outlined">lock</span>
                    <span>
                      {isPaying ? "Processing..." : `Pay Securely ${formatPrice(subtotal)}`}
                    </span>
                  </button>
                </div>
                <p className="text-[10px] text-center text-on-surface-variant mt-sm">
                  By clicking Pay Securely, you agree to our{" "}
                  <a className="underline" href="#">Terms of Service</a>. Your data is encrypted and secure.
                </p>
              </div>
              {/* Trust Badges */}
              <div className="px-lg pb-lg flex justify-center items-center gap-lg grayscale opacity-50">
                <span className="material-symbols-outlined" title="Secure SSL">lock</span>
                <span className="material-symbols-outlined" title="Verified Payments">verified</span>
                <span className="material-symbols-outlined" title="24/7 Support">support_agent</span>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-xxl bg-surface-container-high border-t border-border-gray">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-base px-base py-xl max-w-container-max mx-auto">
          <div>
            <h4 className="font-headline-sm text-headline-sm font-bold text-primary mb-base">MINIBRANDS</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              India's leading marketplace for direct-to-consumer and boutique brands. Quality products, secure payments, and fast delivery.
            </p>
          </div>
          <div className="space-y-sm">
            <h5 className="font-label-bold text-primary">About</h5>
            <ul className="space-y-xs">
              <li><a className="text-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">About Us</a></li>
              <li><a className="text-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">Contact Us</a></li>
            </ul>
          </div>
          <div className="space-y-sm">
            <h5 className="font-label-bold text-primary">Policy</h5>
            <ul className="space-y-xs">
              <li><a className="text-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">Terms of Service</a></li>
              <li><a className="text-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">Privacy Policy</a></li>
              <li><a className="text-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">Return Policy</a></li>
            </ul>
          </div>
          <div className="space-y-sm">
            <h5 className="font-label-bold text-primary">Help</h5>
            <ul className="space-y-xs">
              <li><a className="text-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">Payments</a></li>
              <li><a className="text-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">Shipping</a></li>
              <li><a className="text-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">Cancellation &amp; Returns</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border-gray py-base px-base text-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant">© 2024 MINIBRANDS India. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
