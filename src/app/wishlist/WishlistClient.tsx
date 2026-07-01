"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HomeHeader from "@/components/home/HomeHeader";
import { reserveCartItem } from "@/actions/cart-reserve.action";
import { removeFromWishlistAction } from "@/actions/wishlist.action";

export interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  images: { url: string }[];
  seller: {
    businessName: string;
  };
  variants: { id: string; size: string; stockCount: number }[];
}

interface WishlistClientProps {
  initialProducts: WishlistProduct[];
  initialCartCount: number;
  recentlyViewedProducts: WishlistProduct[];
  userProfile: any;
  sellerHref: string;
}

export default function WishlistClient({
  initialProducts,
  initialCartCount,
  recentlyViewedProducts,
  userProfile,
  sellerHref,
}: WishlistClientProps) {
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>(initialProducts);
  const [cartCount, setCartCount] = useState<number>(initialCartCount);
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const formatPrice = (amt: number) => {
    return (amt / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  // Remove item from wishlist with 300ms transition animation
  const handleRemove = useCallback(async (productId: string) => {
    setRemovingIds((prev) => [...prev, productId]);
    try {
      const res = await removeFromWishlistAction(productId);
      if (res.success) {
        setTimeout(() => {
          setWishlistItems((prev) => prev.filter((item) => item.id !== productId));
          setRemovingIds((prev) => prev.filter((id) => id !== productId));
        }, 300);
      } else {
        setRemovingIds((prev) => prev.filter((id) => id !== productId));
        setFeedbackMessage({ type: "error", text: "Failed to remove item from wishlist." });
      }
    } catch (err) {
      console.error("Remove from wishlist failed:", err);
      setRemovingIds((prev) => prev.filter((id) => id !== productId));
      setFeedbackMessage({ type: "error", text: "An error occurred. Please try again." });
    }
  }, []);

  // Move product to cart (calls reserveCartItem for the first variant with stock > 0, then removes from wishlist)
  const handleMoveToCart = useCallback(async (product: WishlistProduct) => {
    if (processingIds.includes(product.id)) return;

    // Pick first variant with stock, or fall back to the first variant
    const variant = product.variants.find((v) => v.stockCount > 0) || product.variants[0];
    if (!variant) {
      setFeedbackMessage({ type: "error", text: "Product variants are currently unavailable." });
      return;
    }

    setProcessingIds((prev) => [...prev, product.id]);
    setFeedbackMessage(null);

    try {
      const res = await reserveCartItem({
        productId: product.id,
        variantId: variant.id,
        quantity: 1,
      });

      if (res.success) {
        // Increment cart count, show toast, and remove from wishlist
        setCartCount((prev) => prev + 1);
        setFeedbackMessage({ type: "success", text: `Successfully moved "${product.name}" to cart!` });
        await handleRemove(product.id);
      } else {
        const errorMsg = res.error?.message || "Insufficient stock or verification issues.";
        setFeedbackMessage({ type: "error", text: errorMsg });
      }
    } catch (err) {
      console.error("Move to cart failed:", err);
      setFeedbackMessage({ type: "error", text: "Failed to reserve cart item. Please try again." });
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== product.id));
    }
  }, [processingIds, handleRemove]);

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col w-full font-sans">
      {/* Navbar Header */}
      <HomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      {/* Main Container */}
      <main className="max-w-[1280px] mx-auto px-base lg:px-xl py-xl w-full flex-grow flex flex-col">
        {/* Banner Messages */}
        {feedbackMessage && (
          <div
            className={`mb-base p-md rounded border font-label-bold text-body-md transition-all flex items-center justify-between shadow-sm animate-fade-in-up ${
              feedbackMessage.type === "success"
                ? "bg-success-green/10 border-success-green/20 text-success-green"
                : "bg-error-container border-error text-on-error-container"
            }`}
          >
            <span>{feedbackMessage.text}</span>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="material-symbols-outlined text-[18px] cursor-pointer hover:opacity-75"
            >
              close
            </button>
          </div>
        )}

        {/* Title */}
        <div className="flex items-baseline gap-sm mb-xl">
          <h1 className="font-headline-lg text-headline-lg text-primary">My Wishlist</h1>
          <span className="font-body-lg text-body-lg text-text-muted">
            ({wishlistItems.length} {wishlistItems.length === 1 ? "Item" : "Items"})
          </span>
        </div>

        {wishlistItems.length === 0 ? (
          /* Empty Wishlist State */
          <div className="flex-grow w-full flex flex-col items-center justify-center py-xxl">
            <div className="flex flex-col items-center justify-center bg-surface-container-lowest border border-border-gray rounded-xl p-[48px] w-full max-w-[420px] text-center shadow-sm">
              <div className="text-secondary/60 mb-4 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[80px] font-light text-text-muted"
                  style={{ fontVariationSettings: "'FILL' 0" }}
                >
                  favorite
                </span>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-primary mb-3">
                Your wishlist is empty
              </h2>
              <p className="text-secondary font-body-md mb-6 leading-relaxed text-text-muted">
                Explore our collection and add items you like to your wishlist.
              </p>
              <Link
                href="/products"
                className="inline-block bg-primary text-on-primary px-lg py-sm rounded font-label-bold uppercase tracking-widest hover:opacity-90 transition-all duration-200 cursor-pointer"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-base lg:gap-lg mb-xxl">
            {wishlistItems.map((prod) => {
              const priceVal = prod.price;
              const formattedPrice = formatPrice(priceVal);
              // Calculate original price fallback (e.g. price * 1.7)
              const originalPriceVal = Math.round((priceVal / 100) * 1.7) * 100;
              const formattedOriginalPrice = formatPrice(originalPriceVal);
              const discountPercent = Math.round(((originalPriceVal - priceVal) / originalPriceVal) * 100);

              const imageUrl = prod.images[0]?.url || "/placeholder.jpg";
              const sellerName = prod.seller?.businessName || "MINIBRANDS";
              const isRemoving = removingIds.includes(prod.id);
              const isProcessing = processingIds.includes(prod.id);

              return (
                <div
                  key={prod.id}
                  className={`group bg-surface-container-lowest border border-border-gray relative flex flex-col hover:shadow-md transition-all duration-300 ${
                    isRemoving ? "opacity-0 scale-95 pointer-events-none" : ""
                  }`}
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(prod.id)}
                    className="absolute top-sm right-sm z-10 bg-white/80 rounded-full w-8 h-8 flex items-center justify-center text-secondary hover:text-error-red transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>

                  {/* Image Wrap */}
                  <Link href={`/products/${prod.id}`} className="aspect-[3/4] w-full overflow-hidden block">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={imageUrl}
                      alt={prod.name}
                    />
                  </Link>

                  {/* Details Card */}
                  <div className="p-sm flex flex-col flex-1">
                    <span className="font-label-bold text-body-sm text-text-muted uppercase tracking-wider mb-xs">
                      {sellerName}
                    </span>
                    <Link href={`/products/${prod.id}`} className="block">
                      <h3 className="font-body-md text-body-md text-on-surface truncate mb-sm hover:text-primary transition-colors">
                        {prod.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-sm mb-md flex-wrap">
                      <span className="font-price-lg text-price-lg text-primary">{formattedPrice}</span>
                      <span className="text-body-sm text-text-muted line-through">{formattedOriginalPrice}</span>
                      <span className="text-body-sm text-accent-yellow font-bold">({discountPercent}% OFF)</span>
                    </div>

                    <button
                      onClick={() => handleMoveToCart(prod)}
                      disabled={isRemoving || isProcessing}
                      className="mt-auto w-full py-md bg-primary text-on-primary font-label-bold text-label-bold rounded-lg uppercase hover:bg-on-surface-variant transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? "PROCESSING..." : "MOVE TO CART"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recently Viewed Carousel */}
        <section className="border-t border-border-gray pt-xl mt-auto">
          <h2 className="font-headline-sm text-headline-sm text-primary mb-lg">Recently Viewed</h2>
          <div className="flex overflow-x-auto gap-base pb-base no-scrollbar">
            {recentlyViewedProducts.map((prod) => {
              const formattedPrice = formatPrice(prod.price);
              const imageUrl = prod.images[0]?.url || "/placeholder.jpg";

              return (
                <Link
                  key={prod.id}
                  href={`/products/${prod.id}`}
                  className="flex-shrink-0 w-48 bg-surface-container-lowest border border-border-gray group block overflow-hidden hover:shadow-sm transition-shadow"
                >
                  <div className="aspect-[3/4] w-full overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      src={imageUrl}
                      alt={prod.name}
                    />
                  </div>
                  <div className="p-sm">
                    <h4 className="font-body-sm text-body-sm text-on-surface truncate hover:text-primary transition-colors">
                      {prod.name}
                    </h4>
                    <p className="font-label-bold text-body-sm text-primary mt-xs">{formattedPrice}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-xl px-base lg:px-xl flex flex-col md:flex-row justify-between items-center gap-base bg-surface-container-highest dark:bg-surface-container-low border-t border-outline-variant dark:border-outline">
        <div className="flex flex-col items-center md:items-start gap-sm">
          <span className="font-headline-sm text-headline-sm font-bold text-primary dark:text-primary-fixed">
            MINIBRANDS
          </span>
          <p className="font-body-sm text-body-sm text-on-surface dark:text-on-surface-variant">
            © 2024 MINIBRANDS India. All rights reserved. Secure Marketplace.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-lg">
          <Link className="font-body-sm text-body-sm text-secondary dark:text-secondary-fixed-dim hover:text-primary dark:hover:text-on-surface transition-all cursor-pointer" href="#">
            Privacy Policy
          </Link>
          <Link className="font-body-sm text-body-sm text-secondary dark:text-secondary-fixed-dim hover:text-primary dark:hover:text-on-surface transition-all cursor-pointer" href="#">
            Terms of Service
          </Link>
          <Link className="font-body-sm text-body-sm text-secondary dark:text-secondary-fixed-dim hover:text-primary dark:hover:text-on-surface transition-all cursor-pointer" href="#">
            Buyer Protection
          </Link>
          <Link className="font-body-sm text-body-sm text-secondary dark:text-secondary-fixed-dim hover:text-primary dark:hover:text-on-surface transition-all cursor-pointer" href="#">
            Contact Us
          </Link>
          <Link className="font-body-sm text-body-sm text-secondary dark:text-secondary-fixed-dim hover:text-primary dark:hover:text-on-surface transition-all cursor-pointer" href="#">
            Track Order
          </Link>
        </div>
      </footer>
    </div>
  );
}
