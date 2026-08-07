"use client";

/**
 * ProductDetailClient
 * @redesigned v4.0 — visual redesign only, all hooks, server actions, and states preserved exactly.
 *
 * Purpose:
 *   Premium PDP layout with responsive split-pane details, vertically aligned thumbnails,
 *   GPU-accelerated animations, safe-area mobile sticky CTA bar, trust badges, seller credibility
 *   card, description accordion, and related products.
 */

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  Bolt,
  ChevronDown,
  Heart,
  MapPin,
  ShoppingBag,
  Star,
  ShieldCheck,
  RotateCcw,
  Truck,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { reserveCartItem } from "@/actions/cart-reserve.action";
import { createCheckoutSession } from "@/actions/checkout-session.action";
import { addToWishlistAction, removeFromWishlistAction } from "@/actions/wishlist.action";
import { getDefaultAddress } from "@/actions/address-get-default.action";
import HomeHeader from "@/components/home/HomeHeader";
import ReviewGallery from "@/components/review/ReviewGallery";
import ProductCard from "@/features/catalog/components/ProductCard";

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    shortDescription: string;
    fullDescription: string;
    category: string;
    subcategory: string | null;
    tags: string[];
    price: number;
    isPublished: boolean;
    aiGenerated: boolean;
    images: { url: string; cloudinaryPublicId: string }[];
    variants: { id: string; size: string; stockCount: number }[];
    seller: {
      id: string;
      businessName: string;
      city: string;
      logoUrl: string | null;
      verification?: {
        kycStatus: string;
        bankVerified: boolean;
        trustScore: number;
      } | null;
    };
  };
  userProfile?: {
    id: string;
    role: "BUYER" | "SELLER" | "ADMIN" | "SUPER_ADMIN";
    user: {
      name: string;
      email: string;
      image?: string | null;
    };
    seller?: {
      id: string;
      businessName: string;
      storeName: string;
      storeLogo?: string | null;
      verification?: {
        kycStatus: string;
        bankVerified: boolean;
        trustScore: number;
      } | null;
    } | null;
  } | null;
  cartCount: number;
  similarProducts: {
    id: string;
    name: string;
    category: string;
    price: number;
    images: { url: string }[];
    seller: {
      businessName: string;
    };
  }[];
  recentlyViewed: {
    id: string;
    name: string;
    category: string;
    price: number;
    images: { url: string }[];
    seller: {
      businessName: string;
    };
  }[];
  initialIsWishlisted?: boolean;
  reviewSummary: {
    averageRating: number;
    reviewCount: number;
    distribution: Record<number, number>;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialReviews: any[];
}

