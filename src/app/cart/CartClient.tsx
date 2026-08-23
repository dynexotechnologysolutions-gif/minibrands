"use client";

/**
 * CartClient
 * @redesigned v5.0 — visual redesign only, all callbacks, reservation logic, and calculations preserved.
 *
 * Purpose:
 *   Premium e-commerce Shopping Bag (Cart) page. Features an elegant progress stepper,
 *   active reservation timers, detail-rich product cards with verified badges, expandable
 *   coupon selectors, a sticky pricing summary panel, and a bottom mobile checkout bar.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Trash2,
  Heart,
  ChevronRight,
  ShieldCheck,
  Lock,
  Loader2,
  Compass,
  Tag,
  AlertTriangle,
  Clock,
  Truck,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { removeCartItem } from "@/actions/cart-remove.action";
import { updateCartItemQuantity } from "@/actions/cart-update.action";
import { trackClientEvent } from "@/actions/track-event.action";
import { createCheckoutSession } from "@/actions/checkout-session.action";
import { addToWishlistAction, removeFromWishlistAction } from "@/actions/wishlist.action";
import HomeHeader from "@/components/home/HomeHeader";
import ProductCard from "@/features/catalog/components/ProductCard";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userProfile: any;
  cartCount: number;
  sellerHref: string;
}

// Helpers for mock discount calculations
const getOriginalPrice = (pricePaise: number) => {
  if (pricePaise === 349900) return 499900;
  if (pricePaise === 899900) return 1250000;

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Recommendations state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  // Coupon Accordion State
  const [isCouponExpanded, setIsCouponExpanded] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

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

  // Fetch recommendations on mount
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch("/api/products?limit=4&sort=popularity");
        if (res.ok) {
          const data = await res.json();
          const products = data.products || data.data;
          if (Array.isArray(products)) {
            setRecommendedProducts(products);
          }
        }
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
      } finally {
        setLoadingRecommendations(false);
      }
    };
    fetchRecommendations();
  }, []);

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

  const handleMoveToWishlist = async (productId: string, cartItemId: string) => {
    setError(null);
    setIsRemoving((prev) => ({ ...prev, [cartItemId]: true }));
    try {
      const res = await addToWishlistAction(productId);
      if (res.success) {
        const removeRes = await removeCartItem(cartItemId);
        if (removeRes.success) {
          setItems((prev) => prev.filter((item) => item.id !== cartItemId));
        } else {
          setError(removeRes.error?.message || "Moved to wishlist, but failed to remove from cart.");
        }
      } else {
        setError("Failed to move item to wishlist.");
      }
    } catch (err) {
      console.error("Failed to move to wishlist:", err);
      setError("An unexpected error occurred while moving the item to your wishlist.");
    } finally {
      setIsRemoving((prev) => ({ ...prev, [cartItemId]: false }));
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

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    const cleanCode = couponCode.trim().toUpperCase();
    if (cleanCode === "VELVET40" || cleanCode === "MINI20") {
      setAppliedCoupon(cleanCode);
      setCouponSuccess(`Coupon "${cleanCode}" applied! You save an extra 40% on products.`);
      setCouponError(null);
    } else {
      setCouponError("Invalid coupon code. Try 'VELVET40'.");
      setCouponSuccess(null);
    }
  };

  // Find active and non-expired items
  const activeItems = items.filter((item) => (timeRemaining[item.id] ?? 900) > 0);
  const minSeconds =
    activeItems.length > 0
      ? Math.min(...activeItems.map((item) => timeRemaining[item.id] ?? 900))
      : 0;

  // Totals calculations based on active items
  const subtotal = activeItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const originalPrice = activeItems.reduce((acc, item) => acc + getOriginalPrice(item.price) * item.quantity, 0);
  const discount = Math.floor(subtotal * 0.4); // 40% discount
  const platformFee = activeItems.length > 0 ? 2900 : 0; // ₹29 flat platform fee in paise
  const grandTotal = subtotal - discount + platformFee;

  const hasActiveItems = activeItems.length > 0;

  const handleProceedToCheckout = async () => {
    if (hasActiveItems) {
      setIsCheckingOut(true);
      setError(null);
      try {
        if (!userProfile) {
          // Guest user: call public guest-checkout session API
          const res = await fetch("/api/guest-checkout/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "CART_CHECKOUT" }),
          });

          const data = await res.json();
          if (!res.ok || !data.sessionId) {
            setError(data.error || "Failed to initiate checkout.");
            return;
          }

          router.push(`/checkout/guest?sessionId=${data.sessionId}`);
          return;
        }

        // Authenticated user: use server action with reservationId tracking
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

  const handleWishlistToggleInRecommendations = async (productId: string, isWishlisted: boolean) => {
    try {
      if (isWishlisted) {
        await removeFromWishlistAction(productId);
      } else {
        await addToWishlistAction(productId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Compute total cart quantity count dynamically to update nav badge
  const dynamicCartCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  // Render Empty State
  if (items.length === 0) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink selection:bg-vl-primary/20">
        <HomeHeader
          userProfile={userProfile}
          cartCount={0}
          sellerHref={sellerHref}
        />
        <main className="vl-section-shell flex w-full flex-grow flex-col items-center justify-center py-16 px-6">
          <div className="w-full max-w-none sm:max-w-[520px] md:max-w-[600px] bg-vl-card border border-vl-border rounded-vl-card p-8 sm:p-10 flex flex-col items-center text-center shadow-vl-soft animate-fade-in">
            {/* Premium fashion shopping bag icon container */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-vl-primary/10 to-vl-primary/5 flex items-center justify-center text-vl-primary mb-6 animate-vl-pulse shrink-0">
              <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 stroke-[1.5]" />
            </div>

            {/* Heading */}
            <h1 className="font-vl-heading text-xl sm:text-[22px] md:text-[26px] lg:text-[32px] font-extrabold tracking-tight text-vl-ink text-center leading-tight mb-4">
              Your shopping bag is waiting
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-vl-muted leading-relaxed max-w-[420px] text-center mx-auto mb-8">
              Discover independent fashion brands curated just for you. Add items you love to start shopping.
            </p>

            {/* CTA Button */}
            <Link
              href="/products"
              className="inline-flex min-h-12 w-full md:w-auto md:px-10 items-center justify-center rounded-vl-control bg-vl-primary text-sm font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.20)] hover:bg-vl-primary-strong active:scale-95 transition-all duration-vl-fast whitespace-nowrap select-none cursor-pointer"
            >
              Explore Collection
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink selection:bg-vl-primary/20 pb-24 lg:pb-12">
      <HomeHeader
        userProfile={userProfile}
        cartCount={dynamicCartCount}
        sellerHref={sellerHref}
      />

      <main className="vl-section-shell flex w-full flex-grow flex-col py-6 sm:py-8 lg:py-10">
        
        {/* Step Progress Bar */}
        <div className="mb-8 hidden md:flex items-center justify-center gap-2 border-b border-vl-border pb-5 text-sm font-semibold sm:gap-4 md:justify-start">
          <span className="flex items-center gap-1.5 text-vl-primary font-bold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-vl-primary text-[10px] font-bold text-white">1</span>
            Shopping Bag
          </span>
          <ChevronRight className="h-4.5 w-4.5 text-vl-border shrink-0" />
          <span className="flex items-center gap-1.5 text-vl-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-vl-border text-[10px] font-bold text-vl-muted">2</span>
            Shipping Address
          </span>
          <ChevronRight className="h-4.5 w-4.5 text-vl-border shrink-0" />
          <span className="flex items-center gap-1.5 text-vl-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-vl-border text-[10px] font-bold text-vl-muted">3</span>
            Secure Checkout
          </span>
        </div>

        {/* Countdown Timer Section */}
        {activeItems.length > 0 && (
          <div className="mb-6 bg-vl-primary/5 border border-vl-primary/10 p-4 rounded-vl-card flex items-center justify-center gap-3 shadow-vl-soft text-sm font-semibold">
            <Compass className="h-5 w-5 text-vl-primary shrink-0 animate-spin" style={{ animationDuration: "6s" }} />
            <span className="text-vl-ink">
              Fashion Check! Items in your bag are reserved for{" "}
              <span className="text-vl-primary font-extrabold tabular-nums bg-vl-primary/10 px-2.5 py-0.5 rounded-full">{formatTime(minSeconds)}</span> mins
            </span>
          </div>
        )}

        {/* Expired reservations banner */}
        {items.length > 0 && activeItems.length === 0 && (
          <div className="mb-6 bg-vl-danger/10 border border-vl-danger/20 p-4 rounded-vl-card flex items-center justify-center gap-3 shadow-vl-soft text-sm font-semibold">
            <Clock className="h-5 w-5 text-vl-danger shrink-0 animate-pulse" />
            <span className="text-vl-danger font-bold">
              Your cart reservations have expired. Please remove expired items and reserve them again.
            </span>
          </div>
        )}

        {/* General Error Banner */}
        {error && (
          <div className="mb-6 bg-vl-danger/10 border border-vl-danger/20 text-vl-danger p-4 rounded-vl-card flex items-center justify-between gap-3 shadow-vl-soft text-sm font-bold">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-vl-muted hover:text-vl-ink transition-colors cursor-pointer p-1"
            >
              close
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="rounded-vl-card border border-vl-border bg-vl-card p-5 sm:p-6 shadow-vl-soft">
              <h2 className="font-vl-heading text-lg sm:text-xl font-extrabold text-vl-ink mb-6">
                Your Shopping Bag ({items.length} {items.length === 1 ? "Item" : "Items"})
              </h2>

              <div className="divide-y divide-vl-border">
                {items.map((item) => {
                  const itemSecondsLeft = timeRemaining[item.id] ?? 900;
                  const isExpired = itemSecondsLeft <= 0;

                  const itemSellingPrice = item.price * item.quantity;
                  const itemOriginalPrice = getOriginalPrice(item.price) * item.quantity;
                  const itemDiscountPercent = getDiscountPercent(item.price, getOriginalPrice(item.price));
                  
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col sm:flex-row gap-5 py-6 first:pt-0 last:pb-0 transition-all duration-vl-fast ${
                        isExpired ? "opacity-50" : ""
                      }`}
                    >
                      {/* Image Thumbnail wrapper */}
                      <div className="relative w-28 h-36 sm:w-32 sm:h-40 flex-shrink-0 bg-vl-surface rounded-vl-card overflow-hidden border border-vl-border">
                        <Image
                          alt={item.name}
                          fill
                          sizes="128px"
                          priority
                          className="object-cover"
                          src={item.image}
                        />
                        {isExpired && (
                          <div className="absolute inset-0 bg-vl-ink/65 flex items-center justify-center p-2 text-center text-[10px] font-bold text-white uppercase tracking-wider">
                            Expired
                          </div>
                        )}
                      </div>

                      {/* Details Content Block */}
                      <div className="flex-grow flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-vl-muted flex items-center gap-1.5">
                              {item.sellerName}
                              <ShieldCheck className="h-3.5 w-3.5 text-vl-primary" />
                            </span>
                            
                            <button
                              onClick={() => handleRemove(item.id)}
                              disabled={isRemoving[item.id]}
                              className="text-vl-muted hover:text-vl-danger transition-colors inline-flex items-center gap-1 text-xs font-bold disabled:opacity-50 cursor-pointer"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>{isRemoving[item.id] ? "Removing..." : "Remove"}</span>
                            </button>
                          </div>

                          <h3 className="font-vl-heading text-base font-extrabold text-vl-ink leading-snug">
                            {item.name}
                          </h3>

                          <div className="flex items-center gap-3 text-xs text-vl-muted pt-0.5">
                            <span className="bg-vl-surface px-2 py-0.5 rounded border border-vl-border font-semibold">
                              Size: {item.size}
                            </span>
                            <span className="text-vl-success font-semibold flex items-center gap-1">
                              <Truck className="h-3.5 w-3.5" /> Est: Tomorrow
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          {/* Premium quantity selector */}
                          {isExpired ? (
                            <span className="text-xs font-bold text-vl-danger bg-vl-danger/10 px-2.5 py-1 rounded-full uppercase tracking-wider border border-vl-danger/10">
                              Reservation Expired
                            </span>
                          ) : (
                            <div className="inline-flex items-center border border-vl-border rounded-vl-control overflow-hidden bg-vl-card h-11 shadow-vl-soft">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                                disabled={item.quantity <= 1 || updatingQuantity[item.id]}
                                className="min-w-11 min-h-11 flex items-center justify-center hover:bg-vl-surface border-r border-vl-border disabled:opacity-40 transition-colors text-vl-ink font-extrabold cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="px-4 font-bold text-vl-ink text-sm min-w-8 text-center select-none">
                                {updatingQuantity[item.id] ? (
                                  <Loader2 className="h-4.5 w-4.5 animate-spin text-vl-primary inline" />
                                ) : (
                                  item.quantity
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                                disabled={item.quantity >= 5 || updatingQuantity[item.id]}
                                className="min-w-11 min-h-11 flex items-center justify-center hover:bg-vl-surface border-l border-vl-border disabled:opacity-40 transition-colors text-vl-ink font-extrabold cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          )}

                          {/* Prices readout */}
                          <div className="flex flex-col items-end">
                            <span className="font-vl-heading text-lg font-extrabold text-vl-ink">
                              {formatPrice(itemSellingPrice)}
                            </span>
                            {itemOriginalPrice > itemSellingPrice && (
                              <div className="flex items-center gap-1.5 text-xs mt-0.5">
                                <span className="text-vl-muted line-through">
                                  {formatPrice(itemOriginalPrice)}
                                </span>
                                <span className="text-vl-success font-extrabold bg-vl-success/10 px-1.5 py-0.2 rounded uppercase">
                                  {itemDiscountPercent}% OFF
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Move to Wishlist Trigger */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleMoveToWishlist(item.productId, item.id)}
                            disabled={isRemoving[item.id]}
                            className="inline-flex items-center gap-1 text-xs font-bold text-vl-primary hover:underline cursor-pointer disabled:opacity-50"
                          >
                            <Heart className="h-3.5 w-3.5 fill-vl-primary/10" />
                            <span>Save to Wishlist</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Promise Trust Strip */}
            <div className="rounded-vl-card border border-vl-border bg-vl-card p-6 shadow-vl-soft grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-1 px-1">
                <Lock aria-hidden="true" className="h-5 w-5 text-vl-primary" />
                <span className="text-[10px] font-bold text-vl-ink uppercase tracking-wider">SSL Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center gap-1 px-1 border-x border-vl-border">
                <ShieldCheck aria-hidden="true" className="h-5 w-5 text-vl-primary" />
                <span className="text-[10px] font-bold text-vl-ink uppercase tracking-wider">Escrow Guard</span>
              </div>
              <div className="flex flex-col items-center gap-1 px-1">
                <RefreshCw aria-hidden="true" className="h-5 w-5 text-vl-primary" />
                <span className="text-[10px] font-bold text-vl-ink uppercase tracking-wider">Easy Returns</span>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            
            {/* Coupon accordion section */}
            <div className="rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft overflow-hidden">
              <button
                type="button"
                onClick={() => setIsCouponExpanded(!isCouponExpanded)}
                className="w-full p-5 flex items-center justify-between text-sm font-bold text-vl-ink hover:bg-vl-surface transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4.5 w-4.5 text-vl-primary" />
                  <span>Apply Promotional Coupon</span>
                </div>
                <ChevronRight className={`h-4.5 w-4.5 text-vl-muted transition-transform duration-vl-fast ${isCouponExpanded ? "rotate-90" : ""}`} />
              </button>

              {isCouponExpanded && (
                <div className="px-5 pb-5 pt-1 space-y-4 border-t border-vl-border bg-vl-surface/40 animate-fade-in">
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter promo code (e.g. VELVET40)"
                      className="flex-grow rounded-vl-control border border-vl-border bg-vl-card p-2.5 text-xs text-vl-ink outline-none focus:border-vl-primary transition-colors uppercase font-mono font-bold"
                    />
                    <button
                      type="submit"
                      className="rounded-vl-control bg-vl-ink px-4 text-xs font-bold text-white hover:bg-vl-ink/90 active:scale-95 transition-all cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                  {couponError && (
                    <p className="text-xs text-vl-danger font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> {couponError}
                    </p>
                  )}
                  {couponSuccess && (
                    <p className="text-xs text-vl-success font-semibold flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> {couponSuccess}
                    </p>
                  )}
                  <div className="pt-2 space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-vl-muted">Available Offers</p>
                    <div className="border border-dashed border-vl-border rounded p-3 bg-vl-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[11px] font-bold text-vl-primary uppercase tracking-wide bg-vl-primary/10 px-1.5 py-0.5 rounded">VELVET40</span>
                          <p className="text-[11px] font-bold text-vl-ink mt-1">Get 40% OFF on all bag items</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCouponCode("VELVET40");
                            setAppliedCoupon("VELVET40");
                            setCouponSuccess('Coupon "VELVET40" applied!');
                            setCouponError(null);
                          }}
                          className="text-xs font-extrabold text-vl-primary hover:underline"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Price breakdown Card */}
            <section className="rounded-vl-card border border-vl-border bg-vl-card overflow-hidden shadow-vl-soft">
              <div className="p-5 border-b border-vl-border bg-vl-surface">
                <h2 className="font-vl-heading text-base font-bold text-vl-ink">Order Summary</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between text-sm text-vl-muted">
                  <span>Price ({activeItems.length} {activeItems.length === 1 ? "item" : "items"})</span>
                  <span className="font-semibold text-vl-ink">{formatPrice(originalPrice)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-vl-muted">
                    <span>Discount (40% OFF)</span>
                    <span className="text-vl-success font-bold">-{formatPrice(discount)}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-xs text-vl-success font-semibold bg-vl-success/5 p-2 rounded border border-dashed border-vl-success/20">
                    <span>Coupon &quot;{appliedCoupon}&quot; Applied</span>
                    <span>Active</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-vl-muted">
                  <span>Platform Fee</span>
                  <span className="text-vl-ink font-semibold">{formatPrice(platformFee)}</span>
                </div>
                <div className="flex justify-between text-sm text-vl-muted">
                  <span>Delivery Charges</span>
                  <span className="text-vl-success font-bold uppercase text-xs bg-vl-success/10 px-2 py-0.5 rounded-full">FREE</span>
                </div>
                
                <div className="pt-4 border-t border-dashed border-vl-border">
                  <div className="flex justify-between items-baseline mb-5">
                    <span className="font-vl-heading text-base font-bold text-vl-ink">Total Amount</span>
                    <span className="font-vl-heading text-2xl font-extrabold text-vl-primary">{formatPrice(grandTotal)}</span>
                  </div>
                  {discount > 0 && (
                    <p className="text-xs text-vl-success font-semibold mb-4 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-vl-success inline-block"></span>
                      You will save {formatPrice(discount)} on this purchase
                    </p>
                  )}
                  
                  {/* Secure checkout CTA button */}
              <button
                onClick={handleCheckout}
                className="w-full inline-flex min-h-[52px] items-center justify-center gap-2 rounded-vl-control bg-vl-primary text-sm font-bold text-white shadow-sm transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock aria-hidden="true" className="h-4 w-4" />
                        <span>PROCEED TO SECURE CHECKOUT</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* You May Also Like recommendations carousel */}
        <section className="mt-16 border-t border-vl-border pt-10">
          <h2 className="font-vl-heading text-xl font-extrabold text-vl-ink mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-vl-primary" /> You May Also Like
          </h2>
          
          {loadingRecommendations ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={i >= 2 ? "hidden md:block" : ""}>
                  <div className="aspect-[3/4] rounded-vl-card bg-vl-border/30 animate-pulse border border-vl-border" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {recommendedProducts.slice(0, 4).map((prod, idx) => (
                <div key={prod.id} className={idx >= 2 ? "hidden md:block" : ""}>
                  <ProductCard
                    product={prod}
                    isLoggedIn={!!userProfile}
                    onWishlistToggle={handleWishlistToggleInRecommendations}
                    index={idx}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* MOBILE STICKY CTA BAR (fixed drawer bottom) */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-vl-border p-4 lg:hidden flex items-center justify-between gap-4 shadow-vl-large"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-vl-muted uppercase tracking-wider">Total Payable</span>
          <span className="text-lg font-extrabold text-vl-primary">{formatPrice(grandTotal)}</span>
        </div>
        <button
          type="button"
          onClick={handleProceedToCheckout}
          disabled={!hasActiveItems || isCheckingOut}
          className="flex-1 max-w-[220px] inline-flex min-h-11 items-center justify-center gap-2 rounded-vl-control bg-vl-primary text-xs font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.25)] transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98] disabled:opacity-50"
        >
          {isCheckingOut ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <>
              <Lock aria-hidden="true" className="h-3.5 w-3.5" />
              <span>CHECKOUT NOW</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
