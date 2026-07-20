"use client";

import React, { useState } from "react";
import Link from "next/link";
import ProductGrid from "@/components/product/ProductGrid";
import ReviewGallery from "@/components/review/ReviewGallery";
import { 
  BadgeCheck, 
  ShieldCheck, 
  MapPin, 
  Store, 
  Calendar, 
  ArrowLeft,
  Heart,
  Share2,
  Check,
  Star,
  Truck,
  ThumbsUp,
  Clock,
  Building2,
  Lock
} from "lucide-react";

interface SellerStorefrontClientProps {
  seller: {
    id: string;
    businessName: string;
    storeName?: string | null;
    storeLogo?: string | null;
    storeBanner?: string | null;
    storeDescription?: string | null;
    city: string;
    category: string;
    createdAt: Date;
    verification?: {
      kycStatus: string;
      bankVerified: boolean;
      trustScore: number;
    } | null;
  };
  isSellerVerified: boolean;
  joinedYear: number;
  formattedProducts: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
    images: Array<{ url: string; cloudinaryPublicId: string }>;
    variants: Array<{ size: string; stockCount: number }>;
    seller: {
      businessName: string;
      verification: { kycStatus: string; bankVerified: boolean };
    };
  }>;
  reviewSummary: {
    averageRating: number;
    reviewCount: number;
    distribution: Record<number, number>;
  };
  formattedInitialReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    photoUrls: string[];
    createdAt: string;
    buyer: { user: { name: string } };
  }>;
}

