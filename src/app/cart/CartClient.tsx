"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeCartItem } from "@/actions/cart-remove.action";
import { updateCartItemQuantity } from "@/actions/cart-update.action";
import { trackClientEvent } from "@/actions/track-event.action";
import { createCheckoutSession } from "@/actions/checkout-session.action";
import HomeHeader from "@/components/home/HomeHeader";

interface CartItem {
  id: string; // reservationId
  productId: string;
  variantId: string;
  quantity: number;
  createdAt: string;
  name: string;
  price: number;
  size: string;
  image: string;
  sellerName: string;
  sellerId: string;
}

interface CartClientProps {
  initialItems: CartItem[];
  userProfile: any;
  cartCount: number;
  sellerHref: string;
}

// Helpers for mock discount calculations
const getOriginalPrice = (pricePaise: number) => {
  if (pricePaise === 349900) return 499900;
  if (pricePaise === 899900) return 1250000;

  // General fallback formula
  const priceRupees = pricePaise / 100;
  let originalRupees = Math.round(priceRupees * 1.35); // 35% markup
  if (originalRupees > 1000) {
    originalRupees = Math.floor(originalRupees / 100) * 100 + 99;
  } else if (originalRupees > 100) {
    originalRupees = Math.floor(originalRupees / 10) * 10 + 9;
  }
  return originalRupees * 100;
};

