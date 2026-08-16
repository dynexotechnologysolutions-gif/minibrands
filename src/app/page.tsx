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
import HomeFlashSale from "@/components/home/HomeFlashSale";
import HomeShopByBudget from "@/components/home/HomeShopByBudget";
import HomeProductCard from "@/components/home/HomeProductCard";
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
  const itemsPerPage = 8;
  const session = await auth.api.getSession({ headers: await headers() });

  let sellerHref = "/login?role=seller";
  let userProfile: UserProfileData | null = null;
  let cartCount = 0;

  if (session?.user) {
    userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        seller: { include: { verification: true } },
        addresses: { where: { isDeleted: false } },
      },
    });

    if (userProfile?.role === "SELLER") {
      const ver = userProfile.seller?.verification;
      const isVerified =
        ver &&
        (ver.kycStatus === "auto_approved" || ver.kycStatus === "approved") &&
        ver.bankVerified;
      sellerHref = isVerified ? "/seller/dashboard" : "/seller/onboarding";
    }

    if (userProfile) {
      const reservations = await getUserReservations(userProfile.id);
      cartCount = reservations.reduce((acc, curr) => acc + curr.quantity, 0);
    }
  }

  let wishlistIds: string[] = [];
  if (userProfile) {
    wishlistIds = (await redis.smembers(`wishlist:${userProfile.id}`)) || [];
  }

  const [featuredSellers, flashSaleProducts, popularProducts] = await Promise.all([
    // Featured sellers (verified, have products)
    prisma.seller.findMany({
      where: {
        verification: {
          kycStatus: { in: ["auto_approved", "approved"] },
          bankVerified: true,
        },
        products: { some: { isPublished: true, isDeleted: false } },
      },
      include: {
        userProfile: { include: { user: true } },
        verification: true,
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Flash sale — best sellers (first 4 for the flash sale dark panel)
    prisma.product.findMany({
      where: {
        isDeleted: false,
        isPublished: true,
        seller: {
          verification: {
            kycStatus: { in: ["auto_approved", "approved"] },
            bankVerified: true,
          },
        },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        seller: { include: { verification: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    // Popular products (next page — "Explore Popular Products")
    prisma.product.findMany({
      where: {
        isDeleted: false,
        isPublished: true,
        seller: {
          verification: {
            kycStatus: { in: ["auto_approved", "approved"] },
            bankVerified: true,
          },
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
      {/* ── 1. HEADER ─────────────────────────────── */}
      <StitchHomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      <main className="flex-grow w-full pt-4 md:pt-8">
        {/* ── 2. CATEGORIES NAV ──────────────────────── */}
        <HomeCategoryGrid />

        {/* ── 3. HERO BANNER ─────────────────────────── */}
        <HomeHero />

        {/* ── 4. BEST STORES FOR YOU ─────────────────── */}
        <HomeStoreRow sellers={allSellers} />

        {/* ── 5. FLASH SALE (Best Selling Products) ──── */}
        <HomeFlashSale
          products={flashSaleProducts}
          isLoggedIn={!!session?.user}
          wishlistIds={wishlistIds}
        />

        {/* ── 6. SHOP BY BUDGET ──────────────────────── */}
        <HomeShopByBudget />

        {/* ── 7. EXPLORE POPULAR PRODUCTS ────────────── */}
        <section className="px-4 md:px-6 mb-12" data-purpose="popular-products">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h3 className="text-[20px] md:text-2xl font-bold text-gray-900">
                Explore Popular Products
              </h3>
              <Link
                href="/products"
                className="text-sm md:text-base font-semibold text-[#0F7F7F] hover:underline"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {popularProducts.map((product) => (
                <HomeProductCard
                  key={product.id}
                  product={product}
                  isLoggedIn={!!session?.user}
                  isWishlisted={wishlistIds.includes(product.id)}
                />
              ))}
              {popularProducts.length === 0 && (
                <div className="col-span-2 md:col-span-4 text-center py-12 text-gray-400">
                  <i className="fa-solid fa-store text-5xl mb-4 block"></i>
                  <p className="text-lg font-medium">Products coming soon</p>
                  <p className="text-sm mt-1">Check back in a bit!</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 8. TRUST STRIP ─────────────────────────── */}
        <HomeTrustStrip />
      </main>

      {/* ── FOOTER ─────────────────────────────────── */}
      <StitchHomeFooter />

      {/* ── MOBILE BOTTOM NAV ──────────────────────── */}
      <StitchMobileNav cartCount={cartCount} isLoggedIn={!!session?.user} />
    </div>
  );
}
