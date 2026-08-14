import { headers } from "next/headers";
import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserReservations, redis } from "@/lib/redis";
import StitchHomeHeader from "@/components/home/StitchHomeHeader";
import HomeCategoryGrid from "@/components/home/HomeCategoryGrid";
import HomeHero from "@/components/home/HomeHero";
import HomeStoreRow from "@/components/home/HomeStoreRow";
import HomeProductCard from "@/components/home/HomeProductCard";
import HomeShopByStyle from "@/components/home/HomeShopByStyle";
import HomeNewAndNoticed from "@/components/home/HomeNewAndNoticed";
import HomeTrustStrip from "@/components/home/HomeTrustStrip";
import StitchHomeFooter from "@/components/home/StitchHomeFooter";
import StitchMobileNav from "@/components/home/StitchMobileNav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MiniBrands | Many Stores. One Trusted Place.",
  description:
    "Discover quality products from top independent sellers in Chennai and across India. Enjoy fast delivery and secure payments.",
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

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const itemsPerPage = 6;
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

  const [featuredSellers, bestSellingProducts, trendingProducts] = await Promise.all([
    prisma.seller.findMany({
      where: { verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true }, products: { some: { isPublished: true, isDeleted: false } } },
      include: { userProfile: { include: { user: true } }, verification: true, _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.product.findMany({
      where: { isDeleted: false, isPublished: true, seller: { verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true } } },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true, seller: { include: { verification: true } } },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
    }),
    prisma.product.findMany({
      where: { isDeleted: false, isPublished: true, seller: { verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true } } },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true, seller: { include: { verification: true } } },
      orderBy: { createdAt: "desc" },
      skip: itemsPerPage,
      take: itemsPerPage,
    }),
  ]);

  const shapeSeller = (seller: (typeof featuredSellers)[number]) => ({
    id: seller.id,
    businessName: seller.businessName,
    category: seller.category,
    logoUrl: seller.storeLogo || null,
  });

  const allSellers = featuredSellers.map(shapeSeller);

  return (
    <div className="bg-gray-50 text-gray-800 pb-20 md:pb-0 min-h-screen font-sans flex flex-col">
      {/* Header Section */}
      <StitchHomeHeader userProfile={userProfile} cartCount={cartCount} sellerHref={sellerHref} />

      <main className="flex-grow w-full">
        {/* Categories Section */}
        <HomeCategoryGrid />

        {/* Hero Banner Section */}
        <HomeHero />

        {/* Top Stores Section */}
        <HomeStoreRow sellers={allSellers} />

        {/* Best Selling Products Section */}
        <section className="mb-6 md:mb-12" data-purpose="best-selling-products">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="flex justify-between items-end mb-4 md:mb-6">
              <h3 className="text-lg md:text-2xl font-bold text-gray-900">Best Selling Products</h3>
              <Link href="/products" className="text-xs md:text-sm text-gray-600 font-medium hover:underline text-[#004F50]">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {bestSellingProducts.map((product) => (
                <HomeProductCard
                  key={product.id}
                  product={product}
                  isLoggedIn={!!session?.user}
                  isWishlisted={wishlistIds.includes(product.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Shop by Style Section */}
        <HomeShopByStyle />

        {/* Trending Right Now Section */}
        <section className="mb-6 md:mb-12" data-purpose="trending-now">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="flex justify-between items-end mb-4 md:mb-6">
              <h3 className="text-lg md:text-2xl font-bold text-gray-900">Trending Right Now</h3>
              <Link href="/products?sort=popular" className="text-xs md:text-sm text-gray-600 font-medium hover:underline text-[#004F50]">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {(trendingProducts.length > 0 ? trendingProducts : bestSellingProducts).map((product) => (
                <HomeProductCard
                  key={`trending-${product.id}`}
                  product={product}
                  isLoggedIn={!!session?.user}
                  isWishlisted={wishlistIds.includes(product.id)}
                  badgeLabel="TRENDING"
                />
              ))}
            </div>
          </div>
        </section>

        {/* New & Noticed Section */}
        <HomeNewAndNoticed />

        {/* Trust Strip Section */}
        <HomeTrustStrip />
      </main>

      {/* Footer */}
      <StitchHomeFooter />

      {/* Mobile Bottom Navigation */}
      <StitchMobileNav cartCount={cartCount} isLoggedIn={!!session?.user} />
    </div>
  );
}
