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
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getUserReservations } from "@/lib/redis";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories | MINIBRANDS",
  description:
    "Explore products from trusted stores by category. Home decor, kitchen, spiritual, bottles, beauty, wellness, fashion and more.",
};

export default async function CategoriesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  let userProfile = null;
  let cartCount = 0;
  let sellerHref = "/login?role=seller";

  if (session?.user) {
    userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true, seller: { include: { verification: true } }, addresses: { where: { isDeleted: false } } },
    });

    if (userProfile?.role === "SELLER") {
      const ver = userProfile.seller?.verification;
      const isVerified = ver && (ver.kycStatus === "auto_approved" || ver.kycStatus === "approved") && ver.bankVerified;
      sellerHref = isVerified ? "/seller/dashboard" : "/seller/onboarding";
    }

    if (userProfile) {
      const reservations = await getUserReservations(userProfile.id);
      cartCount = reservations.reduce((acc, curr) => acc + curr.quantity, 0);
    }
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