export default function ProductDetailClient({
  product,
  userProfile,
  cartCount: initialCartCount,
  similarProducts,
  recentlyViewed,
  initialIsWishlisted = false,
  reviewSummary,
  initialReviews,
}: ProductDetailClientProps) {
  const router = useRouter();

  const images =
    product.images.length > 0
      ? product.images
      : [{ url: "/placeholder.jpg", cloudinaryPublicId: "placeholder" }];

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [imgVisible, setImgVisible] = useState(true);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const mobileScrollContainerRef = useRef<HTMLDivElement>(null);

  const handleMobileScroll = () => {
    const container = mobileScrollContainerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    if (width === 0) return;
    const newIdx = Math.round(container.scrollLeft / width);
    if (newIdx >= 0 && newIdx < images.length && newIdx !== selectedImageIdx) {
      setSelectedImageIdx(newIdx);
    }
  };

  const handleThumbnailClick = (idx: number, isMobile = false) => {
    if (idx === selectedImageIdx) return;
    if (isMobile) {
      const container = mobileScrollContainerRef.current;
      if (container) {
        container.scrollTo({
          left: idx * container.clientWidth,
          behavior: "smooth",
        });
      }
      setSelectedImageIdx(idx);
    } else {
      setImgVisible(false);
      const timer = setTimeout(() => {
        setSelectedImageIdx(idx);
        setImgVisible(true);
      }, 140);
      return () => clearTimeout(timer);
    }
  };

  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.variants.length === 1 ? product.variants[0].size : null
  );
  const [isReserving, setIsReserving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<{ city: string; pincode: string } | null>(null);

  useEffect(() => {
    if (userProfile) {
      getDefaultAddress().then((res) => {
        if (res.success && res.data) {
          setDeliveryAddress({
            city: res.data.city,
            pincode: res.data.pincode,
          });
        }
      });
    }
  }, [userProfile]);

  const handleToggleWishlist = async () => {
    if (!userProfile) {
      router.push(`/login?redirectTo=/products/${product.id}`);
      return;
    }
    if (isTogglingWishlist) return;

    setIsTogglingWishlist(true);
    const newWishlisted = !isWishlisted;
    setIsWishlisted(newWishlisted);

    try {
      if (newWishlisted) {
        await addToWishlistAction(product.id);
      } else {
        await removeFromWishlistAction(product.id);
      }
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch {
      console.error("Failed to toggle wishlist:");
      setIsWishlisted(!newWishlisted);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const currentImage = images[selectedImageIdx]?.url;

  const isSellerVerified =
    product.seller.verification &&
    (product.seller.verification.kycStatus === "auto_approved" ||
      product.seller.verification.kycStatus === "approved") &&
    product.seller.verification.bankVerified;

  const priceInINR = Math.round(product.price / 100);
  const originalPriceInINR = Math.round(priceInINR * 1.7);
  const discount = Math.round(
    ((originalPriceInINR - priceInINR) / originalPriceInINR) * 100
  );

  const isOutOfStock =
    product.variants.length === 0 ||
    product.variants.every((v) => v.stockCount === 0);

  const selectedVariantInfo = product.variants.find(
    (v) => v.size === selectedSize
  );



  const handleAddToCart = async () => {
    if (!selectedSize || !selectedVariantInfo) {
      setErrorMessage("Please select a size first.");
      return;
    }
    setIsReserving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await reserveCartItem({
        productId: product.id,
        variantId: selectedVariantInfo.id,
        quantity: 1,
      });

      if (response.success) {
        setSuccessMessage("Added to cart successfully!");
        setCartCount((prev) => prev + 1);
        router.refresh();
      } else {
        if (response.error?.code === "UNAUTHORIZED") {
          router.push(`/login?redirectTo=/products/${product.id}`);
        } else {
          setErrorMessage(
            response.error?.message || "Failed to reserve stock. Please try again."
          );
        }
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsReserving(false);
    }
  };

  const handleBuyNow = async () => {
    if (!userProfile) {
      router.push(`/login?redirectTo=/products/${product.id}`);
      return;
    }

    if (!selectedSize || !selectedVariantInfo) {
      setErrorMessage("Please select a size first.");
      return;
    }
    setIsReserving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        mode: "BUY_NOW" as const,
        products: [
          {
            productId: product.id,
            variantId: selectedVariantInfo.id,
            quantity: 1,
            price: product.price,
            size: selectedVariantInfo.size,
            image: images[0]?.url || "/placeholder.jpg",
            sellerName: product.seller.businessName,
            sellerId: product.seller.id,
          },
        ],
      };

      const response = await createCheckoutSession(payload);

      if (response.success && response.sessionId) {
        router.push(`/checkout?sessionId=${response.sessionId}`);
      } else {
        setErrorMessage(
          response.error || "Failed to initiate Buy Now. Please try again."
        );
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsReserving(false);
    }
  };

  const getSellerInitials = (name: string) => {
    if (!name) return "";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  let sellerHref = "/login?role=seller";
  if (userProfile?.role === "SELLER") {
    const ver = userProfile.seller?.verification;
    const isVerified =
      ver &&
      (ver.kycStatus === "auto_approved" || ver.kycStatus === "approved") &&
      ver.bankVerified;
    sellerHref = isVerified ? "/seller/dashboard" : "/seller/onboarding";
  }

  const highlights: string[] = [];
  if (product.category) highlights.push(`Category: ${product.category}`);
  if (product.subcategory) highlights.push(`Subcategory: ${product.subcategory}`);

  if (
    product.name.toLowerCase().includes("ceramic") ||
    product.name.toLowerCase().includes("lamp")
  ) {
    highlights.push("Material: Ceramic");
    highlights.push("Color: Earthy / Beige");
    highlights.push("Fit: Tabletop");
    highlights.push("Style: Minimalist");
    highlights.push("Occasion: Gifting/Home");
  } else {
    product.tags.forEach((tag) => {
      if (tag.includes(":")) {
        highlights.push(tag);
      } else {
        highlights.push(`${tag.charAt(0).toUpperCase() + tag.slice(1)}`);
      }
    });
  }

  const finalSimilarProducts =
    similarProducts.length > 0
      ? similarProducts
      : [
          {
            id: "similar-1",
            name: "Modern Abstract Vase",
            category: "DECOR",
            price: 129900,
            images: [
              {
                url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDznikgBmkL0JxH58XWOHEAqpnicm1SjBTy-Y7D-4vrEt8_bZQlAxSyW4QTs_NAPn2_b0tETCtm1vVIJooVry1pELDUlQ3zh7As1QBQa7NAw92uorHBAkGyZ6aYkW0TY426cJ6ybGO2cuyEKmG3YpxLvT2TzUQumJ84J-fbrQmd8XH3rfy70ps07xKo4M3X6v2uuFQlLzKTXMPbug5BOEjuVZYpUSeP0DVqTYYyG5VxllBeElfecg7dMsZb6ACjrFLM-YE_Rx0DP0bK",
              },
            ],
            seller: { businessName: "Aura Wear" },
          },
          {
            id: "similar-2",
            name: "Minimalist Oak Clock",
            category: "DECOR",
            price: 89900,
            images: [
              {
                url: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9jfdIU6kdumUZfJNExb077UXYil_C9gsRF7cX5GN_rU7gwwV4NhAF8RlGik-15mTJi5cdVvc1pnhO1ItflgJ74MuLmAmcEpOh5iaEW-Mi-amV6oN7UviegOnOmQW6TcsSrbw5a-gqiFhYxI1x-SUrXSnC1eYl5BIIkWsjEtgMSa6V32zWx-YCML-H1KBBaAPDNomaYtNlayIuqMeRFJjrSyIyP8X3o7600JGyl7q4TDSR-nNCEQDRomr3iz4eQo_bRZqe68Voaw8c",
              },
            ],
            seller: { businessName: "Aura Wear" },
          },
        ];

  const finalRecentlyViewed =
    recentlyViewed.length > 0
      ? recentlyViewed
      : [
          {
            id: "recent-1",
            name: "Black Arched Lamp",
            images: [
              {
                url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAufCMePcxpC6E6yrxD7YgZTj2S2yrexjSHxOHRu1mDD_I3gYQmvF0-vzv1S9YHiERgvDr9Sg3JlbUTw2MyE8j2dDBxTSQEraSPLf8DQSscH8femXDKgAy0kMbPQMEMqbkdp2SUvDWqgVs2jmi64zT3ZingqwwPjnOfv1u7U41anP9uDt9WwLidMG_4HLSD38a0mhpor1wtsrIDyh7qK1fyPPh8zSaeR5EBCZXauzGgzfT2KoqKukjZvo1lMacUbv-H8Vq299g4W2dM",
              },
            ],
          },
        ];

  const isFallbackId = (id: string) =>
    id.startsWith("similar-") || id.startsWith("recent-");

  const [isDescExpanded, setIsDescExpanded] = useState(false);

  return (
    <>
      <HomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      <main className="vl-section-shell w-full max-w-full overflow-x-hidden py-6 sm:py-8 lg:py-10 pb-[calc(10rem+env(safe-area-inset-bottom))] lg:pb-10">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-vl-muted" aria-label="Breadcrumb">
          <Link className="hover:text-vl-primary transition-colors" href="/">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            className="hover:text-vl-primary transition-colors"
            href={`/products?category=${encodeURIComponent(product.category)}`}
          >
            {product.category}
          </Link>
          {product.subcategory && (
            <>
              <span aria-hidden="true">/</span>
              <Link
                className="hover:text-vl-primary transition-colors"
                href={`/products?category=${encodeURIComponent(
                  product.category
                )}&subcategory=${encodeURIComponent(product.subcategory)}`}
              >
                {product.subcategory}
              </Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span className="text-vl-ink truncate max-w-[120px] sm:max-w-none font-semibold">
            {product.name}
          </span>
        </nav>

        {/* Product View Split Pane */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* LEFT COLUMN: Gallery (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-3 lg:flex-row-reverse lg:sticky lg:top-24">
            {/* Desktop-only gallery layout */}
            <div className="hidden lg:flex lg:flex-row-reverse w-full gap-3">
              {/* Main Image Aspect Ratio 3/4 */}
              <div ref={mainImageRef} className="relative aspect-[3/4] w-full flex-1 overflow-hidden rounded-vl-card border border-vl-border bg-vl-surface shadow-vl-soft">
                <Image
                  alt={product.name}
                  fill
                  priority
                  sizes="50vw"
                  className={`object-cover object-center transition-opacity duration-150 ease-in-out ${
                    imgVisible ? "opacity-100" : "opacity-0"
                  }`}
                  src={currentImage}
                />
                
                {/* Product Badges (top-left) */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                  {product.aiGenerated && (
                    <span className="inline-flex items-center rounded-md bg-vl-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white select-none">
                      Best Seller
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-md bg-vl-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-vl-ink select-none">
                    Trending
                  </span>
                </div>

                {/* Wishlist toggle with scaling pulse */}
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  disabled={isTogglingWishlist}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className={`absolute right-3 top-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/90 text-vl-primary shadow-vl-soft backdrop-blur-sm transition-all duration-vl-fast ${
                    isTogglingWishlist ? "opacity-60 cursor-not-allowed pointer-events-none" : "hover:scale-105 active:scale-95"
                  }`}
                >
                  <Heart
                    aria-hidden="true"
                    className={`h-5 w-5 transition-all duration-vl-fast ${
                      isWishlisted ? "fill-vl-primary text-vl-primary" : "text-vl-muted"
                    }`}
                    strokeWidth={2}
                  />
                </button>
              </div>

              {/* Desktop vertical strip */}
              {images.length > 1 && (
                <div className="w-20 shrink-0 flex flex-col gap-2.5">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleThumbnailClick(idx, false)}
                      aria-label={`View image ${idx + 1} of ${images.length}`}
                      className={`cursor-pointer overflow-hidden rounded-vl-control border-2 p-0.5 transition-all duration-vl-fast aspect-[3/4] relative w-full ${
                        selectedImageIdx === idx
                          ? "border-vl-primary shadow-vl-soft"
                          : "border-vl-border hover:border-vl-primary"
                      }`}
                    >
                      <Image
                        fill
                        className="object-cover"
                        src={img.url}
                        alt={`Thumbnail ${idx + 1}`}
                        sizes="72px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile-only horizontal swipe gallery layout */}
            <div className="lg:hidden relative w-full aspect-[3/4] overflow-hidden rounded-vl-card border border-vl-border bg-vl-surface shadow-vl-soft">
              <div
                ref={mobileScrollContainerRef}
                onScroll={handleMobileScroll}
                className="hide-scrollbar flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth"
              >
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-full h-full shrink-0 snap-start snap-always"
                  >
                    <Image
                      alt={`${product.name} - Image ${idx + 1}`}
                      fill
                      priority={idx === 0}
                      sizes="100vw"
                      className="object-cover object-center"
                      src={img.url}
                    />
                  </div>
                ))}
              </div>

              {/* Dot Indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/25 px-3 py-1.5 rounded-full backdrop-blur-[2px] select-none pointer-events-none">
                  {images.map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        selectedImageIdx === idx ? "w-3 bg-white" : "w-1.5 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Product Badges (top-left) */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
                {product.aiGenerated && (
                  <span className="inline-flex items-center rounded-md bg-vl-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white select-none">
                    Best Seller
                  </span>
                )}
                <span className="inline-flex items-center rounded-md bg-vl-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-vl-ink select-none">
                  Trending
                </span>
              </div>

              {/* Wishlist toggle with scaling pulse */}
              <button
                type="button"
                onClick={handleToggleWishlist}
                disabled={isTogglingWishlist}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className={`absolute right-3 top-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/90 text-vl-primary shadow-vl-soft backdrop-blur-sm transition-all duration-vl-fast z-10 ${
                  isTogglingWishlist ? "opacity-60 cursor-not-allowed pointer-events-none" : "hover:scale-105 active:scale-95"
                }`}
              >
                <Heart
                  aria-hidden="true"
                  className={`h-5 w-5 transition-all duration-vl-fast ${
                    isWishlisted ? "fill-vl-primary text-vl-primary" : "text-vl-muted"
                  }`}
                  strokeWidth={2}
                />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Product Info & Selection (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col gap-5 min-w-0">
            
            {/* Title & Brand heading */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-vl-muted uppercase tracking-[0.08em]">
                  {product.category}
                </span>
                {isSellerVerified && (
                  <div className="flex items-center gap-1">
                    <BadgeCheck aria-hidden="true" className="h-4.5 w-4.5 text-vl-success" strokeWidth={2.5} />
                    <span className="text-xs font-bold text-vl-success">
                      Verified Seller
                    </span>
                  </div>
                )}
              </div>
              <h1 className="font-vl-heading text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-vl-ink break-words">
                {product.name}
              </h1>
              
              {/* Star rating row */}
              <div className="flex items-center gap-2 py-1 flex-wrap">
                <div className="inline-flex items-center gap-1 rounded-md bg-vl-success px-2 py-0.5 text-xs font-bold text-white leading-none">
                  4.8 <Star aria-hidden="true" className="h-3 w-3 fill-current" strokeWidth={0} />
                </div>
                <span className="text-sm text-vl-muted font-medium">
                  1,248 Ratings · 231 Reviews
                </span>
              </div>
            </div>

            {/* Pricing card section */}
            <div className="border-t border-b border-vl-border py-4 space-y-1.5">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="font-vl-heading text-3xl font-extrabold text-vl-ink">
                  ₹{priceInINR.toLocaleString("en-IN")}
                </span>
                <span className="text-base text-vl-muted line-through">
                  ₹{originalPriceInINR.toLocaleString("en-IN")}
                </span>
                <span className="text-sm font-bold text-vl-primary">
                  {discount}% OFF
                </span>
              </div>
              <p className="text-vl-success font-bold text-xs flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-vl-success"></span>
                Earn 50 Coins on this purchase
              </p>
            </div>

            {/* Size/Variant selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="border-b border-vl-border pb-4 space-y-2.5" role="radiogroup" aria-label="Select size">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-vl-ink">
                    Select Size
                  </h3>
                  {selectedSize && (
                    <span className="text-xs font-bold">
                      {(() => {
                        const variant = product.variants.find(
                          (v) => v.size === selectedSize
                        );
                        if (!variant) return null;
                        if (variant.stockCount === 0)
                          return <span className="text-vl-danger">Out of stock</span>;
                        if (variant.stockCount <= 3)
                          return (
                            <span className="text-vl-warning">
                              Only {variant.stockCount} left!
                            </span>
                          );
                        return (
                          <span className="text-vl-success">
                            {variant.stockCount} available
                          </span>
                        );
                      })()}
                    </span>
                  )}
                </div>
                
                {/* Size pills list */}
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isAvailable = v.stockCount > 0;
                    const isSelected = selectedSize === v.size;
                    return (
                      <button
                        key={v.size}
                        type="button"
                        onClick={() => isAvailable && setSelectedSize(v.size)}
                        disabled={!isAvailable}
                        suppressHydrationWarning
                        aria-pressed={isSelected}
                        className={`min-w-[44px] min-h-[44px] px-3.5 rounded-vl-control text-sm font-bold border transition-all duration-vl-fast active:scale-95 ${
                          !isAvailable
                            ? "bg-vl-surface border-vl-border text-vl-muted line-through opacity-40 cursor-not-allowed"
                            : isSelected
                            ? "bg-vl-ink text-white border-vl-ink shadow-vl-soft"
                            : "bg-vl-card border-vl-border text-vl-ink hover:border-vl-primary hover:text-vl-primary"
                        }`}
                      >
                        {v.size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTAs / Purchase buttons row (Desktop only) */}
            <div className="space-y-3 py-1 hidden lg:block">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isReserving}
                  className="flex-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-vl-control bg-vl-primary px-6 font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.25)] transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isReserving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingBag className="h-4 w-4" />
                  )}
                  {isReserving ? "RESERVING..." : "ADD TO CART"}
                </button>
                
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || isReserving}
                  className="flex-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-vl-control border border-vl-border px-6 font-semibold text-vl-ink transition-all duration-vl-fast hover:border-vl-primary hover:text-vl-primary active:scale-[0.98] disabled:opacity-50"
                >
                  <Bolt className="h-4 w-4" />
                  {isReserving ? "RESERVING..." : "BUY NOW"}
                </button>
              </div>

              {/* Feedback inline messages */}
              {errorMessage && (
                <p className="text-sm font-semibold text-vl-danger mt-2 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {errorMessage}
                </p>
              )}
              {successMessage && (
                <p className="text-sm font-semibold text-vl-success mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {successMessage}
                </p>
              )}
            </div>

            {/* Delivery Pincode Card */}
            <div className="rounded-vl-card border border-vl-border bg-vl-surface/40 p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm text-vl-ink font-medium">
                  <MapPin aria-hidden="true" className="text-vl-muted h-4.5 w-4.5 shrink-0" />
                  Deliver to <span className="font-bold">
                    {deliveryAddress ? `${deliveryAddress.city} ${deliveryAddress.pincode}` : "Chennai 600001"}
                  </span>
                </div>
                <Link
                  href={`/account/addresses?redirectTo=${encodeURIComponent(`/products/${product.id}`)}`}
                  className="text-vl-primary font-bold text-xs hover:underline cursor-pointer"
                >
                  Change
                </Link>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-sm text-vl-ink font-medium">
                <p>
                  Delivery by <span className="font-bold">Tomorrow, Oct 24</span>
                </p>
                <span className="h-4 w-[1px] bg-vl-border hidden sm:inline-block"></span>
                <p className="text-vl-success font-bold uppercase text-xs">
                  FREE
                </p>
              </div>
            </div>

            {/* Seller profile Card */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Logo wrapper */}
                <div className="w-12 h-12 bg-vl-surface flex items-center justify-center rounded-vl-control border border-vl-border shrink-0 overflow-hidden relative shadow-sm">
                  {product.seller.logoUrl ? (
                    <Image
                      fill
                      src={product.seller.logoUrl}
                      alt={product.seller.businessName}
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <span className="font-black text-vl-primary text-base">
                      {getSellerInitials(product.seller.businessName)}
                    </span>
                  )}
                </div>
                
                {/* Seller info text */}
                <div className="flex flex-col min-w-0">
                  <Link
                    href={`/sellers/${product.seller.id}`}
                    className="font-bold text-vl-ink hover:text-vl-primary text-sm truncate"
                  >
                    {product.seller.businessName}
                  </Link>
                  <div className="flex items-center gap-1 text-xs text-vl-muted truncate">
                    <span className="truncate">{product.seller.city}</span>
                    <span>·</span>
                    <span className="text-vl-success font-bold flex items-center gap-0.5 shrink-0">
                      4.9 <Star aria-hidden="true" className="h-3 w-3 fill-current" strokeWidth={0} />
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/sellers/${product.seller.id}`}
                  className="inline-flex min-h-9 items-center justify-center rounded-vl-control border border-vl-border bg-vl-card px-3.5 text-xs font-bold text-vl-ink transition-colors duration-vl-fast hover:border-vl-primary hover:text-vl-primary"
                >
                  Visit Store
                </Link>
              </div>
            </div>

            {/* Trust Badges row */}
            <div className="grid grid-cols-3 gap-3 border-t border-b border-vl-border py-4">
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="h-10 w-10 rounded-full bg-vl-primary/8 flex items-center justify-center text-vl-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-vl-ink uppercase tracking-wide">Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="h-10 w-10 rounded-full bg-vl-primary/8 flex items-center justify-center text-vl-primary">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-vl-ink uppercase tracking-wide">Easy Returns</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="h-10 w-10 rounded-full bg-vl-primary/8 flex items-center justify-center text-vl-primary">
                  <Truck className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-vl-ink uppercase tracking-wide">Fast Shipping</span>
              </div>
            </div>

            {/* Details & description Accordions */}
            <div className="divide-y divide-vl-border">
              {/* Product description section */}
              <div className="py-3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-vl-ink mb-2">
                  Product Description
                </h3>
                <p className={`text-sm text-vl-ink leading-relaxed ${isDescExpanded ? "" : "line-clamp-3"}`}>
                  {product.fullDescription}
                </p>
                {product.fullDescription.length > 180 && (
                  <button
                    type="button"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-vl-primary mt-2 cursor-pointer hover:underline"
                  >
                    {isDescExpanded ? "READ LESS" : "READ MORE"}
                    <ChevronDown
                      aria-hidden="true"
                      className={`h-4 w-4 transition-transform duration-vl-fast ${isDescExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </div>

              {/* Highlights section */}
              <div className="py-3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-vl-ink mb-2">
                  Highlights & Tags
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {highlights.map((highlight, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-vl-surface border border-vl-border px-3 py-1 text-xs font-semibold text-vl-ink select-none"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Ratings & Reviews block */}
        <section className="mt-14 py-8 border-t border-vl-border">
          <h2 className="font-vl-heading text-xl sm:text-2xl font-extrabold tracking-[-0.03em] text-vl-ink mb-6">
            Customer Reviews
          </h2>
          <ReviewGallery
            productId={product.id}
            initialSummary={reviewSummary}
            initialReviews={initialReviews}
          />
        </section>

        {/* Similar Products Grid section */}
        <section className="mt-14 pt-8 border-t border-vl-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-vl-heading text-xl sm:text-2xl font-extrabold tracking-[-0.03em] text-vl-ink">
              You May Also Like
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-5 xl:grid-cols-4">
            {finalSimilarProducts.map((item) => {
              const isFallback = isFallbackId(item.id);
              
              // Map custom item to type compliant with canonical card
              const compliantItem = {
                id: item.id,
                sellerId: isFallback ? "" : item.id,
                name: item.name,
                shortDescription: "",
                fullDescription: "",
                category: item.category,
                subcategory: null,
                tags: [],
                price: item.price,
                isPublished: true,
                isDeleted: false,
                createdAt: "",
                updatedAt: "",
                images: item.images?.map((img, i) => ({
                  id: String(i),
                  productId: item.id,
                  url: img.url,
                  sortOrder: i,
                })) || [],
                variants: [],
                seller: {
                  id: "",
                  businessName: item.seller.businessName,
                  storeName: item.seller.businessName,
                  storeLogo: null,
                },
                mrp: item.price * 1.4,
                discountPercent: 28,
                rating: 4.5,
                reviewCount: 12,
                formattedReviews: "12",
                badge: null,
              };

              return (
                <ProductCard
                  key={item.id}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  product={compliantItem as any}
                  isLoggedIn={!!userProfile}
                  onWishlistToggle={async () => {}}
                />
              );
            })}
          </div>
        </section>

        {/* Recently Viewed */}
        <section className="mt-14 pt-8 border-t border-vl-border">
          <h2 className="font-vl-heading text-xl sm:text-2xl font-extrabold tracking-[-0.03em] text-vl-ink mb-6">
            Recently Viewed
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {finalRecentlyViewed.map((item) => {
              const isFallback = isFallbackId(item.id);
              return (
                <Link
                  key={item.id}
                  href={isFallback ? "#" : `/products/${item.id}`}
                  className="group relative flex flex-col bg-vl-card border border-vl-border rounded-vl-card p-2 hover:shadow-vl-soft transition-all duration-vl-fast hover:border-vl-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vl-primary focus-visible:ring-offset-2"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-vl-control bg-vl-surface">
                    <Image
                      src={item.images?.[0]?.url || "/placeholder.jpg"}
                      alt={item.name}
                      fill
                      sizes="120px"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-vl-standard"
                    />
                  </div>
                  <p className="mt-2 text-xs font-bold text-vl-ink truncate">
                    {item.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Explore More Like This */}
        <section className="mt-14 pt-8 border-t border-vl-border">
          <h2 className="font-vl-heading text-xl sm:text-2xl font-extrabold tracking-[-0.03em] text-vl-ink mb-6">
            Explore More Like This
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/products?category=Decor" className="group space-y-2 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vl-primary focus-visible:ring-offset-2 rounded-vl-card p-1">
              <div className="relative aspect-video w-full overflow-hidden rounded-vl-card border border-vl-border">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAF6EwSD6V-HIcVIRzmGKx2oBOD4h0URNI_iPC_TlYIRO8u-kEb5_-G5GlvwrWWigEJPWYKe55FlOv-a7_YKCghqeqwhSCu92UGJIwnKcIZmVrs5xM5rnalLwHgsqm9tWlPTA4R9X21haPvbW-zw13YhHE3bpVdx_f1z374S7KAEEj-Wm0JZZGN51s38lIeII5p_EAKrD3p3ki-u6vhTVvfc-UCQDxV5nwEV4RmIlxUMTkfvh5v9Vhx2-f6Ayem98sGP9HfpGf700dS"
                  alt="Botanical Art Prints"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-vl-standard"
                />
              </div>
              <h4 className="text-sm font-bold text-vl-ink">Botanical Art Prints</h4>
              <p className="text-xs text-vl-muted">Explore Wall Decor</p>
            </Link>
            <Link href="/products?category=Decor" className="group space-y-2 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vl-primary focus-visible:ring-offset-2 rounded-vl-card p-1">
              <div className="relative aspect-video w-full overflow-hidden rounded-vl-card border border-vl-border">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbB4zIvaeLb1Upa26R5nfP9fghtMm4I5lg60rSTxBlYfEHjsZ7OnKPoZ5bvY_yQlME3-5pkosGCB1VsZdYrzBm_oHiwcx-k85C-a7naptx8S5nIOwTs4oOjBcHRmO3MvFLoIoAI0z5jgcdehlWsrJrUXtXJ3KkXAInqmjwdIy8hJ0crJe07ENgv4AKt3Fy5vk34ddovqaAfBLBJHnTSiLjvNBI7PT1KGTRGiTarKBR6_XqHRNwO-PTVu3bPq_EUaPSCMEd_c0GoDzO"
                  alt="Texture Wool Rugs"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-vl-standard"
                />
              </div>
              <h4 className="text-sm font-bold text-vl-ink">Texture Wool Rugs</h4>
              <p className="text-xs text-vl-muted">Explore Carpets</p>
            </Link>
            <Link href="/products?category=Decor" className="group space-y-2 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vl-primary focus-visible:ring-offset-2 rounded-vl-card p-1">
              <div className="relative aspect-video w-full overflow-hidden rounded-vl-card border border-vl-border">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCH-E0-8bBvmZB_0KrE5Ihm-5J_vDXJzUVp6jI65HPc6IFvyLP2CP5p0MSLQU8VMVeTi-dRkD0GhR4A6JV3ozqwmmKka30cSjY7IExUQizCtTiG-pX0jF3qsrDHjzBUwOIDRBB7ot3fkgpbjgnbXNMYsFTQiQYE_83_83QjJ7o3yXX48pXjg6YgtPMk5HgIUKqYyon5JfsS1BIyji9GwS-83c5lJ9mlgDcemg07q6j8w9uDrBkeGjdXsVYpUfNrLarZmujRXUj0sbpp"
                  alt="Matte Kitchenware"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-vl-standard"
                />
              </div>
              <h4 className="text-sm font-bold text-vl-ink">Matte Kitchenware</h4>
              <p className="text-xs text-vl-muted">Explore Kitchen</p>
            </Link>
            <Link href="/products?category=Decor" className="group space-y-2 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vl-primary focus-visible:ring-offset-2 rounded-vl-card p-1">
              <div className="relative aspect-video w-full overflow-hidden rounded-vl-card border border-vl-border">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAua2IKxpteIAmE7gCqgyJA-hzpCGeyjVVJPAbFPzmeQKUsYS2oJlWO7gETticVpoIWzRhgBtk3SZyFGM7F1z5uBhXlP5yigGOu9WIrlK1pM5p53MBt1KGf49dmSOCivxpp9VlhHYzF2zB9GZQ7EIZjV9CyN4Oy1MNSRe_NNL3fJ078We5__uDaEq2Vf6HJ7OJSJKkC0duMH3SmoT_sYzH9oz8omfYnF70ZGBpw8O9SX_9hqJ60dEqXEpE-3iajuOAOtDOzpS8dIUd6"
                  alt="Mid-Century Dressers"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-vl-standard"
                />
              </div>
              <h4 className="text-sm font-bold text-vl-ink">Mid-Century Dressers</h4>
              <p className="text-xs text-vl-muted">Explore Furniture</p>
            </Link>
          </div>
        </section>

      </main>

      {/* Mobile Floating Sticky CTA (Add to Cart / Buy Now) */}
      <div
        className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-vl-border p-3 md:hidden flex items-center gap-3 shadow-vl-large"
      >
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock || isReserving}
          className="flex-1 bg-vl-primary text-white py-3 font-bold rounded-vl-control text-xs flex items-center justify-center gap-1.5 hover:bg-vl-primary-strong transition-all duration-vl-fast disabled:opacity-50"
        >
          {isReserving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingBag className="h-4 w-4" />
          )}
          {isReserving ? "RESERVING..." : "ADD TO CART"}
        </button>
        
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isOutOfStock || isReserving}
          className="flex-1 border border-vl-border text-vl-ink py-3 font-semibold rounded-vl-control text-xs flex items-center justify-center gap-1.5 hover:border-vl-primary hover:text-vl-primary transition-all duration-vl-fast disabled:opacity-50"
        >
          <Bolt className="h-4 w-4" />
          {isReserving ? "RESERVING..." : "BUY NOW"}
        </button>
      </div>
    </>
  );
}
