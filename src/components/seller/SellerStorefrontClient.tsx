"use client";

import React, { useState } from "react";

import StorefrontIdentity from "./StorefrontIdentity";
import StorefrontActions from "./StorefrontActions";
import StorefrontStickyNav from "./StorefrontStickyNav";
import StorefrontShop from "./StorefrontShop";
import StorefrontReviews from "./StorefrontReviews";
import StorefrontAbout from "./StorefrontAbout";
import StorefrontAssurance from "./StorefrontAssurance";
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
  joinedYear: _joinedYear,
  formattedProducts,
  reviewSummary,
  formattedInitialReviews,
}: SellerStorefrontClientProps) {
  const [activeTab, setActiveTab] = useState<string>("shop");
  const [isFollowing, setIsFollowing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const storeDisplayName = seller.storeName || seller.businessName;
  void _joinedYear;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const categories = Array.from(
    new Set(formattedProducts.map((p) => p.category).filter(Boolean))
  );

  const filteredProducts = formattedProducts.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="bg-vl-surface pb-20 text-vl-ink font-sans">
      <div className="pt-6">
        {/* 1. Store Identity Hero — 55/45 editorial */}
        <div className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8">
          <StorefrontIdentity
            seller={seller}
            isSellerVerified={isSellerVerified}
            averageRating={reviewSummary.averageRating}
            reviewCount={reviewSummary.reviewCount}
            productsCount={formattedProducts.length}
          />
        </div>

        {/* 2. Compact Store Actions — Follow primary, Share secondary */}
        <div className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 mt-5">
          <StorefrontActions
            isFollowing={isFollowing}
            onToggleFollow={() => setIsFollowing(!isFollowing)}
            copiedLink={copiedLink}
            onCopyLink={handleCopyLink}
          />
        </div>
      </div>

      {/* 3. Sticky Store Navigation — Shop / Reviews / About with Observer */}
      <div className="mt-6">
        <StorefrontStickyNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          reviewCount={reviewSummary.reviewCount}
        />
      </div>

      {/* Content sections */}
      <div className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
        {/* 4. Shop Section — primary */}
        <section id="storefront-shop" className="scroll-mt-[140px]">
          <StorefrontShop
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            products={formattedProducts}
            filteredProducts={filteredProducts}
            storeDisplayName={storeDisplayName}
          />
        </section>

        {/* 5. Customer Reviews — calm social proof */}
        <section id="storefront-reviews" className="scroll-mt-[140px]">
          <StorefrontReviews
            sellerId={seller.id}
            reviewSummary={reviewSummary}
            formattedInitialReviews={formattedInitialReviews}
            storeDisplayName={storeDisplayName}
          />
        </section>

        {/* 6. About the Store — concise, no fake founder */}
        <section id="storefront-about" className="scroll-mt-[140px]">
          <StorefrontAbout
            storeDisplayName={storeDisplayName}
            city={seller.city}
            description={seller.storeDescription}
            storeBanner={seller.storeBanner}
          />
        </section>

        {/* 7. Shopping Assurance — compact strip */}
        <StorefrontAssurance city={seller.city} />

        {/* 8. Related Stores — only if data exists, currently reuse recommendations */}
        <StorefrontRecommendations products={formattedProducts} />
      </div>
    </div>
  );
}
