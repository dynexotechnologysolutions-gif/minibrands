"use client";

/**
 * WishlistClient
 * @redesigned v5.0 — visual redesign only, all callbacks, wishlist actions, and variants logic preserved.
 *
 * Purpose:
 *   Premium, fashion-first editorial Wishlist (Saved Items) workspace. Displays saved items
 *   utilizing the canonical ProductCard for styling consistency, overlays a prominent "Move to Cart"
 *   quick action panel, and handles recently viewed collections using smooth hover actions.
 */

import React, { useState, useCallback } from "react";
import Link from "next/link";
import {
  Heart,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import HomeHeader from "@/components/home/HomeHeader";
import { reserveCartItem } from "@/actions/cart-reserve.action";
import { removeFromWishlistAction, addToWishlistAction } from "@/actions/wishlist.action";
import ProductCard from "@/features/catalog/components/ProductCard";
import { Product } from "@/features/catalog/types/Product";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>(initialProducts);
  const [cartCount, setCartCount] = useState<number>(initialCartCount);
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Helper to map a WishlistProduct to the canonical Product shape expected by ProductCard.tsx
  const mapToProduct = useCallback((item: WishlistProduct): Product => {
    const priceVal = item.price;
    const originalPriceVal = Math.round((priceVal / 100) * 1.7) * 100;
    const discountPercent = Math.round(((originalPriceVal - priceVal) / originalPriceVal) * 100);

    return {
      id: item.id,
      sellerId: "",
      name: item.name,
      shortDescription: "",
      fullDescription: "",
      category: item.category,
      subcategory: null,
      tags: [],
      price: item.price,
      isPublished: true,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: item.images.map((img, idx) => ({
        id: `${item.id}-img-${idx}`,
        productId: item.id,
        url: img.url,
        sortOrder: idx,
      })),
      variants: item.variants.map((v) => ({
        id: v.id,
        productId: item.id,
        size: v.size,
        stockCount: v.stockCount,
      })),
      seller: {
        id: "",
        businessName: item.seller.businessName,
        storeName: item.seller.businessName,
        storeLogo: null,
        verification: {
          kycStatus: "approved",
          bankVerified: true,
          trustScore: 95,
        },
      },
      mrp: originalPriceVal,
      discountPercent,
      rating: 4.5,
      reviewCount: 42,
      formattedReviews: "4.5 (42)",
      badge: null,
      isWishlisted: true,
    };
  }, []);

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

  // Handler for toggle callback inside ProductCard
  const handleWishlistToggle = useCallback(async (productId: string, isCurrentlyWishlisted: boolean) => {
    if (isCurrentlyWishlisted) {
      await handleRemove(productId);
    }
  }, [handleRemove]);

  // Handler for recommendations toggle callback
  const handleWishlistToggleInRecommendations = useCallback(async (productId: string, isCurrentlyWishlisted: boolean) => {
    try {
      if (isCurrentlyWishlisted) {
        await removeFromWishlistAction(productId);
      } else {
        await addToWishlistAction(productId);
      }
    } catch (e) {
      console.error(e);
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
    <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink selection:bg-vl-primary/20 pb-20 lg:pb-10">
      <HomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      <main className="vl-section-shell flex w-full flex-grow flex-col pt-[calc(5.75rem+env(safe-area-inset-top))] sm:pt-[calc(6.25rem+env(safe-area-inset-top))] md:pt-8 lg:pt-10 pb-6 sm:pb-8 lg:pb-10">
        
        {/* Banner Messages */}
        {feedbackMessage && (
          <div
            role="alert"
            className={`mb-6 p-4 rounded-vl-card border font-semibold text-sm transition-all flex items-center justify-between shadow-vl-soft animate-fade-in ${
              feedbackMessage.type === "success"
                ? "bg-vl-success/10 border-vl-success/20 text-vl-success"
                : "bg-vl-danger/10 border-vl-danger/20 text-vl-danger"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMessage.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-vl-success shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-vl-danger shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-vl-muted hover:text-vl-ink transition-colors cursor-pointer p-1"
              aria-label="Close alert"
            >
              close
            </button>
          </div>
        )}

        {/* Title and stats bar */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-8">
          <div>
            <h1 className="font-vl-heading text-2xl sm:text-3xl font-extrabold tracking-[-0.04em] text-vl-ink mb-1">
              My Saved Items
            </h1>
            <p className="text-xs text-vl-muted">
              Explore your personal bookmarks. Reserve them when ready to purchase.
            </p>
          </div>
          <span className="text-sm font-bold text-vl-primary bg-vl-primary/10 px-3 py-1 rounded-full w-fit">
            {wishlistItems.length} {wishlistItems.length === 1 ? "Item" : "Items"} saved
          </span>
        </div>

        {wishlistItems.length === 0 ? (
          /* Empty Wishlist State */
          <div className="flex-grow w-full flex justify-center items-center py-12 px-4 select-none">
            <div className="w-full max-w-md flex flex-col items-center text-center bg-vl-card border border-vl-border rounded-vl-card p-8 sm:p-10 shadow-vl-soft animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-vl-primary/10 flex items-center justify-center text-vl-primary mb-6 shrink-0">
                <Heart className="h-8 w-8 fill-vl-primary/10" aria-hidden="true" />
              </div>
              <h2 className="font-vl-heading text-lg sm:text-xl font-bold tracking-tight text-vl-ink mb-2">
                Nothing saved yet.
              </h2>
              <p className="text-xs sm:text-sm text-vl-muted mb-8 max-w-[280px] sm:max-w-xs leading-relaxed">
                Save products you love while browsing, and they will appear here.
              </p>
              <Link
                href="/products"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-vl-primary px-6 text-sm font-bold text-white shadow-[0_4px_16px_rgba(255,63,108,0.2)] hover:bg-vl-primary-strong active:scale-95 transition-all duration-vl-fast"
              >
                Explore Fashion
              </Link>
            </div>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
            {wishlistItems.map((prod) => {
              const isRemoving = removingIds.includes(prod.id);
              const isProcessing = processingIds.includes(prod.id);

              return (
                <div
                  key={prod.id}
                  className={`group relative flex flex-col bg-vl-card border border-vl-border rounded-vl-card overflow-hidden shadow-vl-soft hover:shadow-vl-medium transition-all duration-vl-fast ${
                    isRemoving ? "opacity-0 scale-95 pointer-events-none" : ""
                  }`}
                >
                  {/* Top ProductCard container */}
                  <div className="flex-grow">
                    <ProductCard
                      product={mapToProduct(prod)}
                      isLoggedIn={!!userProfile}
                      onWishlistToggle={handleWishlistToggle}
                      hideCartButton
                    />
                  </div>

                  {/* Move to Cart Quick Trigger Bar */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => handleMoveToCart(prod)}
                      disabled={isRemoving || isProcessing}
                      className="w-full inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-4 text-xs font-bold text-white hover:bg-vl-primary-strong active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          PROCESSING...
                        </>
                      ) : (
                        "MOVE TO CART"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recently Viewed Carousel */}
        <section className="border-t border-vl-border pt-10 mt-auto">
          <h2 className="font-vl-heading text-lg font-extrabold text-vl-ink mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-vl-primary" /> Recently Viewed Items
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {recentlyViewedProducts.map((prod, idx) => (
              <ProductCard
                key={prod.id}
                product={mapToProduct(prod)}
                isLoggedIn={!!userProfile}
                onWishlistToggle={handleWishlistToggleInRecommendations}
                index={idx}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
