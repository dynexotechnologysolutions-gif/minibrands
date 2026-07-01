"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reserveCartItem } from "@/actions/cart-reserve.action";
import { createCheckoutSession } from "@/actions/checkout-session.action";
import { addToWishlistAction, removeFromWishlistAction } from "@/actions/wishlist.action";
import { authClient } from "@/lib/auth-client";
import HomeHeader from "@/components/home/HomeHeader";

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
    role: "BUYER" | "SELLER" | "ADMIN";
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
}

export default function ProductDetailClient({
  product,
  userProfile,
  cartCount: initialCartCount,
  similarProducts,
  recentlyViewed,
  initialIsWishlisted = false,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.variants.length === 1 ? product.variants[0].size : null
  );
  const [isReserving, setIsReserving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

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
    } catch (err) {
      console.error("Failed to toggle wishlist:", err);
      setIsWishlisted(!newWishlisted);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const images =
    product.images.length > 0
      ? product.images
      : [{ url: "/placeholder.jpg", cloudinaryPublicId: "placeholder" }];
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/products");
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.refresh();
      router.push("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

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
    } catch (err) {
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
        products: [{
          productId: product.id,
          variantId: selectedVariantInfo.id,
          quantity: 1,
          price: product.price,
          size: selectedVariantInfo.size,
          image: images[0]?.url || "/placeholder.jpg",
          sellerName: product.seller.businessName,
          sellerId: product.seller.id,
        }],
      };

      const response = await createCheckoutSession(payload);

      if (response.success && response.sessionId) {
        router.push(`/checkout?sessionId=${response.sessionId}`);
      } else {
        setErrorMessage(
          response.error || "Failed to initiate Buy Now. Please try again."
        );
      }
    } catch (err) {
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

  const highlights = [];
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
          {
            id: "similar-3",
            name: "Soy Candle Set",
            category: "LUMIERE",
            price: 149900,
            images: [
              {
                url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAjM-mo1tmHeMHTTTtkHfB3cFj-qSmZr6DrEJgpili4ixSbG_k_wD2Vov3a3T0pLvgvAKACeha9Kk-fCoqppD62PRZMhK_5lMy7wRSCQrkBLrwq4sIlIHPRi8hy-6yThnF5zS7KKzchARL9HBbayThX7Ec6kdLrwh9MwdQL9RiVVhgcOi81nLtrpBwdmMR-QLf_n74gSthiVhszL-J8eTCXFiGiwVFDj-W_TMFnwsHePZXQdAU3jYEtcfQ67ox3SmzPZWVZGh9eCuA",
              },
            ],
            seller: { businessName: "Aura Wear" },
          },
          {
            id: "similar-4",
            name: "Large Jute Basket",
            category: "CRAFT",
            price: 99900,
            images: [
              {
                url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCnMcaSTXdsb2QvhIb8QL-hqy3s2gOXrw4zJTGiY5D0FvFytvF9cR1iesOKiBDkHa8_pUROx1vEx-xpQTRi1CpwNpY7A1LkuJlziolH_6j5AsVA7VZq6rwCIVlLIQ8fPGh6ZOCh7kxGEIyrU8Ldpun5fevl2fuusJwbkjlfZgOFLYspbPLvuBq4U9M6GCct_invHHj4R5lR2FEcQXAX-A_6GmYKWgcZkawf3B6Zt3V6oAUCTja0pcsfhimcFCD2gbt77ex1yrP1FI0-",
              },
            ],
            seller: { businessName: "Aura Wear" },
          },
          {
            id: "similar-5",
            name: "Geometric Terrarium",
            category: "GREEN",
            price: 210000,
            images: [
              {
                url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDbvOkDXF_CDM_IF71dRaczH-NQrjtSs_KHAc6xCLeMWDD3w3hztNuwjV3BZqu9GGwpJzsa3PfxY9XGOlCaz4B9y3i4z0quvvHe1sKjW-v6hI_NX6jWwAMXDvDgAAOKEkGR4MXc0eILY3bUa5zxNtTNRoyEoNy6MdT1yhBohWjdLC3gASA_768D3NLRww9ud2VxsurY7i3VwZK3soF5fZnlvr2R4hgmYGzYw0XFQlQPAYwvEHWUov3uxTSefFrQDyoyC1xhw8SJWzKt",
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
          {
            id: "recent-2",
            name: "Blue Ceramic Mugs",
            images: [
              {
                url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDIpbXhe2il_PWhY0QHmYKSW6hD9eoDuxPhZ8KonVbdPw0_Sjc32IK0DWqFTm32x2J1SUgFwH6QjO0jtHAoOPOQNYlaQQGiXeWNfam9dwfZSp5CWbtAD-v-z7nPvo7O-VvCSsJOWzm8zPrSmr56tWh4prm5Mhf-LNSIm0Xn6rhWMNVCf_xhDnA77IMg7O1iu-d4BGBWRkSpLWzmOUDxB_7CV3bw2PjIqZ2Mv4CKYEYPoJ80UVAUuEbFQ3J2eb0N9K2OD3j0hIlwDD2x",
              },
            ],
          },
          {
            id: "recent-3",
            name: "Emerald Velvet Pillow",
            images: [
              {
                url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgYHsf42YFCs7nAtJ8zzZscnBJK1UYpZ3M120QsJvt2uvcPiX01ekrQAJQOMMvMd_Kh0jgUHvHxDel4VRmQuz1nXsEAa4rcLC8CjsOkRZCwwJZsRTXgRq0oZk3v9gv6N4-Lk1B36t_qtLIcmqCmSfgc2nxXj8i-_u_hJQFCX6hxK-e57K15jBRQEozBZX1yN3rZFJ77GlgbeqZ8P6yHG-qsER_dduKd7-r2viZAcS3n_CbW2hyzoK4pyrH0HwoiKVUalNaES1vMmDh",
              },
            ],
          },
        ];

  const isFallbackId = (id: string) =>
    id.startsWith("similar-") || id.startsWith("recent-");

  const [isDescExpanded, setIsDescExpanded] = useState(false);

  return (
    <>
      {/* TopNavBar (Shared Component) */}
      <HomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      {/* Main Container */}
      <main className="max-w-container-max mx-auto px-base lg:px-xl py-lg">
        {/* Breadcrumbs */}
        <nav className="flex text-body-sm font-body-sm text-text-muted mb-md gap-xs flex-wrap">
          <Link className="hover:text-primary" href="/">
            Home
          </Link>
          <span className="">/</span>
          <Link
            className="hover:text-primary"
            href={`/products?category=${encodeURIComponent(product.category)}`}
          >
            {product.category}
          </Link>
          {product.subcategory && (
            <>
              <span className="">/</span>
              <Link
                className="hover:text-primary"
                href={`/products?category=${encodeURIComponent(
                  product.category
                )}&subcategory=${encodeURIComponent(product.subcategory)}`}
              >
                {product.subcategory}
              </Link>
            </>
          )}
          <span className="">/</span>
          <span className="text-on-surface truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* Product View Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-xl">
          {/* Left Column: Gallery (40%) */}
          <div className="md:col-span-5 flex flex-col lg:flex-row gap-md">
            {/* Vertical Thumbnails */}
            {images.length > 1 && (
              <div className="hidden lg:flex flex-col gap-sm w-16 shrink-0">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`border-2 p-xs cursor-pointer ${
                      selectedImageIdx === idx
                        ? "border-primary"
                        : "border-border-gray hover:border-primary"
                    }`}
                  >
                    <img
                      className="w-full aspect-square object-cover"
                      src={img.url}
                      alt={`Thumbnail ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-grow relative border border-border-gray bg-white h-fit">
              <img
                alt={product.name}
                className="w-full h-auto object-cover"
                src={currentImage}
              />
              <div className="absolute top-md left-md flex flex-col gap-xs">
                {product.aiGenerated && (
                  <span className="bg-primary text-on-primary text-[10px] px-sm py-1 font-bold rounded-sm uppercase tracking-wider">
                    Best Seller
                  </span>
                )}
                <span className="bg-accent-yellow text-tertiary text-[10px] px-sm py-1 font-bold rounded-sm uppercase tracking-wider">
                  Trending
                </span>
              </div>
              <button
                onClick={handleToggleWishlist}
                disabled={isTogglingWishlist}
                className="absolute top-md right-md bg-white p-sm rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer disabled:opacity-50"
              >
                <span
                  className="material-symbols-outlined text-error"
                  style={{ fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0" }}
                >
                  favorite
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: Details (60%) */}
          <div className="md:col-span-7 space-y-md">
            {/* Title & Brand */}
            <div className="space-y-xs">
              <div className="flex items-center gap-xs">
                <span className="font-label-bold text-label-bold text-text-muted uppercase">
                  {product.category}
                </span>
                {isSellerVerified && (
                  <>
                    <span
                      className="material-symbols-outlined text-success-green text-base"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                    <span className="text-body-sm font-body-sm text-success-green font-bold">
                      Verified Store
                    </span>
                  </>
                )}
              </div>
              <h1 className="font-headline-md text-headline-md text-on-surface">
                {product.name}
              </h1>
              <div className="flex items-center gap-md py-1">
                <div className="bg-success-green text-on-primary flex items-center px-sm py-0.5 rounded gap-xs text-body-sm font-bold">
                  4.8{" "}
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                </div>
                <span className="text-body-md font-body-md text-text-muted">
                  1,248 Ratings, 231 Reviews
                </span>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-xs py-md border-y border-border-gray">
              <div className="flex items-baseline gap-md">
                <span className="font-price-lg text-price-lg text-on-surface">
                  ₹{priceInINR.toLocaleString("en-IN")}
                </span>
                <span className="font-body-md text-body-md text-text-muted line-through">
                  ₹{originalPriceInINR.toLocaleString("en-IN")}
                </span>
                <span className="font-label-bold text-label-bold text-success-green">
                  {discount}% OFF
                </span>
              </div>
              <p className="text-success-green font-bold text-body-sm">
                Earn 50 Coins on this purchase
              </p>
            </div>

            {/* Size/Variant Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="py-md border-b border-border-gray space-y-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-label-bold text-label-bold text-on-surface uppercase tracking-tight">
                    Select Size
                  </h3>
                  {selectedSize && (
                    <span className="text-body-sm font-bold">
                      {(() => {
                        const variant = product.variants.find(
                          (v) => v.size === selectedSize
                        );
                        if (!variant) return null;
                        if (variant.stockCount === 0)
                          return <span className="text-error-red">Out of stock</span>;
                        if (variant.stockCount <= 3)
                          return (
                            <span className="text-accent-yellow">
                              Only {variant.stockCount} left!
                            </span>
                          );
                        return (
                          <span className="text-success-green">
                            {variant.stockCount} available
                          </span>
                        );
                      })()}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-sm">
                  {product.variants.map((v) => {
                    const isAvailable = v.stockCount > 0;
                    const isSelected = selectedSize === v.size;
                    return (
                      <button
                        key={v.size}
                        type="button"
                        onClick={() => isAvailable && setSelectedSize(v.size)}
                        disabled={!isAvailable}
                        className={`min-w-[48px] px-md py-sm text-body-md font-label-bold rounded-sm border transition-all cursor-pointer ${
                          !isAvailable
                            ? "bg-surface-container border-border-gray text-text-muted line-through cursor-not-allowed opacity-50"
                            : isSelected
                            ? "bg-primary text-on-primary border-primary"
                            : "bg-white border-border-gray text-on-surface hover:border-primary"
                        }`}
                      >
                        {v.size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Purchase Buttons */}
            <div className="space-y-sm py-md">
              <div className="grid grid-cols-2 gap-md">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isReserving}
                  className="bg-accent-yellow text-primary py-xl font-bold rounded-sm flex items-center justify-center gap-sm hover:brightness-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">shopping_cart</span>{" "}
                  {isReserving ? "RESERVING..." : "ADD TO CART"}
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || isReserving}
                  className="bg-tertiary text-on-tertiary py-xl font-bold rounded-sm flex items-center justify-center gap-sm hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">bolt</span>{" "}
                  {isReserving ? "RESERVING..." : "BUY NOW"}
                </button>
              </div>

              {/* Feedback messages */}
              {errorMessage && (
                <div className="p-sm bg-error-container text-error text-body-md rounded-DEFAULT font-bold border border-error/20 mt-xs">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-sm bg-surface-container-low text-success-green text-body-md rounded-DEFAULT font-bold border border-success-green/20 mt-xs">
                  {successMessage}
                </div>
              )}
            </div>

            {/* Delivery Info */}
            <div className="bg-surface-container-low p-md rounded-lg space-y-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-xs text-body-md font-body-md">
                  <span className="material-symbols-outlined text-text-muted">
                    location_on
                  </span>
                  Deliver to <span className="font-bold">Chennai 600001</span>
                </div>
                <button className="text-primary font-bold text-body-sm cursor-pointer hover:underline">
                  Change
                </button>
              </div>
              <div className="flex items-center gap-md">
                <p className="text-body-md font-body-md">
                  Delivery by <span className="font-bold">Tomorrow, Oct 24</span>
                </p>
                <span className="h-4 w-[1px] bg-outline-variant"></span>
                <p className="text-success-green font-bold text-body-md uppercase">
                  FREE
                </p>
              </div>
            </div>

            {/* Store Card */}
            <div className="flex items-center justify-between p-md bg-surface-container-low rounded-lg border border-border-gray">
              <div className="flex items-center gap-md">
                {/* Logo Box */}
                <div className="w-12 h-12 bg-white flex items-center justify-center rounded shadow-sm shrink-0 overflow-hidden relative">
                  {product.seller.logoUrl ? (
                    <img
                      src={product.seller.logoUrl}
                      alt={product.seller.businessName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-black text-primary text-lg">
                      {getSellerInitials(product.seller.businessName)}
                    </span>
                  )}
                </div>
                {/* Store Info */}
                <div className="flex flex-col">
                  <Link
                    href={`/sellers/${product.seller.id}`}
                    className="font-label-bold text-on-surface hover:text-primary font-bold text-sm"
                  >
                    {product.seller.businessName}
                  </Link>
                  <div className="flex items-center gap-xs text-body-sm text-text-muted">
                    <span className="">{product.seller.city}</span>
                    <span className="">•</span>
                    <span className="text-success-green font-bold flex items-center gap-xs">
                      4.9{" "}
                      <span
                        className="material-symbols-outlined text-xs"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center gap-sm">
                <Link
                  href={`/sellers/${product.seller.id}`}
                  className="px-lg py-sm border border-border-gray bg-white font-bold text-body-sm hover:bg-surface-container transition-colors rounded-sm text-center"
                >
                  Visit Store
                </Link>
                <button className="px-lg py-sm bg-tertiary text-on-tertiary font-bold text-body-sm hover:opacity-90 transition-all rounded-sm cursor-pointer">
                  Follow
                </button>
              </div>
            </div>

            {/* Highlights */}
            <div className="py-md">
              <h3 className="font-label-bold text-label-bold text-on-surface mb-sm uppercase tracking-tight">
                Highlights
              </h3>
              <ul className="grid grid-cols-2 gap-sm text-body-md font-body-md">
                {highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-center gap-xs">
                    <span className="w-1 h-1 bg-text-muted rounded-full"></span>{" "}
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Description */}
            <div className="py-md border-t border-border-gray">
              <h3 className="font-label-bold text-label-bold text-on-surface mb-sm uppercase tracking-tight">
                Product Description
              </h3>
              <p
                className={`text-body-md font-body-md text-on-surface-variant leading-relaxed ${
                  isDescExpanded ? "" : "line-clamp-3"
                }`}
              >
                {product.fullDescription}
              </p>
              {product.fullDescription.length > 180 && (
                <button
                  type="button"
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="text-primary font-bold text-body-sm mt-sm flex items-center cursor-pointer hover:underline"
                >
                  {isDescExpanded ? "READ LESS" : "READ MORE"}{" "}
                  <span
                    className={`material-symbols-outlined text-sm ml-xs transition-transform duration-200 ${
                      isDescExpanded ? "rotate-180" : ""
                    }`}
                  >
                    expand_more
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ratings & Reviews Section */}
        <section className="mt-xxl py-xl border-t border-border-gray">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-lg">
            Ratings &amp; Reviews
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-xl">
            {/* Average Breakdown */}
            <div className="md:col-span-4 space-y-md">
              <div className="flex items-center gap-lg">
                <div className="text-center">
                  <div className="text-4xl font-black text-on-surface">
                    4.8{" "}
                    <span
                      className="material-symbols-outlined text-2xl align-middle"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  </div>
                  <div className="text-body-sm font-body-sm text-text-muted mt-1">
                    1,248 Ratings
                  </div>
                </div>
                <div className="flex-grow space-y-1">
                  {/* Bars */}
                  <div className="flex items-center gap-sm">
                    <span className="text-body-sm w-4">5★</span>
                    <div className="flex-grow h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success-green"
                        style={{ width: "80%" }}
                      ></div>
                    </div>
                    <span className="text-body-sm w-8 text-right">980</span>
                  </div>

                  <div className="flex items-center gap-sm">
                    <span className="text-body-sm w-4">4★</span>
                    <div className="flex-grow h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success-green"
                        style={{ width: "15%" }}
                      ></div>
                    </div>
                    <span className="text-body-sm w-8 text-right">182</span>
                  </div>
                  <div className="flex items-center gap-sm">
                    <span className="text-body-sm w-4">3★</span>
                    <div className="flex-grow h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-yellow"
                        style={{ width: "3%" }}
                      ></div>
                    </div>
                    <span className="text-body-sm w-8 text-right">45</span>
                  </div>
                  <div className="flex items-center gap-sm">
                    <span className="text-body-sm w-4">2★</span>
                    <div className="flex-grow h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-error-red"
                        style={{ width: "1%" }}
                      ></div>
                    </div>
                    <span className="text-body-sm w-8 text-right">24</span>
                  </div>
                  <div className="flex items-center gap-sm">
                    <span className="text-body-sm w-4">1★</span>
                    <div className="flex-grow h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-error-red"
                        style={{ width: "1%" }}
                      ></div>
                    </div>
                    <span className="text-body-sm w-8 text-right">17</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Review Cards */}
            <div className="md:col-span-8 space-y-lg">
              <div className="border-b border-border-gray pb-lg">
                <div className="flex items-center gap-md mb-xs">
                  <span className="bg-success-green text-on-primary px-sm py-0.5 rounded text-[10px] font-bold">
                    5 ★
                  </span>
                  <span className="font-label-bold text-label-bold font-bold text-sm">
                    Excellent Craftsmanship!
                  </span>
                </div>
                <p className="text-body-md font-body-md text-on-surface mb-sm">
                  The texture is amazing. It looks even better in person. The light
                  is soft and perfect for my reading nook. Highly recommended for
                  minimalist lovers.
                </p>
                <div className="flex items-center gap-sm text-body-sm font-body-sm text-text-muted">
                  <span className="font-bold text-on-surface">Amit R.</span>
                  <span className="">• Verified Purchase • 2 weeks ago</span>
                </div>
              </div>
              <div className="border-b border-border-gray pb-lg">
                <div className="flex items-center gap-md mb-xs">
                  <span className="bg-success-green text-on-primary px-sm py-0.5 rounded text-[10px] font-bold">
                    4 ★
                  </span>
                  <span className="font-label-bold text-label-bold font-bold text-sm">
                    Beautiful, but a bit tall
                  </span>
                </div>
                <p className="text-body-md font-body-md text-on-surface mb-sm">
                  Love the ceramic base. It's solid and well-made. The shade is a
                  bit larger than I expected but still fits the room nicely.
                </p>
                <div className="flex items-center gap-sm text-body-sm font-body-sm text-text-muted">
                  <span className="font-bold text-on-surface">Priya S.</span>
                  <span className="">• Verified Purchase • 1 month ago</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Similar Products Carousel */}
        <section className="mt-xxl">
          <div className="flex items-center justify-between mb-lg">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Similar Products
            </h2>
            <div className="flex gap-sm">
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-border-gray flex items-center justify-center hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">
                  chevron_left
                </span>
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-border-gray flex items-center justify-center hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
          <div className="flex gap-md overflow-x-auto hide-scrollbar">
            {finalSimilarProducts.map((item) => {
              const isFallback = isFallbackId(item.id);
              const itemPriceInINR = Math.round(item.price / 100);
              const itemOriginalPriceInINR = Math.round(itemPriceInINR * 1.7);
              return (
                <Link
                  key={item.id}
                  href={isFallback ? "#" : `/products/${item.id}`}
                  className="min-w-[200px] border border-border-gray bg-white rounded-sm group cursor-pointer shrink-0 block hover:border-primary transition-colors"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      src={item.images?.[0]?.url || "/placeholder.jpg"}
                      alt={item.name}
                    />
                  </div>
                  <div className="p-sm space-y-xs">
                    <p className="text-body-sm font-body-sm text-text-muted truncate uppercase">
                      {item.category}
                    </p>
                    <h4 className="text-body-md font-label-bold truncate text-on-surface font-bold text-sm">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-sm">
                      <span className="font-bold text-on-surface">
                        ₹{itemPriceInINR.toLocaleString("en-IN")}
                      </span>
                      <span className="text-body-sm text-text-muted line-through">
                        ₹{itemOriginalPriceInINR.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recently Viewed */}
        <section className="mt-xxl">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-lg">
            Recently Viewed
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-md">
            {finalRecentlyViewed.map((item) => {
              const isFallback = isFallbackId(item.id);
              return (
                <Link
                  key={item.id}
                  href={isFallback ? "#" : `/products/${item.id}`}
                  className="border border-border-gray p-xs rounded-sm hover:shadow-md transition-shadow cursor-pointer block hover:border-primary"
                >
                  <img
                    className="w-full aspect-square object-cover mb-sm"
                    src={item.images?.[0]?.url || "/placeholder.jpg"}
                    alt={item.name}
                  />
                  <p className="text-body-sm font-label-bold truncate text-on-surface font-bold text-sm">
                    {item.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Explore More Like This */}
        <section className="mt-xxl mb-xxl">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-lg">
            Explore More Like This
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-lg">
            {/* Grid Item 1 */}
            <Link
              href="/products?category=Decor"
              className="space-y-sm block group"
            >
              <div className="overflow-hidden rounded-sm">
                <img
                  className="w-full aspect-video object-cover group-hover:scale-105 transition-transform"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAF6EwSD6V-HIcVIRzmGKx2oBOD4h0URNI_iPC_TlYIRO8u-kEb5_-G5GlvwrWWigEJPWYKe55FlOv-a7_YKCghqeqwhSCu92UGJIwnKcIZmVrs5xM5rnalLwHgsqm9tWlPTA4R9X21haPvbW-zw13YhHE3bpVdx_f1z374S7KAEEj-Wm0JZZGN51s38lIeII5p_EAKrD3p3ki-u6vhTVvfc-UCQDxV5nwEV4RmIlxUMTkfvh5v9Vhx2-f6Ayem98sGP9HfpGf700dS"
                  alt="Botanical Art Prints"
                />
              </div>
              <h4 className="font-label-bold text-body-md text-on-surface font-bold text-sm">
                Botanical Art Prints
              </h4>
              <p className="text-body-sm text-text-muted">Explore Wall Decor</p>
            </Link>
            {/* Grid Item 2 */}
            <Link
              href="/products?category=Decor"
              className="space-y-sm block group"
            >
              <div className="overflow-hidden rounded-sm">
                <img
                  className="w-full aspect-video object-cover group-hover:scale-105 transition-transform"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbB4zIvaeLb1Upa26R5nfP9fghtMm4I5lg60rSTxBlYfEHjsZ7OnKPoZ5bvY_yQlME3-5pkosGCB1VsZdYrzBm_oHiwcx-k85C-a7naptx8S5nIOwTs4oOjBcHRmO3MvFLoIoAI0z5jgcdehlWsrJrUXtXJ3KkXAInqmjwdIy8hJ0crJe07ENgv4AKt3Fy5vk34ddovqaAfBLBJHnTSiLjvNBI7PT1KGTRGiTarKBR6_XqHRNwO-PTVu3bPq_EUaPSCMEd_c0GoDzO"
                  alt="Texture Wool Rugs"
                />
              </div>
              <h4 className="font-label-bold text-body-md text-on-surface font-bold text-sm">
                Texture Wool Rugs
              </h4>
              <p className="text-body-sm text-text-muted">Explore Carpets</p>
            </Link>
            {/* Grid Item 3 */}
            <Link
              href="/products?category=Decor"
              className="space-y-sm block group"
            >
              <div className="overflow-hidden rounded-sm">
                <img
                  className="w-full aspect-video object-cover group-hover:scale-105 transition-transform"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCH-E0-8bBvmZB_0KrE5Ihm-5J_vDXJzUVp6jI65HPc6IFvyLP2CP5p0MSLQU8VMVeTi-dRkD0GhR4A6JV3ozqwmmKka30cSjY7IExUQizCtTiG-pX0jF3qsrDHjzBUwOIDRBB7ot3fkgpbjgnbXNMYsFTQiQYE_83_83QjJ7o3yXX48pXjg6YgtPMk5HgIUKqYyon5JfsS1BIyji9GwS-83c5lJ9mlgDcemg07q6j8w9uDrBkeGjdXsVYpUfNrLarZmujRXUj0sbpp"
                  alt="Matte Kitchenware"
                />
              </div>
              <h4 className="font-label-bold text-body-md text-on-surface font-bold text-sm">
                Matte Kitchenware
              </h4>
              <p className="text-body-sm text-text-muted">Explore Kitchen</p>
            </Link>
            {/* Grid Item 4 */}
            <Link
              href="/products?category=Decor"
              className="space-y-sm block group"
            >
              <div className="overflow-hidden rounded-sm">
                <img
                  className="w-full aspect-video object-cover group-hover:scale-105 transition-transform"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAua2IKxpteIAmE7gCqgyJA-hzpCGeyjVVJPAbFPzmeQKUsYS2oJlWO7gETticVpoIWzRhgBtk3SZyFGM7F1z5uBhXlP5yigGOu9WIrlK1pM5p53MBt1KGf49dmSOCivxpp9VlhHYzF2zB9GZQ7EIZjV9CyN4Oy1MNSRe_NNL3fJ078We5__uDaEq2Vf6HJ7OJSJKkC0duMH3SmoT_sYzH9oz8omfYnF70ZGBpw8O9SX_9hqJ60dEqXEpE-3iajuOAOtDOzpS8dIUd6"
                  alt="Mid-Century Dressers"
                />
              </div>
              <h4 className="font-label-bold text-body-md text-on-surface font-bold text-sm">
                Mid-Century Dressers
              </h4>
              <p className="text-body-sm text-text-muted">Explore Furniture</p>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer (Shared Component) */}
      <footer className="w-full py-xxl px-base lg:px-xl grid grid-cols-2 md:grid-cols-5 gap-lg bg-tertiary dark:bg-on-background text-on-tertiary dark:text-inverse-on-surface">
        <div className="col-span-2">
          <div className="text-headline-sm font-headline-sm text-on-tertiary font-black mb-md">
            MINIBRANDS
          </div>
          <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant max-w-xs">
            Connecting you to the best artisanal and major brands across the country.
            Reliable, Fast, and Familiar.
          </p>
        </div>
        <div className="flex flex-col gap-sm">
          <h4 className="font-label-bold text-on-tertiary mb-xs">About</h4>
          <a
            className="font-body-sm text-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors"
            href="#"
          >
            About Us
          </a>
          <a
            className="font-body-sm text-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors"
            href="#"
          >
            Become a Seller
          </a>
          <a
            className="font-body-sm text-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors"
            href="#"
          >
            Policies
          </a>
        </div>
        <div className="flex flex-col gap-sm">
          <h4 className="font-label-bold text-on-tertiary mb-xs">Support</h4>
          <a
            className="font-body-sm text-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors"
            href="#"
          >
            Help Center
          </a>
          <a
            className="font-body-sm text-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors"
            href="#"
          >
            Contact Us
          </a>
          <a
            className="font-body-sm text-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors"
            href="#"
          >
            Returns
          </a>
        </div>
        <div className="flex flex-col gap-sm">
          <h4 className="font-label-bold text-on-tertiary mb-xs">Connect</h4>
          <div className="flex gap-md">
            <span className="material-symbols-outlined cursor-pointer hover:text-accent-yellow">
              face_nod
            </span>
            <span className="material-symbols-outlined cursor-pointer hover:text-accent-yellow">
              photo_camera
            </span>
            <span className="material-symbols-outlined cursor-pointer hover:text-accent-yellow">
              alternate_email
            </span>
          </div>
        </div>
        <div className="col-span-full border-t border-secondary mt-lg pt-lg text-center font-body-sm text-body-sm text-on-secondary-fixed-variant">
          © 2024 MINIBRANDS Marketplace. All rights reserved.
        </div>
      </footer>
    </>
  );
}