const getDiscountPercent = (price: number, originalPrice: number) => {
  if (originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

export default function CartClient({
  initialItems,
  userProfile,
  cartCount,
  sellerHref,
}: CartClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});
  const [expiredTracked, setExpiredTracked] = useState<Record<string, boolean>>({});
  const [isRemoving, setIsRemoving] = useState<Record<string, boolean>>({});
  const [updatingQuantity, setUpdatingQuantity] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Initialize and tick countdown timers
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const remaining: Record<string, number> = {};
      const now = Date.now();

      items.forEach((item) => {
        const createdTime = new Date(item.createdAt).getTime();
        const durationMs = 15 * 60 * 1000; // 15 minutes
        const elapsedMs = now - createdTime;
        const leftSeconds = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));
        remaining[item.id] = leftSeconds;

        // Trigger analytics if expired and not tracked yet
        if (leftSeconds === 0 && !expiredTracked[item.id]) {
          setExpiredTracked((prev) => ({ ...prev, [item.id]: true }));
          trackClientEvent("reservation_expired", {
            reservationId: item.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          });
          trackClientEvent("cart_abandoned", {
            reservationId: item.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          });
        }
      });

      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [items, expiredTracked]);

  const handleRemove = async (id: string) => {
    setIsRemoving((prev) => ({ ...prev, [id]: true }));
    setError(null);
    try {
      const response = await removeCartItem(id);
      if (response.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        setError(response.error?.message || "Failed to remove item.");
      }
    } catch (err) {
      console.error("Failed to remove item:", err);
      setError("An unexpected error occurred while removing the item.");
    } finally {
      setIsRemoving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleQuantityChange = async (itemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1 || newQty > 5) return;

    setError(null);
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: newQty } : item))
    );
    setUpdatingQuantity((prev) => ({ ...prev, [itemId]: true }));

    try {
      const res = await updateCartItemQuantity(itemId, newQty);
      if (!res.success) {
        // Rollback
        setItems((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, quantity: currentQty } : item))
        );
        setError(res.error?.message || "Failed to update quantity.");
      }
    } catch (err) {
      console.error("Failed to update quantity:", err);
      // Rollback
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity: currentQty } : item))
      );
      setError("An error occurred while updating quantity.");
    } finally {
      setUpdatingQuantity((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "Expired";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatPrice = (amount: number) => {
    return (amount / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  // Find active and non-expired items
  const activeItems = items.filter((item) => (timeRemaining[item.id] ?? 900) > 0);
  const minSeconds =
    activeItems.length > 0
      ? Math.min(...activeItems.map((item) => timeRemaining[item.id] ?? 900))
      : 0;

  // Totals calculations based on active items
  const subtotal = activeItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = Math.floor(subtotal * 0.4); // 40% discount matching default HTML ratio
  const platformFee = activeItems.length > 0 ? 2900 : 0; // ₹29 flat platform fee in paise
  const grandTotal = subtotal - discount + platformFee;

  const hasActiveItems = activeItems.length > 0;

  const handleProceedToCheckout = async () => {
    if (hasActiveItems) {
      setIsCheckingOut(true);
      setError(null);
      try {
        const payload = {
          mode: "CART_CHECKOUT" as const,
          products: activeItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            image: item.image,
            sellerName: item.sellerName,
            sellerId: item.sellerId,
            reservationId: item.id,
          })),
        };

        const sessionRes = await createCheckoutSession(payload);
        if (sessionRes.success && sessionRes.sessionId) {
          router.push(`/checkout?sessionId=${sessionRes.sessionId}`);
        } else {
          setError(sessionRes.error || "Failed to initiate checkout.");
        }
      } catch (err) {
        console.error("Checkout failed:", err);
        setError("An unexpected error occurred during checkout setup.");
      } finally {
        setIsCheckingOut(false);
      }
    }
  };

  // Compute total cart quantity count dynamically to update nav badge
  const dynamicCartCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  // Render Empty State
  if (items.length === 0) {
    return (
      <div className="bg-surface-bg font-body-md text-on-surface antialiased min-h-screen flex flex-col w-full">
        <HomeHeader
          userProfile={userProfile}
          cartCount={0}
          sellerHref={sellerHref}
        />
        <main className="flex-grow w-full max-w-container-max mx-auto px-base md:px-lg flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center bg-white border border-border-gray rounded-[8px] p-[48px] mt-[48px] w-full max-w-[420px] text-center shadow-sm">
            {/* Large cart illustration / icon */}
            <div className="text-secondary/60 mb-4 flex items-center justify-center">
              <span className="material-symbols-outlined text-[80px] font-light">shopping_cart</span>
            </div>

            {/* Heading */}
            <h2 className="font-headline-sm text-headline-sm text-primary mb-3">
              Your cart is empty
            </h2>

            {/* Description */}
            <p className="text-secondary font-body-md mb-6 leading-relaxed">
              Looks like you haven't reserved any items yet. Explore our curated collections.
            </p>

            {/* Shop Now Button */}
            <Link
              href="/products"
              className="inline-block bg-primary text-on-primary px-lg py-sm rounded font-label-bold uppercase tracking-widest hover:bg-opacity-90 transition-all duration-200 cursor-pointer"
            >
              Shop Now
            </Link>
          </div>
        </main>
        {/* Footer Component */}
        <footer className="bg-surface-container-high text-on-surface w-full mt-xxl border-t border-border-gray">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-base px-base py-xl max-w-container-max mx-auto">
            <div className="space-y-base">
              <span className="font-headline-sm text-headline-sm font-bold text-primary">MINIBRANDS</span>
              <p className="font-body-sm text-on-surface-variant max-w-xs">
                Elevating the shopping experience across India with curated selections and artisanal excellence.
              </p>
              <p className="font-body-sm text-body-sm">© 2024 MINIBRANDS India. All rights reserved.</p>
            </div>
            <div className="space-y-base">
              <h4 className="font-label-bold text-primary">Company</h4>
              <ul className="space-y-sm">
                <li><a className="text-on-surface-variant hover:underline hover:text-primary transition-all duration-200 font-body-sm" href="#">About Us</a></li>
                <li><a className="text-on-surface-variant hover:underline hover:text-primary transition-all duration-200 font-body-sm" href="#">Terms of Service</a></li>
                <li><a className="text-on-surface-variant hover:underline hover:text-primary transition-all duration-200 font-body-sm" href="#">Privacy Policy</a></li>
              </ul>
            </div>
            <div className="space-y-base">
              <h4 className="font-label-bold text-primary">Customer Care</h4>
              <ul className="space-y-sm">
                <li><a className="text-on-surface-variant hover:underline hover:text-primary transition-all duration-200 font-body-sm" href="#">Return Policy</a></li>
                <li><a className="text-on-surface-variant hover:underline hover:text-primary transition-all duration-200 font-body-sm" href="#">Contact Us</a></li>
                <li><a className="text-on-surface-variant hover:underline hover:text-primary transition-all duration-200 font-body-sm" href="#">FAQ</a></li>
              </ul>
            </div>
            <div className="space-y-base">
              <h4 className="font-label-bold text-primary">Connect</h4>
              <div className="flex gap-base">
                <span className="material-symbols-outlined cursor-pointer hover:text-primary">language</span>
                <span className="material-symbols-outlined cursor-pointer hover:text-primary">share</span>
                <span className="material-symbols-outlined cursor-pointer hover:text-primary">mail</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="bg-surface-bg text-on-surface font-sans min-h-screen flex flex-col w-full">
      {/* TopNavBar */}
      <HomeHeader
        userProfile={userProfile}
        cartCount={dynamicCartCount}
        sellerHref={sellerHref}
      />

      <main className="max-w-container-max mx-auto px-base md:px-lg pt-24 pb-xxl w-full flex-grow">
        {/* Countdown Timer Section */}
        {activeItems.length > 0 && (
          <div className="mb-base bg-surface-container-lowest border border-border-gray p-md rounded flex items-center justify-center gap-sm shadow-sm">
            <span className="material-symbols-outlined text-accent-yellow" style={{ fontVariationSettings: "'FILL' 1" }}>
              timer
            </span>
            <span className="font-label-bold text-label-bold">
              Items in your cart are reserved for{" "}
              <span className="text-error-red">{formatTime(minSeconds)}</span> minutes
            </span>
          </div>
        )}

        {/* Expired reservations banner */}
        {items.length > 0 && activeItems.length === 0 && (
          <div className="mb-base bg-error-container border border-error p-md rounded flex items-center justify-center gap-sm shadow-sm">
            <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
              timer
            </span>
            <span className="font-label-bold text-label-bold text-on-error-container">
              Your cart reservations have expired. Please remove expired items and reserve them again.
            </span>
          </div>
        )}

        {/* General Error Banner */}
        {error && (
          <div className="mb-base bg-error-container border border-error text-on-error-container p-md rounded flex items-center justify-between gap-sm shadow-sm">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-error">error</span>
              <span className="font-body-md">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-secondary hover:text-primary cursor-pointer">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-8 space-y-base">
            <div className="bg-surface-container-lowest border border-border-gray rounded p-base shadow-sm">
              <h1 className="font-headline-sm text-headline-sm mb-lg">
                Your Shopping Cart ({items.length} {items.length === 1 ? "Item" : "Items"})
              </h1>

              {items.map((item) => {
                const itemSecondsLeft = timeRemaining[item.id] ?? 900;
                const isExpired = itemSecondsLeft <= 0;

                const itemSellingPrice = item.price * item.quantity;
                const itemOriginalPrice = getOriginalPrice(item.price) * item.quantity;
                const itemDiscountPercent = getDiscountPercent(item.price, getOriginalPrice(item.price));

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col md:flex-row gap-base py-lg border-b border-border-gray last:border-0 transition-opacity duration-200 ${
                      isExpired ? "opacity-60" : ""
                    }`}
                  >
                    {/* Image */}
                    <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 bg-surface-container rounded overflow-hidden relative">
                      <img
                        alt={item.name}
                        className="w-full h-full object-cover"
                        src={item.image}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-grow space-y-xs">
                      <div className="flex justify-between">
                        <p className="text-secondary font-body-sm uppercase tracking-wider">
                          {item.sellerName}
                        </p>
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={isRemoving[item.id]}
                          className="text-error-red hover:underline text-body-sm flex items-center gap-xs cursor-pointer disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>{" "}
                          {isRemoving[item.id] ? "Removing..." : "Remove"}
                        </button>
                      </div>

                      <h3 className="font-label-bold text-label-bold text-lg text-primary">
                        {item.name}
                      </h3>

                      <p className="text-secondary font-body-sm">
                        Variant: {item.size}
                      </p>

                      <div className="flex items-center gap-xl pt-md">
                        {/* Quantity Controls */}
                        {isExpired ? (
                          <span className="text-error-red font-label-bold text-body-sm bg-error-container px-sm py-xs rounded border border-error">
                            Reservation Expired
                          </span>
                        ) : (
                          <div className="flex items-center border border-border-gray rounded overflow-hidden bg-white">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                              disabled={item.quantity <= 1 || updatingQuantity[item.id]}
                              className="px-3 py-1 hover:bg-surface-container-low border-r border-border-gray disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold"
                            >
                              -
                            </button>
                            <span className="px-4 py-1 font-label-bold text-on-surface">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                              disabled={item.quantity >= 5 || updatingQuantity[item.id]}
                              className="px-3 py-1 hover:bg-surface-container-low border-l border-border-gray disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold"
                            >
                              +
                            </button>
                          </div>
                        )}

                        {/* Prices */}
                        <div className="flex items-baseline gap-sm">
                          <span className="font-price-lg text-price-lg">
                            {formatPrice(itemSellingPrice)}
                          </span>
                          {itemOriginalPrice > itemSellingPrice && (
                            <>
                              <span className="text-secondary line-through text-body-sm">
                                {formatPrice(itemOriginalPrice)}
                              </span>
                              <span className="text-success-green text-body-sm font-label-bold">
                                {itemDiscountPercent}% OFF
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trust Section */}
            <div className="bg-surface-container-low rounded p-lg grid grid-cols-1 md:grid-cols-3 gap-base">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-success-green">lock</span>
                <span className="font-label-bold text-body-sm uppercase">Secure Payment</span>
              </div>
              <div className="flex items-center gap-sm border-l-0 md:border-l border-border-gray md:pl-base">
                <span className="material-symbols-outlined text-success-green">verified_user</span>
                <span className="font-label-bold text-body-sm uppercase">Escrow Protected</span>
              </div>
              <div className="flex items-center gap-sm border-l-0 md:border-l border-border-gray md:pl-base">
                <span className="material-symbols-outlined text-success-green">check_circle</span>
                <span className="font-label-bold text-body-sm uppercase">Verified Sellers</span>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4 sticky top-[80px]">
            <div className="bg-surface-container-lowest border border-border-gray rounded p-base space-y-lg shadow-sm">
              <h2 className="font-label-bold text-label-bold text-secondary uppercase tracking-widest border-b border-border-gray pb-sm">
                Order Summary
              </h2>

              <div className="space-y-md">
                <div className="flex justify-between text-body-md">
                  <span className="text-secondary">Price ({activeItems.length} {activeItems.length === 1 ? "item" : "items"})</span>
                  <span className="text-primary">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="text-secondary">Discount</span>
                  <span className="text-success-green">-{formatPrice(discount)}</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="text-secondary">Platform Fee</span>
                  <span className="text-primary">{formatPrice(platformFee)}</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="text-secondary">Delivery Charges</span>
                  <span className="text-success-green uppercase font-label-bold text-sm">Free</span>
                </div>
              </div>

              <div className="border-t border-dashed border-border-gray pt-lg flex justify-between items-baseline">
                <span className="font-headline-sm text-headline-sm text-primary">Total Amount</span>
                <span className="font-headline-sm text-headline-sm text-primary">{formatPrice(grandTotal)}</span>
              </div>

              {discount > 0 && (
                <p className="text-success-green font-label-bold text-body-sm text-center">
                  You will save {formatPrice(discount)} on this order
                </p>
              )}

              <button
                onClick={handleProceedToCheckout}
                disabled={!hasActiveItems || isCheckingOut}
                className="w-full bg-primary text-on-primary py-lg rounded font-label-bold uppercase tracking-widest hover:bg-opacity-90 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
              </button>

              <div className="bg-surface-container px-base py-md rounded text-center">
                <p className="text-body-sm text-on-surface-variant flex items-center justify-center gap-xs">
                  <span className="material-symbols-outlined text-sm">local_shipping</span>
                  Safe and Secure Payments. Easy returns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Component */}
      <footer className="bg-surface-container-high text-on-surface w-full mt-xxl border-t border-border-gray">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-base px-base py-xl max-w-container-max mx-auto">
          <div className="space-y-base">
            <span className="font-headline-sm text-headline-sm font-bold text-primary">MINIBRANDS</span>
            <p className="font-body-sm text-on-surface-variant max-w-xs">
              Elevating the shopping experience across India with curated selections and artisanal excellence.
            </p>
            <p className="font-body-sm text-body-sm">© 2024 MINIBRANDS India. All rights reserved.</p>
          </div>
          <div className="space-y-base">
            <h4 className="font-label-bold text-primary">Company</h4>
            <ul className="space-y-sm">
              <li><a className="text-on-surface-variant hover:underline hover:text-primary transition-all duration-200 font-body-sm" href="#">About Us</a></li>
              <li><a className="text-on-surface-variant hover:underline hover:text-primary transition-all duration-200 font-body-sm" href="#">Terms of Service</a></li>
              <li><a className="text-on-surface-variant hover:underline hover:text-primary transition-all duration-200 font-body-sm" href="#">Privacy Policy</a></li>
            </ul>
          </div>
          <div className="space-y-base">
            <h4 className="font-label-bold text-primary">Customer Care</h4>
            <ul className="space-y-sm">
              <li><a className="text-on-surface-variant hover:underline hover:text-primary transition-all duration-200 font-body-sm" href="#">Return Policy</a></li>
              <li><a className="text-on-surface-variant hover:underline hover:text-primary transition-all duration-200 font-body-sm" href="#">Contact Us</a></li>
              <li><a className="text-on-surface-variant hover:underline hover:text-primary transition-all duration-200 font-body-sm" href="#">FAQ</a></li>
            </ul>
          </div>
          <div className="space-y-base">
            <h4 className="font-label-bold text-primary">Connect</h4>
            <div className="flex gap-base">
              <span className="material-symbols-outlined cursor-pointer hover:text-primary">language</span>
              <span className="material-symbols-outlined cursor-pointer hover:text-primary">share</span>
              <span className="material-symbols-outlined cursor-pointer hover:text-primary">mail</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
