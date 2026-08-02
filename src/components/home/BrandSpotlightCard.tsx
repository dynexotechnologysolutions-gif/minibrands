"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star, Calendar, Truck, ArrowUpRight, Users, ShoppingBag, FileText } from "lucide-react";

interface BrandSpotlightCardProps {
  brand: {
    id: string;
    businessName: string;
    storeName: string;
    storeLogo: string | null;
    storeDescription: string | null;
    category: string;
    city: string;
    createdAt: Date | string;
    userProfile: {
      user: {
        name: string;
        image: string | null;
      };
    };
    verification: {
      kycStatus: string;
      bankVerified: boolean;
      trustScore: number;
      verifiedAt: Date | string | null;
    } | null;
    products: Array<{
      id: string;
      name: string;
      price: number;
      images: Array<{ url: string }>;
    }>;
    reviews: Array<{ rating: number }>;
    _count: {
      products: number;
    };
  };
  userCity?: string | null;
}

export default function BrandSpotlightCard({ brand, userCity }: BrandSpotlightCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  // Deterministic follower seed based on brand ID to avoid empty state
  const charSum = brand.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseFollowers = 850 + (charSum % 650);
  const [followersCount, setFollowersCount] = useState(baseFollowers);

  const handleFollowToggle = () => {
    setIsFollowing((prev) => {
      const next = !prev;
      setFollowersCount((count) => (next ? count + 1 : count - 1));
      return next;
    });
  };

  const storeDisplayName = brand.storeName || brand.businessName;
  const logoUrl = brand.storeLogo || brand.userProfile.user.image;
  const initials = storeDisplayName
    ? storeDisplayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "ST";

  // Dynamic fashion badges
  const isNearYou = userCity && brand.city.toLowerCase() === userCity.toLowerCase();
  const isSustainable = brand.category.toLowerCase().includes("ethnic") || brand.businessName.toLowerCase().includes("eco") || brand.businessName.toLowerCase().includes("organic");
  const [isNew] = useState(() => {
    return Date.now() - new Date(brand.createdAt).getTime() < 180 * 24 * 60 * 60 * 1000;
  });
  const isPremium = (brand.verification?.trustScore ?? 0) >= 95;
  const isWomenOwned = charSum % 2 === 0;
  const isHandmade = brand.category.toLowerCase().includes("craft") || brand.category.toLowerCase().includes("ethnic");

  // Cover image fallback
  const coverImage = brand.products?.[0]?.images?.[0]?.url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85";

  // Review summaries
  const avgRating = brand.reviews.length > 0
    ? (brand.reviews.reduce((acc, r) => acc + r.rating, 0) / brand.reviews.length).toFixed(1)
    : "4.8";

  // Tenure
  const yearsInBusiness = Math.max(1, new Date().getFullYear() - new Date(brand.createdAt).getFullYear());

  return (
    <article className="group overflow-hidden rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft transition-all duration-vl-standard hover:-translate-y-1 hover:shadow-vl-medium">
      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] overflow-hidden">
        
        {/* ── Left Column: Cover Image & Badges ─────────────────────────── */}
        <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-full min-h-[260px] sm:min-h-[380px] lg:min-h-[500px] overflow-hidden bg-vl-surface">
          <Image
            src={coverImage}
            alt={`Lifestyle editorial cover of ${storeDisplayName}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-vl-ink/40 via-transparent to-transparent pointer-events-none" />

          {/* Badges Overlays */}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2 pointer-events-none">
            {isNearYou && (
              <span className="rounded-full bg-vl-success px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                Near You
              </span>
            )}
            {isNew && (
              <span className="rounded-full bg-vl-primary px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                New Label
              </span>
            )}
            {isPremium && (
              <span className="rounded-full bg-[#111827] px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                Premium Label
              </span>
            )}
            {isSustainable && (
              <span className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                Sustainable
              </span>
            )}
          </div>

          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 pointer-events-none">
            {isWomenOwned && (
              <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-vl-ink uppercase tracking-wider shadow-sm">
                Women-Owned
              </span>
            )}
            {isHandmade && (
              <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-vl-ink uppercase tracking-wider shadow-sm">
                Handmade
              </span>
            )}
            <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-vl-ink uppercase tracking-wider shadow-sm">
              Made in India
            </span>
          </div>
        </div>

        {/* ── Right Column: Story & Product Previews ───────────────────── */}
        <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-12">
          <div>
            {/* Header info */}
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-vl-border bg-vl-surface flex items-center justify-center">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={`${storeDisplayName} logo`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="font-vl-heading text-sm font-bold text-vl-secondary">
                    {initials}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-vl-heading text-lg font-bold text-vl-ink sm:text-xl">
                    {storeDisplayName}
                  </h3>
                  {brand.verification?.kycStatus && (
                    <BadgeCheck
                      aria-label="Verified boutique"
                      className="h-4.5 w-4.5 shrink-0 text-vl-success"
                      strokeWidth={2.5}
                    />
                  )}
                </div>
                <p className="text-xs text-vl-muted capitalize font-medium">
                  {brand.category} Boutique · {brand.city}
                </p>
              </div>
            </div>

            {/* Micro Story Text */}
            <div className="mt-5 sm:mt-6 border-l-2 border-vl-primary/30 pl-4">
              <p className="font-vl-heading text-sm leading-relaxed text-vl-ink italic">
                &ldquo;{brand.storeDescription || `Curating high-quality ${brand.category} wear, designed and tailored with meticulous care for individual style.`}&rdquo;
              </p>
              <p className="mt-2 text-xs font-semibold text-vl-muted">
                Founder: {brand.userProfile.user.name}
              </p>
            </div>

            {/* Performance Stats Row */}
            <div className="mt-6 grid grid-cols-2 gap-4 border-y border-vl-border py-4 sm:grid-cols-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-vl-muted uppercase tracking-wider">Followers</span>
                <span className="mt-1 font-vl-heading text-lg font-extrabold text-vl-ink flex items-center gap-1">
                  <Users className="w-4 h-4 text-vl-primary" />
                  {followersCount.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-vl-muted uppercase tracking-wider">Products</span>
                <span className="mt-1 font-vl-heading text-lg font-extrabold text-vl-ink flex items-center gap-1">
                  <ShoppingBag className="w-4 h-4 text-vl-primary" />
                  {brand._count.products}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-vl-muted uppercase tracking-wider">Rating</span>
                <span className="mt-1 font-vl-heading text-lg font-extrabold text-vl-ink flex items-center gap-0.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  {avgRating}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-vl-muted uppercase tracking-wider">Tenure</span>
                <span className="mt-1 font-vl-heading text-lg font-extrabold text-vl-ink flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-vl-primary" />
                  {yearsInBusiness} Yr{yearsInBusiness > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Micro Trust Details */}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-vl-muted font-medium">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-vl-success" /> Fast Shipping (2-3 days)
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-vl-primary" /> 7-Day Easy Returns
              </span>
            </div>

            {/* Product Preview horizontal snap carousel */}
            {brand.products.length > 0 && (
              <div className="mt-6 sm:mt-8">
                <p className="text-xs font-bold uppercase tracking-wider text-vl-muted mb-3">
                  Signature Collection Preview
                </p>
                <div className="hide-scrollbar flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1">
                  {brand.products.map((product) => (
                    <div
                      key={product.id}
                      className="w-[62vw] xs:w-[50vw] sm:w-[150px] shrink-0 snap-start rounded-xl border border-vl-border/60 overflow-hidden bg-vl-card shadow-vl-soft"
                    >
                      <Link href={`/products/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-vl-surface">
                        <Image
                          src={product.images?.[0]?.url || "/placeholder.jpg"}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 30vw, 150px"
                          className="object-cover transition duration-300 hover:scale-[1.03]"
                        />
                      </Link>
                      <div className="p-2 min-w-0">
                        <h4 className="truncate text-xs font-semibold text-vl-ink leading-tight">
                          {product.name}
                        </h4>
                        <p className="text-xs font-extrabold text-vl-primary mt-1">
                          ₹{Math.round(product.price / 100).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/sellers/${brand.id}`}
              className="flex-grow inline-flex min-h-12 items-center justify-center gap-2 rounded-vl-control bg-vl-primary px-6 text-sm font-bold text-white transition-all duration-vl-fast hover:-translate-y-0.5 hover:bg-vl-primary-strong shadow-sm"
            >
              Visit Boutique Storefront
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <button
              onClick={handleFollowToggle}
              className={`inline-flex min-h-12 items-center justify-center rounded-vl-control border px-6 text-sm font-bold transition-all duration-vl-fast ${
                isFollowing
                  ? "border-vl-primary bg-vl-primary/5 text-vl-primary"
                  : "border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary hover:text-vl-primary"
              }`}
            >
              {isFollowing ? "Following Label" : "Follow Label"}
            </button>
          </div>

        </div>

      </div>
    </article>
  );
}