export default function SellerStorefrontClient({
  seller,
  isSellerVerified,
  joinedYear,
  formattedProducts,
  reviewSummary,
  formattedInitialReviews,
}: SellerStorefrontClientProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const storeDisplayName = seller.storeName || seller.businessName;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Get unique categories from products
  const categories = Array.from(
    new Set(formattedProducts.map((p) => p.category).filter(Boolean))
  );

  // Filter products based on selected category
  const filteredProducts = formattedProducts.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="bg-surface-container-low min-h-screen pb-16 text-on-surface font-sans">
      {/* 1. Store Banner */}
      <div
        className="h-48 sm:h-64 lg:h-72 w-full bg-primary bg-cover bg-center relative shadow-inner overflow-hidden"
        style={seller.storeBanner ? { backgroundImage: `url('${seller.storeBanner}')` } : {}}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        
        {/* Navigation Breadcrumb inside banner */}
        <div className="max-w-container-max mx-auto px-base lg:px-xl pt-md flex justify-between items-center relative z-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-xs px-md py-sm bg-white/20 hover:bg-white/30 text-white backdrop-blur-md text-label-bold font-bold rounded hover:opacity-90 transition-all cursor-pointer shadow-xs border border-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Catalog</span>
          </Link>

          {isSellerVerified && (
            <div className="inline-flex items-center gap-xs px-md py-sm bg-emerald-500 text-white text-xs font-bold rounded-full shadow-xs border border-emerald-400/30">
              <BadgeCheck className="w-4 h-4" />
              <span>Verified Merchant</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Profile & Content Wrapper */}
      <div className="max-w-container-max mx-auto px-base lg:px-xl -mt-12 sm:-mt-16 relative z-20 space-y-lg">
        
        {/* 2. Seller Profile Card */}
        <div className="bg-white rounded-lg p-base sm:p-lg border border-border-gray shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-base">
          {/* Avatar and Main Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-md sm:gap-lg w-full md:w-auto">
            {/* Store Logo / Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary text-on-primary rounded-lg flex items-center justify-center text-3xl font-extrabold font-headline-md border-2 border-border-gray shadow-sm shrink-0 overflow-hidden">
              {seller.storeLogo ? (
                <img
                  src={seller.storeLogo}
                  alt={storeDisplayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                storeDisplayName.charAt(0).toUpperCase()
              )}
            </div>

            {/* Store Title & Badges */}
            <div className="space-y-xs flex-1">
              <div className="flex items-center gap-xs flex-wrap">
                <h1 className="font-headline-md text-headline-md text-primary font-bold">
                  {storeDisplayName}
                </h1>
                {isSellerVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>Verified Boutique</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase">
                    <span>Identity Under Review</span>
                  </span>
                )}
              </div>

              {/* Subtitle Details */}
              <div className="flex flex-wrap items-center gap-x-md gap-y-1 text-body-sm text-on-surface-variant font-semibold">
                <span className="flex items-center gap-xs">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{seller.city}, India</span>
                </span>
                <span className="hidden sm:inline text-border-gray">&bull;</span>
                <span className="flex items-center gap-xs">
                  <Store className="w-3.5 h-3.5 text-primary" />
                  <span>{seller.category}</span>
                </span>
                <span className="hidden sm:inline text-border-gray">&bull;</span>
                <span className="flex items-center gap-xs">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Member since {joinedYear}</span>
                </span>
              </div>
            </div>
          </div>

          {/* 3. Quick Store Statistics Panel */}
          <div className="w-full md:w-auto grid grid-cols-3 sm:flex items-center justify-around gap-md p-md bg-surface-container-low border border-border-gray/60 rounded-lg">
            <div className="text-center sm:px-3">
              <span className="font-headline-sm text-headline-sm font-bold text-primary block">
                {formattedProducts.length}
              </span>
              <span className="font-label-bold text-[10px] text-text-muted uppercase tracking-wider block mt-0.5">
                Products
              </span>
            </div>

            <div className="w-px h-8 bg-border-gray hidden sm:block" />

            <div className="text-center sm:px-3">
              <span className="font-headline-sm text-headline-sm font-bold text-success-green block">
                {seller.verification?.trustScore || 95}%
              </span>
              <span className="font-label-bold text-[10px] text-text-muted uppercase tracking-wider block mt-0.5">
                Trust Score
              </span>
            </div>

            <div className="w-px h-8 bg-border-gray hidden sm:block" />

            <div className="text-center sm:px-3">
              <span className="font-headline-sm text-headline-sm font-bold text-primary block flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-accent-yellow text-accent-yellow" />
                <span>{reviewSummary.averageRating > 0 ? reviewSummary.averageRating.toFixed(1) : "5.0"}</span>
              </span>
              <span className="font-label-bold text-[10px] text-text-muted uppercase tracking-wider block mt-0.5">
                {reviewSummary.reviewCount} Reviews
              </span>
            </div>
          </div>
        </div>

        {/* 4. Action Buttons Bar */}
        <div className="bg-white p-base rounded-lg border border-border-gray shadow-xs flex flex-wrap items-center justify-between gap-md">
          <div className="flex items-center gap-md w-full sm:w-auto">
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`flex-1 sm:flex-none px-lg py-md rounded-lg font-label-bold text-label-bold flex items-center justify-center gap-xs transition-all cursor-pointer ${
                isFollowing
                  ? "bg-surface-container text-on-surface border border-border-gray hover:bg-surface-container-high"
                  : "bg-primary text-on-primary hover:opacity-90 active:scale-[0.98] shadow-xs"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFollowing ? "fill-primary text-primary" : ""}`} />
              <span>{isFollowing ? "Following Store" : "Follow Store"}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-lg py-md rounded-lg bg-white border border-outline-variant text-on-surface font-label-bold text-label-bold hover:bg-surface-container transition-all flex items-center justify-center gap-xs cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-success-green" />
                  <span className="text-success-green">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-secondary" />
                  <span>Share Store</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-xs px-md py-sm bg-indigo-50 border border-indigo-100 rounded text-indigo-700 text-body-sm font-bold">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Escrow Payment Protection Active</span>
          </div>
        </div>

        {/* 5. About Brand Card */}
        {seller.storeDescription && (
          <div className="bg-white p-base sm:p-md rounded-lg border border-border-gray shadow-xs space-y-xs">
            <h3 className="font-headline-sm text-headline-sm text-primary font-bold flex items-center gap-xs">
              <Building2 className="w-4 h-4 text-primary" />
              <span>About {storeDisplayName}</span>
            </h3>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              {seller.storeDescription}
            </p>
          </div>
        )}

        {/* 6. Featured Trust Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
          <div className="p-base bg-white rounded-lg border border-border-gray shadow-xs flex items-center gap-md">
            <div className="w-10 h-10 bg-success-green/10 text-success-green rounded-lg flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-body-sm text-on-surface">KYC Verified</h4>
              <p className="text-[11px] text-text-muted mt-0.5">Government ID Checked</p>
            </div>
          </div>

          <div className="p-base bg-white rounded-lg border border-border-gray shadow-xs flex items-center gap-md">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-body-sm text-on-surface">Escrow Protection</h4>
              <p className="text-[11px] text-text-muted mt-0.5">Payment Released on Delivery</p>
            </div>
          </div>

          <div className="p-base bg-white rounded-lg border border-border-gray shadow-xs flex items-center gap-md">
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-body-sm text-on-surface">Local Dispatch</h4>
              <p className="text-[11px] text-text-muted mt-0.5">Ships from {seller.city}</p>
            </div>
          </div>

          <div className="p-base bg-white rounded-lg border border-border-gray shadow-xs flex items-center gap-md">
            <div className="w-10 h-10 bg-accent-yellow/20 text-primary rounded-lg flex items-center justify-center shrink-0">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-body-sm text-on-surface">Buyer Guarantee</h4>
              <p className="text-[11px] text-text-muted mt-0.5">7-Day Easy Return</p>
            </div>
          </div>
        </div>

        {/* 7 & 8. Product Navigation & Product Grid Section */}
        <div className="bg-white rounded-lg p-base sm:p-lg border border-border-gray shadow-sm space-y-md">
          {/* Header & Filter Bar matching Buyer Catalog */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md border-b border-border-gray/60 pb-md">
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-primary">
                Store Collection
              </h2>
              <p className="text-body-sm text-text-muted mt-0.5">
                Handpicked designs & artisanal collections from {storeDisplayName}
              </p>
            </div>

            {/* Category Filter Pills matching Velvet Lane theme */}
            {categories.length > 0 && (
              <div className="flex items-center gap-xs overflow-x-auto max-w-full pb-1">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-md py-xs rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === "all"
                      ? "bg-primary text-on-primary shadow-xs"
                      : "bg-surface-container-low text-text-muted hover:bg-surface-container"
                  }`}
                >
                  All Products ({formattedProducts.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-md py-xs rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-primary text-on-primary shadow-xs"
                        : "bg-surface-container-low text-text-muted hover:bg-surface-container"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Grid Render */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-xl border border-dashed border-border-gray rounded-lg bg-surface-container-low max-w-md mx-auto shadow-xs">
              <div className="w-12 h-12 bg-surface-container text-text-muted rounded-full flex items-center justify-center mx-auto mb-md border border-border-gray">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-body-md text-on-surface">No Products Found</h3>
              <p className="text-body-sm text-text-muted mt-0.5">
                {selectedCategory !== "all"
                  ? `No items currently listed under category "${selectedCategory}".`
                  : "This seller hasn't published any items in their store yet."}
              </p>
            </div>
          ) : (
            <ProductGrid products={filteredProducts} />
          )}
        </div>

        {/* 9. Reviews Section matching Buyer Reviews Gallery */}
        <div className="bg-white rounded-lg p-base sm:p-lg border border-border-gray shadow-sm space-y-md">
          <div className="border-b border-border-gray/60 pb-md">
            <h2 className="font-headline-md text-headline-md font-bold text-primary">
              Boutique Customer Reviews
            </h2>
            <p className="text-body-sm text-text-muted mt-0.5">Verified buyer feedback and ratings for {storeDisplayName}</p>
          </div>

          <ReviewGallery
            sellerId={seller.id}
            initialSummary={reviewSummary}
            initialReviews={formattedInitialReviews}
          />
        </div>

        {/* 10. Store Policies & Information Cards */}
        <div className="bg-white rounded-lg p-base sm:p-lg border border-border-gray shadow-sm grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="space-y-xs">
            <h3 className="font-label-bold text-label-bold text-primary uppercase tracking-wider flex items-center gap-xs">
              <Store className="w-4 h-4 text-primary" />
              <span>About {storeDisplayName}</span>
            </h3>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              {seller.storeDescription || `${storeDisplayName} is a verified fashion boutique based in ${seller.city}, specializing in ${seller.category}.`}
            </p>
          </div>

          <div className="space-y-xs">
            <h3 className="font-label-bold text-label-bold text-primary uppercase tracking-wider flex items-center gap-xs">
              <Truck className="w-4 h-4 text-primary" />
              <span>Shipping & Dispatch</span>
            </h3>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              Orders are packaged securely and dispatched directly from {seller.city}. Tracking numbers are provided upon fulfillment.
            </p>
          </div>

          <div className="space-y-xs">
            <h3 className="font-label-bold text-label-bold text-primary uppercase tracking-wider flex items-center gap-xs">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Escrow Protection</span>
            </h3>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              Payments are held in Escrow until delivery is confirmed by the buyer. 7-day easy returns supported for quality assurance.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
