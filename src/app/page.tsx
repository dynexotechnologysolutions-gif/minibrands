import { headers } from "next/headers";
import { Metadata } from "next";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserReservations, redis } from "@/lib/redis";
import HomeHeader from "@/components/home/HomeHeader";
import HomeStoreRow from "@/components/home/HomeStoreRow";
import HomeHero from "@/components/home/HomeHero";
import HomeCategoryGrid from "@/components/home/HomeCategoryGrid";
import HomeEditorialCollections from "@/components/home/HomeEditorialCollections";
import HomeBrandSpotlight from "@/components/home/HomeBrandSpotlight";
import HomeNearbyStores from "@/components/home/HomeNearbyStores";
import HomeInspiration from "@/components/home/HomeInspiration";
import HomeTrustStrip from "@/components/home/HomeTrustStrip";
import HomeNewsletter from "@/components/home/HomeNewsletter";
import HomeProductSection from "@/components/home/HomeProductSection";
import HomeCuratedCollections from "@/components/home/HomeCuratedCollections";
import HomeFeaturedCollections from "@/components/home/HomeFeaturedCollections";
import HomeWhyShopWithVelvet from "@/components/home/HomeWhyShopWithVelvet";
import ProductCard from "@/components/product/ProductCard";
import WishlistIconButton from "@/components/product/WishlistIconButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Velvet Lane | Chennai's Fashion-Forward Local Marketplace",
  description:
    "Discover verified independent fashion sellers in Chennai. Ethnic wear, streetwear, handlooms, and accessories — with KYC-verified boutiques and escrow payment safety.",
};


interface UserProfileData {
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
    } | null;
  } | null;
  addresses?: Array<{
    id: string;
    city: string;
    isDefault: boolean;
    isDeleted: boolean;
  }>;
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const formatPrice = (price: number) => `₹${Math.round(price / 100).toLocaleString("en-IN")}`;

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const itemsPerPage = 8;
  const session = await auth.api.getSession({ headers: await headers() });

  let sellerHref = "/login?role=seller";
  let userProfile: UserProfileData | null = null;
  let cartCount = 0;

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

  let wishlistIds: string[] = [];
  if (userProfile) wishlistIds = (await redis.smembers(`wishlist:${userProfile.id}`)) || [];

  const [featuredSellers, suggestedProducts, trendingCount, trendingProducts, spotlightBrand, nearbyStores, newArrivalsProducts, trendingProductsSection] = await Promise.all([
    prisma.seller.findMany({
      where: { verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true }, products: { some: { isPublished: true, isDeleted: false } } },
      include: { userProfile: { include: { user: true } }, verification: true, _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" }, take: 10,
    }),
    prisma.product.findMany({
      where: { isDeleted: false, isPublished: true, seller: { verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true } } },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true, seller: { include: { verification: true } } },
      orderBy: { createdAt: "desc" }, skip: 2, take: 4,
    }),
    prisma.product.count({ where: { isDeleted: false, isPublished: true, seller: { verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true } } } }),
    prisma.product.findMany({
      where: { isDeleted: false, isPublished: true, seller: { verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true } } },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true, seller: { include: { verification: true } } },
      orderBy: { createdAt: "desc" }, skip: (currentPage - 1) * itemsPerPage, take: itemsPerPage,
    }),
    prisma.seller.findFirst({
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
          include: { images: { orderBy: { sortOrder: "asc" } }, variants: true, seller: { include: { verification: true } } },
          take: 3,
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: [
        { verification: { trustScore: "desc" } },
        { createdAt: "desc" },
      ],
    }),
    prisma.seller.findMany({
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
      orderBy: [
        { verification: { trustScore: "desc" } },
        { createdAt: "desc" },
      ],
      take: 10,
    }),
    prisma.product.findMany({
      where: { isDeleted: false, isPublished: true, seller: { verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true } } },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true, seller: { include: { verification: true } } },
      orderBy: { createdAt: "desc" }, take: 8,
    }),
    prisma.product.findMany({
      where: { isDeleted: false, isPublished: true, seller: { verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true } } },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true, seller: { include: { verification: true } } },
      orderBy: { createdAt: "desc" }, take: 8,
    }),
  ]);


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
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#222222]">Best Selling Products</h2>
              </div>
              <Link href="/products" className="text-sm font-semibold text-[#0F7F7F] hover:underline">
                View All
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 px-2 md:px-4">
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

        {/* 4.1 Trust Indicators */}
        <HomeTrustStrip />

        {/* 4.2 Curated Collections / Shop by Occasion */}
        <HomeCuratedCollections />

        {/* 4.3 Trending Products */}
        <HomeProductSection
            title="Trending Products"
            products={trendingProductsSection}
            href="/products?sort=trending"
            isLoggedIn={!!session?.user}
            wishlistIds={wishlistIds}
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
          {(() => {
            const userCity = userProfile?.addresses?.find((a) => a.isDefault)?.city || null;
            const sortedNearbyStores = [...nearbyStores].sort((a, b) => {
              if (userCity) {
                const aMatch = a.city.toLowerCase() === userCity.toLowerCase();
                const bMatch = b.city.toLowerCase() === userCity.toLowerCase();
                if (aMatch && !bMatch) return -1;
                if (!aMatch && bMatch) return 1;
              }
              return 0;
            });
            return (
              <>
                <HomeBrandSpotlight brand={spotlightBrand} userCity={userCity} />
                <HomeNearbyStores stores={sortedNearbyStores} userCity={userCity} />
              </>
            );
          })()}
          {suggestedProducts.length > 0 ? <section className="vl-section-shell mt-16 sm:mt-24"><div className="flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">New arrivals</p><h2 className="font-vl-heading text-2xl font-bold tracking-[-0.04em] text-vl-ink sm:text-3xl">Fresh from the labels</h2></div><Link href="/products?sort=newest" className="hidden rounded-vl-control px-3 py-2 text-sm font-semibold text-vl-muted transition hover:bg-vl-card hover:text-vl-primary sm:inline-flex">See newness</Link></div><div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">{suggestedProducts.map(productCard)}</div></section> : null}
          <HomeInspiration />
        </div>

        {/* 7. Curated Collections */}
        <HomeFeaturedCollections />

        {/* 8. Why Shop With Velvet Lane? */}
        <HomeWhyShopWithVelvet />

        {/* 9. Newsletter */}
        <HomeNewsletter />
      </main>
    </div>
  );
}
