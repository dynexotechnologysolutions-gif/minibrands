"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  ShoppingBag,
  BadgeCheck,
  QrCode,
  CreditCard,
  Landmark,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Loader2,
  ChevronRight,
} from "lucide-react";

interface CheckoutProduct {
  id: string;
  name: string;
  price: number; // paise
  size: string;
  image: string;
  sellerName: string;
  isSellerVerified: boolean;
  quantity: number;
  variantId: string;
  sellerId: string;
}

interface GuestCheckoutClientProps {
  products: CheckoutProduct[];
  cartCount: number;
}

export default function GuestCheckoutClient({ products, cartCount }: GuestCheckoutClientProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [isPaying, setIsPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>("upi");

  const formatPrice = (amt: number) => {
    return (amt / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

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
    if (!name.trim() || !email.trim() || !phone.trim() || !line1.trim() || !city.trim() || !postalCode.trim()) {
      setErrorMessage("Please fill all required information fields.");
      return;
    }

    setIsPaying(true);
    setErrorMessage(null);

    try {
      // Create guest order intent
      const orderRes = await fetch("/api/payments/guest-create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestInfo: {
            name,
            email,
            phone,
            address: { line1, line2, city, state, postalCode },
          },
          products: products.map((p) => ({
            productId: p.id,
            variantId: p.variantId,
            quantity: p.quantity,
            price: p.price,
          })),
        }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json();
        setErrorMessage(errData.error || "Failed to initialize order checkout.");
        setIsPaying(false);
        return;
      }

      const { razorpayOrderId, amount, currency, keyId } = await orderRes.json();

      const isMockOrder =
        razorpayOrderId.startsWith("order_mock_") || !keyId || keyId.includes("mock");

      if (isMockOrder) {
        // Handle mock verification flow
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        
        // Remove guest cookie if checkout succeeded
        document.cookie = "mb-guest-cart=; Max-Age=0; path=/;";
        
        // Redirect to success page with rawToken
        router.push(`/order/success/guest/${verifyData.guestToken}`);
        return;
      }

      // Handle actual production Razorpay iframe flow
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setErrorMessage("Failed to load Razorpay Payment Gateway. Please check your internet connection.");
        setIsPaying(false);
        return;
      }

      const options = {
        key: keyId,
        amount,
        currency,
        name: "MINIBRANDS",
        description: `Guest order for ${products.map((p) => p.name).join(", ")}`,
        order_id: razorpayOrderId,
        handler: async function (paymentResponse: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
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
            
            // Cleanup guest cart cookie
            document.cookie = "mb-guest-cart=; Max-Age=0; path=/;";
            
            router.push(`/order/success/guest/${verifyData.guestToken}`);
          } catch (verifyErr: any) {
            setErrorMessage(verifyErr.message || "An unexpected error occurred during payment verification.");
            setIsPaying(false);
          }
        },
        prefill: {
          name,
          email,
          contact: phone,
        },
        theme: {
          color: "#FF3E6C",
        },
        modal: {
          ondismiss: function () {
            setErrorMessage("Payment was cancelled. You can retry.");
            setIsPaying(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: { error: { description: string } }) {
        setErrorMessage(response.error.description || "Payment failed. Please try again.");
        setIsPaying(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during payment setup.");
      setIsPaying(false);
    }
  };

  const subtotal = products.reduce((acc, p) => acc + p.price * p.quantity, 0); // paise
  const platformFee = subtotal > 10000 ? 1000 : 0;
  const packagingFee = subtotal > 10000 ? 5900 : 0;
  const displayPrice = subtotal - platformFee - packagingFee;

  return (
    <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink selection:bg-vl-primary/20">
      {/* Checkout Header */}
      <header className="border-b border-vl-border bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-30">
        <Link href="/cart" className="flex items-center gap-1 text-vl-muted hover:text-vl-ink">
          ← Back to Cart
        </Link>
        <span className="font-extrabold text-sm tracking-widest uppercase">Secure Checkout 🔒</span>
        <div className="w-16"></div>
      </header>

      <main className="vl-section-shell flex w-full flex-grow flex-col py-6 sm:py-8 lg:py-10 pb-28 lg:pb-10">
        <div className="mb-8 flex items-center justify-center gap-2 border-b border-vl-border pb-5 text-sm font-semibold sm:gap-4 md:justify-start">
          <span className="flex items-center gap-1.5 text-vl-primary font-bold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-vl-primary text-[10px] font-bold text-white">1</span>
            Guest Checkout
          </span>
          <ChevronRight className="h-4.5 w-4.5 text-vl-border shrink-0" />
          <span className="flex items-center gap-1.5 text-vl-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-vl-border text-[10px] font-bold text-vl-muted">2</span>
            Order Confirmed
          </span>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 border border-vl-border bg-vl-card rounded-vl-card shadow-vl-soft">
          <h3 className="font-bold text-sm mb-0.5">Checkout as Guest</h3>
          <p className="text-xs text-vl-muted">
            No account required. Complete your purchase details below.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 flex items-center justify-between rounded-vl-card border border-vl-danger/25 bg-vl-danger/10 p-4 text-xs font-bold text-red-950 shadow-vl-soft">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-vl-muted hover:text-vl-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* Contact Information Form */}
            <section className="rounded-vl-card border border-vl-border bg-vl-card p-6 shadow-vl-soft">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-vl-heading text-lg font-bold text-vl-ink">Contact Information</h2>
                <span className="text-xs text-vl-muted">
                  Already have an account?{" "}
                  <Link href="/login?redirectTo=/cart" className="text-vl-primary font-bold hover:underline">
                    Sign in
                  </Link>
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-vl-ink mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full min-h-11 rounded-vl-control border border-vl-border bg-vl-surface px-4 text-sm focus:border-vl-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-vl-ink mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full min-h-11 rounded-vl-control border border-vl-border bg-vl-surface px-4 text-sm focus:border-vl-primary focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-vl-ink mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. john@example.com"
                    className="w-full min-h-11 rounded-vl-control border border-vl-border bg-vl-surface px-4 text-sm focus:border-vl-primary focus:outline-none"
                  />
                  <p className="text-[10px] text-vl-muted mt-1.5">
                    We'll use this email to send order confirmation and delivery status notifications.
                  </p>
                </div>
              </div>
            </section>

            {/* Delivery Address Form */}
            <section className="rounded-vl-card border border-vl-border bg-vl-card p-6 shadow-vl-soft">
              <h2 className="font-vl-heading text-lg font-bold text-vl-ink mb-4">Delivery Address</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-vl-ink mb-1.5">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    placeholder="Line 1 (Flat, House, Building, Street)"
                    className="w-full min-h-11 rounded-vl-control border border-vl-border bg-vl-surface px-4 text-sm focus:border-vl-primary focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-vl-ink mb-1.5">Apartment, suite, unit etc. (optional)</label>
                  <input
                    type="text"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    placeholder="Line 2 (Optional)"
                    className="w-full min-h-11 rounded-vl-control border border-vl-border bg-vl-surface px-4 text-sm focus:border-vl-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-vl-ink mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Chennai"
                    className="w-full min-h-11 rounded-vl-control border border-vl-border bg-vl-surface px-4 text-sm focus:border-vl-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-vl-ink mb-1.5">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Tamil Nadu"
                    className="w-full min-h-11 rounded-vl-control border border-vl-border bg-vl-surface px-4 text-sm focus:border-vl-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-vl-ink mb-1.5">PIN / Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 600001"
                    className="w-full min-h-11 rounded-vl-control border border-vl-border bg-vl-surface px-4 text-sm focus:border-vl-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-vl-ink mb-1.5">Country</label>
                  <input
                    type="text"
                    disabled
                    value="India"
                    className="w-full min-h-11 rounded-vl-control border border-vl-border bg-vl-surface/50 px-4 text-sm opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>
            </section>

            {/* Review Items */}
            <section className="rounded-vl-card border border-vl-border bg-vl-card p-6 shadow-vl-soft">
              <h2 className="font-vl-heading text-lg font-bold text-vl-ink mb-4">Review Items ({cartCount})</h2>
              <div className="divide-y divide-vl-border">
                {products.map((item) => (
                  <div key={item.id + "-" + item.variantId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="w-20 h-24 flex-shrink-0 bg-vl-surface border border-vl-border rounded-vl-control overflow-hidden relative shadow-sm">
                      <Image fill className="object-cover" alt={item.name} src={item.image} sizes="80px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <h3 className="font-bold text-vl-ink text-sm sm:text-base truncate">{item.name}</h3>
                        <p className="font-vl-heading font-extrabold text-vl-ink text-base shrink-0">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <BadgeCheck className="text-vl-success h-4 w-4 shrink-0" />
                        <span className="text-[10px] font-bold text-vl-success uppercase tracking-wider">
                          {item.isSellerVerified ? "Verified Boutique" : "Boutique Seller"}
                        </span>
                      </div>
                      <p className="text-xs text-vl-muted mt-1">Size: {item.size} | Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Payment selections */}
            <section className="rounded-vl-card border border-vl-border bg-vl-card p-6 shadow-vl-soft">
              <div className="flex items-center gap-2 mb-5">
                <Lock className="text-vl-primary h-5 w-5 shrink-0" />
                <h2 className="font-vl-heading text-lg font-bold text-vl-ink">Payment Method</h2>
              </div>
              <div className="space-y-3.5">
                <label
                  onClick={() => setSelectedPayment("upi")}
                  className={`flex items-center justify-between p-4 border rounded-vl-card cursor-pointer transition-all duration-vl-fast ${
                    selectedPayment === "upi" ? "border-vl-primary bg-vl-primary/5" : "border-vl-border bg-vl-card hover:border-vl-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment-option"
                      checked={selectedPayment === "upi"}
                      onChange={() => setSelectedPayment("upi")}
                      className="h-4 w-4 text-vl-primary border-vl-border accent-vl-primary"
                    />
                    <div className="flex items-center gap-3">
                      <QrCode className="h-5 w-5 text-vl-muted shrink-0" />
                      <div>
                        <p className="font-bold text-vl-ink text-sm">UPI (GPay / PhonePe / Paytm)</p>
                        <p className="text-xs text-vl-muted mt-0.5">Instant UPI payment processing</p>
                      </div>
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setSelectedPayment("card")}
                  className={`flex items-center justify-between p-4 border rounded-vl-card cursor-pointer transition-all duration-vl-fast ${
                    selectedPayment === "card" ? "border-vl-primary bg-vl-primary/5" : "border-vl-border bg-vl-card hover:border-vl-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment-option"
                      checked={selectedPayment === "card"}
                      onChange={() => setSelectedPayment("card")}
                      className="h-4 w-4 text-vl-primary border-vl-border accent-vl-primary"
                    />
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-vl-muted shrink-0" />
                      <div>
                        <p className="font-bold text-vl-ink text-sm">Credit / Debit Card</p>
                        <p className="text-xs text-vl-muted mt-0.5">Secure payment processed by Razorpay</p>
                      </div>
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setSelectedPayment("netbanking")}
                  className={`flex items-center justify-between p-4 border rounded-vl-card cursor-pointer transition-all duration-vl-fast ${
                    selectedPayment === "netbanking" ? "border-vl-primary bg-vl-primary/5" : "border-vl-border bg-vl-card hover:border-vl-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment-option"
                      checked={selectedPayment === "netbanking"}
                      onChange={() => setSelectedPayment("netbanking")}
                      className="h-4 w-4 text-vl-primary border-vl-border accent-vl-primary"
                    />
                    <div className="flex items-center gap-3">
                      <Landmark className="h-5 w-5 text-vl-muted shrink-0" />
                      <div>
                        <p className="font-bold text-vl-ink text-sm">Net Banking</p>
                        <p className="text-xs text-vl-muted mt-0.5">Secure net banking gateway</p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Price Breakdown Sidebar */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="bg-vl-ink text-white p-5 rounded-vl-card flex gap-4 items-start shadow-vl-soft">
              <ShieldCheck className="h-7 w-7 text-vl-accent shrink-0" />
              <div>
                <h3 className="font-bold text-sm mb-1 uppercase tracking-wider text-vl-accent">Shield Protection</h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Transaction is secure. Funds are safely held and released to boutique boutiques only after shipping.
                </p>
              </div>
            </div>

            <section className="rounded-vl-card border border-vl-border bg-vl-card overflow-hidden shadow-vl-soft">
              <div className="p-5 border-b border-vl-border bg-vl-surface">
                <h2 className="font-vl-heading text-base font-bold text-vl-ink">Price Details</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between text-sm text-vl-muted">
                  <span>Price ({cartCount} {cartCount === 1 ? "item" : "items"})</span>
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

                  <button
                    onClick={handlePayment}
                    disabled={isPaying}
                    className="w-full inline-flex min-h-[52px] items-center justify-center gap-2 rounded-vl-control bg-vl-primary text-sm font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.25)] transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isPaying ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    <span>
                      {isPaying ? "Processing Securely..." : `Pay Securely ${formatPrice(subtotal)}`}
                    </span>
                  </button>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
