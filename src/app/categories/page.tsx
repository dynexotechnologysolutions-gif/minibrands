import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HomeHeader from "@/components/home/HomeHeader";
import MobileBottomNavigation from "@/components/mobile/MobileBottomNavigation";
import CategoryFeaturedGrid from "@/components/categories/CategoryFeaturedGrid";
import CategoryPopularList from "@/components/categories/CategoryPopularList";
import CategoryDiscoveryBanner from "@/components/categories/CategoryDiscoveryBanner";
import CategoryPopularSearches from "@/components/categories/CategoryPopularSearches";
import { getUserReservations } from "@/lib/redis";
import { getRequestSessionAndProfile } from "@/lib/request-auth";

import { getCanonicalUrl } from "@/lib/seo/url";

export const dynamic = "force-dynamic";

const title = "Categories | MiniBrands";
const description =
  "Explore curated fashion items from trusted boutique stores by category: ethnic wear, streetwear, accessories, and handloom.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: getCanonicalUrl("/categories"),
  },
  openGraph: {
    title,
    description,
    url: getCanonicalUrl("/categories"),
    siteName: "MiniBrands",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function CategoriesPage() {
  const { userProfile, sellerHref } = await getRequestSessionAndProfile();

  let cartCount = 0;
  if (userProfile) {
    const reservations = await getUserReservations(userProfile.id);
    cartCount = reservations.reduce((acc, curr) => acc + curr.quantity, 0);
  }

  return (
    <div className="min-h-screen w-full bg-white font-sans text-slate-800 pb-24 md:pb-0">
      <HomeHeader userProfile={userProfile} cartCount={cartCount} sellerHref={sellerHref} />
      <main className="pt-[108px] md:pt-24 max-w-[1280px] mx-auto px-4 md:px-8">
        {/* PAGE TITLE */}
        <div className="mt-7 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-vl-heading text-2xl font-extrabold tracking-[-0.04em] text-vl-ink sm:text-3xl">
              Categories
            </h1>
            <p className="mt-1 text-sm text-vl-muted">
              Explore products from trusted stores
            </p>
          </div>
          <Link
            href="/products"
            className="hidden shrink-0 items-center gap-1.5 rounded-vl-control px-3 py-2 text-sm font-semibold text-vl-primary transition hover:bg-vl-card md:inline-flex"
          >
            View All Categories
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>

        {/* FEATURED CATEGORIES */}
        <section className="mt-8 sm:mt-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-[#222222] sm:text-2xl">
              Explore Categories
            </h2>
          </div>
          <CategoryFeaturedGrid />
        </section>
        {/* POPULAR SUBCATEGORIES */}
        <section className="mt-8 sm:mt-10">
          <h2 className="text-xl font-bold tracking-tight text-[#222222] sm:text-2xl">
            Popular Categories
          </h2>
          <CategoryPopularList />
        </section>

        {/* DISCOVERY BANNER */}
        <div className="mt-8 sm:mt-10">
          <CategoryDiscoveryBanner />
        </div>

        {/* POPULAR SEARCHES */}
        <section className="mt-8 pb-6 sm:mt-10 sm:pb-8">
          <h2 className="text-xl font-bold tracking-tight text-[#222222] sm:text-2xl">
            Popular Searches
          </h2>
          <CategoryPopularSearches />
        </section>
      </main>
      <MobileBottomNavigation userProfile={userProfile} cartCount={cartCount} />
    </div>
  );
}