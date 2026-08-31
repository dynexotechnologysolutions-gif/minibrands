import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getUserReservations, redis } from "@/lib/redis";
import { getRequestSessionAndProfile } from "@/lib/request-auth";
import HomeHeader from "@/components/home/HomeHeader";
import HomeStoreRow from "@/components/home/HomeStoreRow";
import HomeHero from "@/components/home/HomeHero";
import HomeCategoryGrid from "@/components/home/HomeCategoryGrid";
import HomeEditorialCollections from "@/components/home/HomeEditorialCollections";

import HomeInspiration from "@/components/home/HomeInspiration";
import HomeNewsletter from "@/components/home/HomeNewsletter";
import HomeProductSection from "@/components/home/HomeProductSection";
import HomeFeaturedCollections from "@/components/home/HomeFeaturedCollections";
import HomeWhyShopWithVelvet from "@/components/home/HomeWhyShopWithVelvet";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";

import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MiniBrands | Chennai's Fashion-Forward Local Marketplace",
  description:
    "Discover verified independent fashion sellers in Chennai. Ethnic wear, streetwear, handlooms, and accessories — with KYC-verified boutiques and escrow payment safety.",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const getCachedFeaturedSellers = unstable_cache(
  async () => {
    return prisma.seller.findMany({
      where: {
        verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true },
        products: { some: { isPublished: true, isDeleted: false } },
      },
      include: {
        userProfile: { include: { user: true } },
        verification: true,
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  },
  ["home-featured-sellers"],
  { revalidate: 60, tags: ["sellers", "home"] }
);

const getCachedRecentProducts = unstable_cache(
  async () => {
    return prisma.product.findMany({
      where: {
        isDeleted: false,
        isPublished: true,
        seller: {
          verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true },
        },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        seller: { include: { verification: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
  },
  ["home-recent-products"],
  { revalidate: 60, tags: ["products", "home"] }
);

const getCachedTrendingCount = unstable_cache(
  async () => {
    return prisma.product.count({
      where: {
        isDeleted: false,
        isPublished: true,
        seller: {
          verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true },
        },
      },
    });
  },
  ["home-trending-count"],
  { revalidate: 60, tags: ["products", "home"] }
);

const getCachedNearbyStores = unstable_cache(
  async () => {
    return prisma.seller.findMany({
      where: {
        verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true },
        products: { some: { isPublished: true, isDeleted: false } },
      },
      include: {
        userProfile: { include: { user: true } },
        verification: true,
        reviews: true,
        products: {
          where: { isPublished: true, isDeleted: false },
          include: { images: { orderBy: { sortOrder: "asc" } } },
          take: 1,
        },
      },
      orderBy: [{ verification: { trustScore: "desc" } }, { createdAt: "desc" }],
      take: 10,
    });
  },
  ["home-nearby-stores"],
  { revalidate: 60, tags: ["sellers", "home"] }
);

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const itemsPerPage = 8;

  const { session, userProfile, sellerHref } = await getRequestSessionAndProfile();

  const [
    allReservations,
    rawWishlistIds,
    featuredSellers,
    recentProducts,
    trendingCount,
    pagedTrendingProducts,
    nearbyStores,
  ] = await Promise.all([
    userProfile ? getUserReservations(userProfile.id) : Promise.resolve([]),
    userProfile ? redis.smembers(`wishlist:${userProfile.id}`) : Promise.resolve([]),
    getCachedFeaturedSellers(),
    getCachedRecentProducts(),
    getCachedTrendingCount(),
    currentPage > 1
      ? prisma.product.findMany({
          where: {
            isDeleted: false,
            isPublished: true,
            seller: {
              verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true },
            },
          },
          include: {
            images: { orderBy: { sortOrder: "asc" } },
            variants: true,
            seller: { include: { verification: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (currentPage - 1) * itemsPerPage,
          take: itemsPerPage,
        })
      : Promise.resolve(null),
    getCachedNearbyStores(),
  ]);

  const trendingProducts = pagedTrendingProducts || recentProducts.slice(0, itemsPerPage);
  const newArrivalsProducts = recentProducts.slice(0, 8);
  const trendingProductsSection = recentProducts.slice(0, 8);
  const suggestedProducts = recentProducts.slice(2, 6);

  const cartCount = allReservations.reduce((acc, curr) => acc + curr.quantity, 0);
  const wishlistIds: string[] = rawWishlistIds || [];


  const totalPages = Math.ceil(trendingCount / itemsPerPage);
  const shapeSeller = (seller: (typeof featuredSellers)[number]) => ({ id: seller.id, businessName: seller.businessName, category: seller.category, logoUrl: seller.storeLogo || null });
  const mockSellers = [
    { id: "mock-store-1", businessName: "TechHaven", category: "Electronics", logoUrl: null },
    { id: "mock-store-2", businessName: "Aura Wear", category: "Fashion", logoUrl: null },
    { id: "mock-store-3", businessName: "Nest Living", category: "Home", logoUrl: null },
    { id: "mock-store-4", businessName: "Apex Gear", category: "Sports", logoUrl: null },
    { id: "mock-store-5", businessName: "GlowUp", category: "Beauty", logoUrl: null },
  ];
  const allSellers = [...featuredSellers.map(shapeSeller), ...mockSellers];

  const productCard = (product: Parameters<typeof ProductCard>[0]["product"]) => (
    <ProductCard
      key={product.id}
      product={product}
      isLoggedIn={!!session?.user}
      isWishlisted={wishlistIds.includes(product.id)}
    />
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-vl-surface font-vl-body text-vl-ink">
      <HomeHeader userProfile={userProfile} cartCount={cartCount} sellerHref={sellerHref} />
      <main className="pb-[76px] md:pb-0 pt-[108px] md:pt-0">
        {/* 1. Category Ribbon */}
        <HomeCategoryGrid />

        {/* 2. Hero Section */}
        <HomeHero />

        {/* 3. Top Stores For You */}
        {allSellers.length > 0 ? <HomeStoreRow sellers={allSellers} /> : null}

        {/* 4. Best Selling Products */}
        {trendingProducts.length > 0 ? (
          <section className="vl-section-shell mt-6 sm:mt-12 font-sans">
            <div className="flex items-end justify-between gap-4 px-2 md:px-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#222222]">Best Selling Products</h2>
              </div>
              <Link href="/products" className="text-sm font-semibold text-[#0F7F7F] hover:underline">
                View All
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 px-2 md:px-4">
              {trendingProducts.slice(0, 4).map(productCard)}
            </div>
            {currentPage < totalPages ? (
              <div className="mt-8 flex justify-center hidden md:flex">
                <Link
                  href={`/?page=${currentPage + 1}`}
                  className="inline-flex min-h-11 items-center rounded-vl-control border border-vl-border bg-vl-card px-5 text-sm font-semibold text-vl-ink transition hover:border-vl-primary hover:text-vl-primary"
                >
                  Load more
                </Link>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* 4.3 Trending Products */}
        <HomeProductSection
            title="Trending Products"
            products={trendingProductsSection}
            href="/products?sort=trending"
            isLoggedIn={!!session?.user}
            wishlistIds={wishlistIds}
            hideTitleOnMobile
        />

        {/* 5. New Arrivals */}
        <HomeProductSection
            title="New Arrivals"
            products={newArrivalsProducts}
            href="/products?sort=newest"
            isLoggedIn={!!session?.user}
            wishlistIds={wishlistIds}
        />

        {/* 6. Desktop-Only Secondary Sections */}
        <div className="hidden md:block">
          <HomeEditorialCollections />

          {suggestedProducts.length > 0 ? <section className="vl-section-shell mt-16 sm:mt-24"><div className="flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">New arrivals</p><h2 className="font-vl-heading text-2xl font-bold tracking-[-0.04em] text-vl-ink sm:text-3xl">Fresh from the labels</h2></div><Link href="/products?sort=newest" className="hidden rounded-vl-control px-3 py-2 text-sm font-semibold text-vl-muted transition hover:bg-vl-card hover:text-vl-primary sm:inline-flex">See newness</Link></div><div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">{suggestedProducts.map(productCard)}</div></section> : null}
          <HomeInspiration />
        </div>

        {/* 7. Curated Collections - hidden on mobile */}
        <div className="hidden sm:block">
          <HomeFeaturedCollections />
        </div>

        {/* 8. Why Shop With MiniBrands? - hidden on mobile */}
        <div className="hidden sm:block">
          <HomeWhyShopWithVelvet />
        </div>

        {/* 9. Newsletter - hidden on mobile */}
        <div className="hidden sm:block">
          <HomeNewsletter />
        </div>
      </main>
    </div>
  );
}
