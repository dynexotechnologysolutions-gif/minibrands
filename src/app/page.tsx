import { headers } from "next/headers";
import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getUserReservations, redis } from "@/lib/redis";
import HomeHeader from "@/components/home/HomeHeader";
import HomeStoreRow from "@/components/home/HomeStoreRow";
import HomeHero from "@/components/home/HomeHero";
import HomeCategoryGrid from "@/components/home/HomeCategoryGrid";
import HomeEditorialCollections from "@/components/home/HomeEditorialCollections";
import HomeSellerSpotlight from "@/components/home/HomeSellerSpotlight";
import HomeInspiration from "@/components/home/HomeInspiration";
import HomeNewsletter from "@/components/home/HomeNewsletter";
import HomeTrustStrip from "@/components/home/HomeTrustStrip";
import ProductGrid from "@/components/product/ProductGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Velvet Lane | Chennai's Fashion-Forward Local Marketplace",
  description:
    "Discover verified independent fashion sellers in Chennai. Ethnic wear, streetwear, handlooms, and accessories — with KYC-verified boutiques and escrow payment safety.",
};


// Optimized select objects
const sellerCardSelect = {
  id: true,
  businessName: true,
  category: true,
  storeLogo: true,
  userProfile: {
    select: {
      user: {
        select: {
          image: true,
        },
      },
    },
  },
};

const productCardSelect = {
  id: true,
  name: true,
  price: true,
  category: true,
  images: {
    select: {
      url: true,
      cloudinaryPublicId: true,
    },
    orderBy: { sortOrder: "asc" as const },
  },
  variants: {
    select: {
      id: true,
      size: true,
      stockCount: true,
    },
  },
  seller: {
    select: {
      id: true,
      businessName: true,
      city: true,
      verification: {
        select: {
          trustScore: true,
          kycStatus: true,
          bankVerified: true,
        },
      },
    },
  },
};

