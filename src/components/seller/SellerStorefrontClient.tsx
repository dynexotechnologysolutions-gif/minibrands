"use client";

import React, { useState } from "react";
import ProductGrid from "@/components/product/ProductGrid";
import { Heart, Share2, Check, ShieldCheck } from "lucide-react";

import StorefrontHero from "./StorefrontHero";
import StorefrontHeader from "./StorefrontHeader";
import StorefrontFeaturedHero from "./StorefrontFeaturedHero";
import StorefrontHighlights from "./StorefrontHighlights";
import StorefrontStickyNav from "./StorefrontStickyNav";
import StorefrontStory from "./StorefrontStory";
import StorefrontCollections from "./StorefrontCollections";
import StorefrontTrustGrid from "./StorefrontTrustGrid";
import StorefrontReviews from "./StorefrontReviews";
import StorefrontRecommendations from "./StorefrontRecommendations";

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
    userProfile: {
      user: {
        name: string;
        image: string | null;
      };
    };
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
  const [activeTab, setActiveTab] = useState<string>("products");
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

  // Extract unique categories from products
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
    <div className="bg-vl-surface min-h-screen pb-20 text-vl-ink font-sans">
      {/* 1. Luxury Cover Hero */}
      <StorefrontHero
        bannerUrl={seller.storeBanner || null}
        storeName={storeDisplayName}
        isSellerVerified={isSellerVerified}
      />

      {/* Main Profile & Content Wrapper */}
      <div className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative z-20 space-y-8">
        {/* 2. Boutique Profile Header */}
        <StorefrontHeader
          seller={seller}
          isSellerVerified={isSellerVerified}
          joinedYear={joinedYear}
          productsCount={formattedProducts.length}
          averageRating={reviewSummary.averageRating}
          reviewCount={reviewSummary.reviewCount}
        />

        {/* 3. Action Buttons & Escrow Notice */}
        <div className="bg-vl-card p-4 rounded-vl-card border border-vl-border shadow-vl-soft flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`flex-1 sm:flex-none h-11 px-6 rounded-vl-control font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isFollowing
                  ? "bg-vl-border text-vl-ink border border-vl-border hover:bg-vl-border/80"
                  : "bg-vl-primary text-white hover:bg-vl-primary-strong active:scale-[0.98] shadow-sm"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFollowing ? "fill-white text-white" : ""}`} />
              <span>{isFollowing ? "Following Label" : "Follow Label"}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="h-11 px-6 rounded-vl-control bg-vl-card border border-vl-border text-vl-ink font-bold text-xs hover:bg-vl-surface transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-vl-success" />
                  <span className="text-vl-success">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-vl-secondary" />
                  <span>Share Store</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-vl-control text-indigo-700 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Escrow Payment Protection Active</span>
          </div>
        </div>

        {/* 4. Brand Highlight Chips */}
        <StorefrontHighlights category={seller.category} sellerId={seller.id} />
      </div>

      {/* 5. Sticky Profile Navigation Tabs */}
      <div className="mt-8">
        <StorefrontStickyNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          reviewCount={reviewSummary.reviewCount}
        />
      </div>

      {/* Tab target content wrappers */}
      <div className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-16">
        
        {/* ── Tab: Products ────────────────────────────────────────────── */}
        <div id="storefront-products" className="space-y-8 scroll-mt-28">
          {/* Signature Featured Showcase */}
          <StorefrontFeaturedHero
            products={formattedProducts}
            storeDisplayName={storeDisplayName}
          />

          {/* Curated Collection Lookbooks */}
          <StorefrontCollections
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            productsCount={formattedProducts.length}
          />

          {/* General Catalog Grid */}
          <div className="space-y-4">
            <div className="border-b border-vl-border/60 pb-4">
              <h3 className="font-vl-heading text-lg font-bold tracking-tight text-vl-ink">
                General Catalog Feed
              </h3>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-vl-border rounded-vl-card bg-vl-card max-w-md mx-auto shadow-vl-soft">
                <h4 className="font-bold text-sm text-vl-ink">No Products Listed</h4>
                <p className="text-xs text-vl-muted mt-1">
                  This seller doesn&rsquo;t have any items under the selected collection category.
                </p>
              </div>
            ) : (
              <ProductGrid products={filteredProducts} />
            )}
          </div>
        </div>

        {/* ── Tab: Reviews ─────────────────────────────────────────────── */}
        <div id="storefront-reviews" className="scroll-mt-28">
          <StorefrontReviews
            sellerId={seller.id}
            reviewSummary={reviewSummary}
            formattedInitialReviews={formattedInitialReviews}
            storeDisplayName={storeDisplayName}
          />
        </div>

        {/* ── Tab: Story & Policies ────────────────────────────────────── */}
        <div id="storefront-story" className="space-y-12 scroll-mt-28">
          {/* Story & Founder Bio */}
          <StorefrontStory
            storeDisplayName={storeDisplayName}
            city={seller.city}
            founderName={seller.userProfile.user.name}
            sellerId={seller.id}
          />

          {/* Trust Policies Grid */}
          <StorefrontTrustGrid
            city={seller.city}
            storeDisplayName={storeDisplayName}
          />
        </div>

        {/* ── Footer Recommendations Carousel ─────────────────────────── */}
        <StorefrontRecommendations products={formattedProducts} />

      </div>
    </div>
  );
}