// Cached fetchers
const getFeaturedSellers = unstable_cache(
  async () => {
    return prisma.seller.findMany({
      where: {
        verification: {
          kycStatus: { in: ["auto_approved", "approved"] },
          bankVerified: true,
        },
        products: { some: { isPublished: true, isDeleted: false } },
      },
      select: sellerCardSelect,
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  },
  ["homepage-featured-sellers"],
  { revalidate: 300, tags: ["homepage-featured-sellers", "homepage"] }
);


const getSuggestedProducts = unstable_cache(
  async () => {
    return prisma.product.findMany({
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
      select: productCardSelect,
      orderBy: { createdAt: "desc" },
      skip: 2,
      take: 4,
    });
  },
  ["homepage-suggested-products"],
  { revalidate: 300, tags: ["homepage-suggested-products", "homepage"] }
);

const getBrandsSellers = unstable_cache(
  async () => {
    return prisma.seller.findMany({
      where: {
        verification: {
          kycStatus: { in: ["auto_approved", "approved"] },
          bankVerified: true,
        },
      },
      select: {
        ...sellerCardSelect,
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 2,
    });
  },
  ["homepage-brands-sellers"],
  { revalidate: 300, tags: ["homepage-brands-sellers", "homepage"] }
);

const getTrendingCount = unstable_cache(
  async () => {
    return prisma.product.count({
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
    });
  },
  ["homepage-trending-count"],
  { revalidate: 300, tags: ["homepage-trending-count", "homepage"] }
);

const getTrendingProducts = unstable_cache(
  async (page: number, itemsPerPage: number) => {
    return prisma.product.findMany({
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
      select: productCardSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
    });
  },
  ["homepage-trending-products"],
  { revalidate: 300, tags: ["homepage-trending-products", "homepage"] }
);


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
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const itemsPerPage = 8; // Adjust to match grid density nicely

  // ── Session ──────────────────────────────────────────────────────────────────
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
    const key = `wishlist:${userProfile.id}`;
    wishlistIds = (await redis.smembers(key)) || [];
  }

  // ── Parallel data fetching (Cached via unstable_cache) ─────────────────────
  const [
    featuredSellers,
    suggestedProducts,
    brandsSellers,
    trendingCount,
    trendingProducts,
  ] = await Promise.all([
    getFeaturedSellers(),
    getSuggestedProducts(),
    getBrandsSellers(),
    getTrendingCount(),
    getTrendingProducts(currentPage, itemsPerPage),
  ]);

  const totalPages = Math.ceil(trendingCount / itemsPerPage);

  // ── Shape data for components ─────────────────────────────────────────────
  const shapeSeller = (s: (typeof featuredSellers)[number]) => ({
    id: s.id,
    businessName: s.businessName,
    category: s.category,
    logoUrl: s.storeLogo || s.userProfile?.user?.image || null,
  });

  const mockSellers = [
    {
      id: "mock-store-1",
      businessName: "TechHaven",
      category: "Electronics",
      logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvBv23k8mXJ4omqCvTyxQWQtalbnAxhJqCY7iCiY1d_X021pUhpVupEKgo-0cTPeA_-9TQ0aCIzkni_zbOTwuG9uOa-FuIB8WLp68pNi-lNulrr5Rs1ZoLWvNlyEYcS28-gQZayrmy1QssoR649fP_lGKRzq5xxtUl7cMzttBn8xZm21jzYMDoEvCw2VOjDp9rZsd_N_nZ2MuFBiEFS7rsCH4gxp7yE2Y4f-6OzngqajQzXWjxB8eRRmZ8injazSKqtu6Od2RSt0Jr",
    },
    {
      id: "mock-store-2",
      businessName: "Aura Wear",
      category: "Fashion",
      logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfACgB8OelxdoEImD8XJVxdN_0MzYSYT_eTD8ISAJpU7M19miENYHSWerZiU4mbr6dKQbXHHEKztjilJ5bhhMSwqjJkOS14VE9dx5-X-9h7RMUasVaXMrwt1iXVE0XgLaIirEOSZSUDIXpppp7fWjAcWojpNgsukghPR6dRhlQ7cWGHfWqIiJ5yhQZvl-4KHYpXHORiaOMC5HjwkKy-CbHvcLZulsxq7vdCx6tob8ejc6Kdm3HYd032TZJbRwb63d1qX-FW-iRoPxO",
    },
    {
      id: "mock-store-3",
      businessName: "Nest Living",
      category: "Home",
      logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuALoFa4j61yNWwBS0voewU1LiEVEVOgNpUsX-ibHQ6J1Y1ySHtUMNIe1TJQEy4VGXEvkcsCGT4YlD_V7SkCLL2UYRrp562h4mbldjib-TPJ-cLS-b6O9c4sOAWyGB3KQcI1RQXEYZC6Q3Rxt5NGZbLHx_w39f41d02mFgYH1SchXOUz3AZh6TQF_QqUT0fZEnVeqL3_Rt1ZxknnkWYN6_WEFlEPU0Hj1cJVBnscz_fisvg49dKHZI7Y1a7zTUz5oEALtYOBtj45SytV",
    },
    {
      id: "mock-store-4",
      businessName: "Apex Gear",
      category: "Sports",
      logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDXhza--BuhlNdO8miXtN50_ADkVJ1bUDS4C1OTm8fTQzoLzND-QCS1cvM7ajsbeJTY1gOH1sgV92Ukgku__ejc41xtxAMjQIV-eWCfJuiRW_FfBuZUTDPYfP592aDKSua2gu76K7ieHzRQnCnZiKWwRITs0VuwTWvk9GuunYC8Hq_J7jTd1hjqpQOoX7yxWA6Sr16jRSexp3-H1TVRZqE5Jp-qLuh3JfYyig9pT0mpNoRYrOri0rIABCdl_hVrx38N4VPAYNKuYmg4",
    },
    {
      id: "mock-store-5",
      businessName: "GlowUp",
      category: "Beauty",
      logoUrl: null,
    },
  ];

  const allSellers = [...featuredSellers.map(shapeSeller), ...mockSellers];

  const shapedSpotlightSellers = brandsSellers.map((s) => {
    let bannerUrl = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80";
    let tagline = s.category;
    if (s.businessName.toLowerCase().includes("aura wear")) {
      bannerUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuAZR5AlwNJRas8o7JOvaKlYdRnNbe24KNQgqBiLuyMhyfdA33HXYWetc-ehqpnJO9ohxDdUbqmJYEACl6b0-qurD_0yv9GjtVMcwFtEsu1TSM7uwW_LMq_czZYtumR7j9Isf8sWuLtIt-xQ9yi86eUlgY6JHYg8JSxPbPm5grOJpDYF3cY8a85r8Te0sk02IW3AgMDNsqTzg7NQ6DISW1C8QJS23b9-OgJqgXggtbptAXs0OH7NmJCxMUYFjz-O75qM8_-T-_V5pbm8";
      tagline = "Premium Fashion & Accessories";
    } else if (s.businessName.toLowerCase().includes("techhaven")) {
      bannerUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuDMXUvs0_QuI7rYGumzbQwlNpLRMpBo1EaU25cv27BPyg7WslkYG6EfI3sj1slG-KBB0jW-SNeK2KwryHG7ueD8RuK7qqC8hhEHrVdR0MSYp4LfLVlnwPmI3V_Ctg5MfPgcKTadaP-W8zHcA-Lqrd5kv2axT7Zz0qKQsUpV9XX79rTbDgmRBL0hwbvutEwGfRf0hDnc7PUoZziq5MtUfhO6ID57PHwk7olsbyIl_VD2Ch9n-w-QRyMZZBr-VcVzea3vbsCCgrpzlb2h";
      tagline = "Next-Gen Electronics";
    } else if (s.businessName.toLowerCase().includes("nest living")) {
      tagline = "Artisan Home Decor & Goods";
    } else if (s.businessName.toLowerCase().includes("apex gear")) {
      tagline = "High-Performance Sports Gear";
    }

    return {
      id: s.id,
      businessName: s.businessName,
      category: s.category,
      logoUrl: s.storeLogo || s.userProfile?.user?.image || null,
      bannerUrl,
      tagline,
      productCount: s._count?.products || 0,
    };
  });

  return (
    <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink selection:bg-vl-primary/20">
      {/* 1. Sticky Header */}
      <HomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      {/* Main Content Area */}
      <main className="w-full flex-grow pb-16">
        {/* 2. Hero Banner */}
        <HomeHero />

        {/* 3. Shop by Mood */}
        <HomeCategoryGrid />

        {/* 4. Trending Collections */}
        <HomeEditorialCollections />

        {/* 5. Featured Products */}
        {suggestedProducts.length > 0 && (
          <section className="vl-section-shell mt-16 sm:mt-24">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">Handpicked styles</p>
                <h2 className="font-vl-heading text-2xl font-bold tracking-[-0.04em] text-vl-ink sm:text-3xl">Featured Products</h2>
              </div>
              <Link href="/products" className="hidden rounded-vl-control px-3 py-2 text-sm font-semibold text-vl-muted transition hover:bg-vl-card hover:text-vl-primary sm:inline-flex">View all</Link>
            </div>
            <ProductGrid
              products={suggestedProducts as unknown as Parameters<typeof ProductGrid>[0]["products"]}
              isLoggedIn={!!session?.user}
              wishlistIds={wishlistIds}
            />
          </section>
        )}

        {/* 6. Featured Brands */}
        {allSellers.length > 0 && (
          <HomeStoreRow sellers={allSellers} />
        )}

        {/* 7. New Arrivals */}
        {trendingProducts.length > 0 && (
          <section className="vl-section-shell mt-16 sm:mt-24">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">Just landed</p>
                <h2 className="font-vl-heading text-2xl font-bold tracking-[-0.04em] text-vl-ink sm:text-3xl">New Arrivals</h2>
              </div>
              <Link href="/products" className="hidden rounded-vl-control px-3 py-2 text-sm font-semibold text-vl-muted transition hover:bg-vl-card hover:text-vl-primary sm:inline-flex">View all</Link>
            </div>
            <ProductGrid
              products={trendingProducts as unknown as Parameters<typeof ProductGrid>[0]["products"]}
              isLoggedIn={!!session?.user}
              wishlistIds={wishlistIds}
            />
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="w-full flex justify-center mt-10">
                <Link
                  href={currentPage < totalPages ? `/?page=${currentPage + 1}` : "#"}
                  className="border border-vl-border text-vl-ink font-semibold px-6 py-3 rounded-vl-control hover:bg-vl-card transition-colors select-none text-sm"
                >
                  Load More
                </Link>
              </div>
            )}
          </section>
        )}

        {/* 8. Seller Spotlight */}
        {brandsSellers.length > 0 && (
          <HomeSellerSpotlight sellers={shapedSpotlightSellers} />
        )}

        {/* 9. Editorial Quote */}
        <HomeInspiration />

        {/* 10. Weekly Edit */}
        <HomeNewsletter />

        {/* 11. Trust Features */}
        <HomeTrustStrip />
      </main>
    </div>
  );
}
