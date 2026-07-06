import { headers } from "next/headers";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserReservations, redis } from "@/lib/redis";
import WishlistIconButton from "@/components/product/WishlistIconButton";
import HomeHeader from "@/components/home/HomeHeader";
import HomeStoreRow from "@/components/home/HomeStoreRow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Velvet Lane | Chennai's Fashion-Forward Local Marketplace",
  description:
    "Discover verified independent fashion sellers in Chennai. Ethnic wear, streetwear, handlooms, and accessories — with KYC-verified boutiques and escrow payment safety.",
};

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
  let userProfile = null;
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
    const key = `wishlist:${(userProfile as any).id}`;
    wishlistIds = (await redis.smembers(key)) || [];
  }

  // ── Parallel data fetching ────────────────────────────────────────────────
  const [
    featuredSellers,
    spotlightProducts,
    suggestedProducts,
    brandsSellers,
    trendingCount,
    trendingProducts,
  ] = await Promise.all([
    // Featured Stores row (verified sellers with products)
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

    // Spotlight / Editor's Pick — latest published products (horizontal card view)
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
      take: 2,
    }),

    // Suggested For You — offset by 2 to avoid overlap with spotlight
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
      skip: 2,
      take: 4,
    }),

    // Brands in Spotlight (verified sellers)
    prisma.seller.findMany({
      where: {
        verification: {
          kycStatus: { in: ["auto_approved", "approved"] },
          bankVerified: true,
        },
      },
      include: {
        userProfile: { include: { user: true } },
        verification: true,
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),

    // Trending Products count for pagination
    prisma.product.count({
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
    }),

    // Trending Products paginated feed
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

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Navigation Header */}
      <HomeHeader
        userProfile={userProfile as any}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      {/* Main Container */}
      <main className="w-full flex flex-col items-center pb-xxl overflow-x-hidden">
        {/* Banner Section */}
        <section className="w-full max-w-container-max px-base lg:px-xl mt-lg">
          <div className="w-full h-[280px] sm:h-[320px] rounded-DEFAULT bg-primary overflow-hidden relative flex items-center">
            <div className="absolute inset-0 z-0">
              <div
                className="w-full h-full bg-cover bg-center opacity-60"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCuuEUsIxA3_j4nFv64zuFRgxAm0V4JgR9sTRL3od4uWvk6f4YoNBXq9sZMlrt6kGz9_fBoYXYhrcJmwY0eOzGIVzrZ9LYaHIE0NdAw8EGCk_YpgW8sGA9hlcbcTWqz-2Y04eY0vpUErRAjUQJwaqvg_2m3RJcI_GRvOx2gXttJtQxECWyeW1SPl356KVzelQBhT4hvM6CbsYY9yE66gD4tJq4xjqEwkVOdxsU_ae2Qw80e5S8pkfWwmw0cUFYAgLrf7yAnS1UEuIMP')`,
                }}
              />
            </div>
            <div className="relative z-10 p-md sm:p-xl lg:p-xxl max-w-[36rem]">
              <h1 className="text-headline-md sm:text-headline-lg font-bold text-on-primary mb-md font-headline-lg leading-tight">
                Discover Premium Brands,<br className="hidden sm:inline" /> Delivered Fast.
              </h1>
              <p className="text-body-md sm:text-body-lg text-on-primary/80 mb-lg sm:mb-xl font-body-lg leading-relaxed">
                Shop the latest collections from top Indian and international<br className="hidden sm:inline" /> sellers. Enjoy exclusive coins and rewards.
              </p>
              <Link
                href="/products"
                className="inline-block bg-accent-yellow text-primary font-label-bold text-label-bold px-md sm:px-lg py-sm sm:py-md rounded-DEFAULT hover:bg-accent-yellow/90 transition-colors select-none text-xs sm:text-body-md"
              >
                Explore Now
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Stores */}
        {allSellers.length > 0 && (
          <HomeStoreRow sellers={allSellers} />
        )}

        {/* Spotlight On (Section 3) */}
        {spotlightProducts.length > 0 && (
          <section className="w-full max-w-container-max px-base lg:px-xl mt-xxl">
            <div className="flex items-center justify-between mb-lg border-b border-border-gray pb-sm">
              <h2 className="text-headline-md font-bold font-headline-md text-primary">Spotlight On</h2>
            </div>
            <div className="flex flex-col gap-lg">
              {spotlightProducts.map((product) => {
                const imgUrl = product.images?.[0]?.url || "/placeholder.jpg";
                const priceInINR = Math.round(product.price / 100);
                const originalPriceInINR = Math.round(priceInINR * 1.5);
                const discount = 33; // ~33% off

                return (
                  <div
                    key={product.id}
                    className="flex flex-col md:flex-row bg-surface border border-border-gray rounded-DEFAULT overflow-hidden group"
                  >
                    <div className="w-full md:w-1/3 aspect-[4/3] bg-surface-container-low overflow-hidden relative">
                      <Image
                        src={imgUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 p-md md:p-lg flex flex-col justify-center">
                      <span className="text-body-sm font-body-sm text-text-muted mb-xs uppercase tracking-wider">
                        {product.category}
                      </span>
                      <h3 className="text-headline-sm font-bold font-headline-sm text-primary mb-md">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-md mb-lg">
                        <span className="text-headline-md font-bold font-headline-md text-primary">
                          ₹{priceInINR.toLocaleString("en-IN")}
                        </span>
                        <span className="text-body-md font-body-md text-text-muted line-through">
                          ₹{originalPriceInINR.toLocaleString("en-IN")}
                        </span>
                        <span className="text-body-md font-body-md text-success-green font-semibold">
                          {discount}% OFF
                        </span>
                      </div>
                      <Link
                        href={`/products/${product.id}`}
                        className="w-max bg-primary text-on-primary font-label-bold text-label-bold px-lg sm:px-xl py-sm rounded-DEFAULT hover:bg-primary/90 transition-colors select-none text-xs sm:text-body-md"
                      >
                        Shop Now
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Suggested For You (Section 4) */}
        {suggestedProducts.length > 0 && (
          <section className="w-full max-w-container-max px-base lg:px-xl mt-xxl">
            <div className="flex items-center justify-between mb-lg border-b border-border-gray pb-sm">
              <h2 className="text-headline-sm font-bold font-headline-sm text-primary">Suggested For You</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-base lg:gap-lg">
              {suggestedProducts.map((product) => {
                const imgUrl = product.images?.[0]?.url || "/placeholder.jpg";
                const priceInINR = Math.round(product.price / 100);
                const originalPriceInINR = Math.round(priceInINR * 1.4);
                const isWishlisted = wishlistIds.includes(product.id);

                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col bg-surface border border-border-gray rounded-DEFAULT overflow-hidden hover:shadow-sm transition-shadow duration-200"
                  >
                    <div className="relative w-full aspect-square bg-surface-container-low overflow-hidden">
                      <Image
                        src={imgUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <WishlistIconButton
                        productId={product.id}
                        isLoggedIn={!!session?.user}
                        initialIsWishlisted={isWishlisted}
                      />
                    </div>
                    <div className="p-sm flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-xs mb-xs truncate">
                        <span className="text-body-sm font-body-sm text-text-muted truncate">
                          {product.seller.businessName}
                        </span>
                      </div>
                      <Link href={`/products/${product.id}`} className="block">
                        <h3 className="text-body-md font-body-md text-primary font-medium line-clamp-2 mb-sm group-hover:text-accent-yellow transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="mt-auto flex items-end gap-xs sm:gap-sm flex-wrap">
                        <span className="text-price-lg font-price-lg text-primary">
                          ₹{priceInINR.toLocaleString("en-IN")}
                        </span>
                        <span className="text-body-sm font-body-sm text-text-muted line-through mb-[2px]">
                          ₹{originalPriceInINR.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Brands in Spotlight (Section 5) */}
        {brandsSellers.length > 0 && (
          <section className="w-full max-w-container-max px-base lg:px-xl mt-xxl">
            <div className="flex items-center justify-between mb-lg border-b border-border-gray pb-sm">
              <h2 className="text-headline-md font-bold font-headline-md text-primary">Brands in Spotlight</h2>
            </div>
            <div className="flex flex-col gap-base">
              {brandsSellers.map((seller) => {
                let bannerUrl = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80";
                let logoUrl = seller.storeLogo || seller.userProfile?.user?.image || null;
                let tagline = seller.category;

                if (seller.businessName.toLowerCase().includes("aura wear")) {
                  bannerUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuAZR5AlwNJRas8o7JOvaKlYdRnNbe24KNQgqBiLuyMhyfdA33HXYWetc-ehqpnJO9ohxDdUbqmJYEACl6b0-qurD_0yv9GjtVMcwFtEsu1TSM7uwW_LMq_czZYtumR7j9Isf8sWuLtIt-xQ9yi86eUlgY6JHYg8JSxPbPm5grOJpDYF3cY8a85r8Te0sk02IW3AgMDNsqTzg7NQ6DISW1C8QJS23b9-OgJqgXggtbptAXs0OH7NmJCxMUYFjz-O75qM8_-T-_V5pbm8";
                  logoUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuDtrTrDQiUGnLgo4PmMLC1X3vCbX-BNGqaEsHDh-XN66owpNVmbBmCpsssLGEsGqM9A6jMC9ARXELMfQHWyDBuTA36ChsBUp3d4ogPjuo0vmMkQfFYzYizUBxIjWEUBtAo4jeKoyCqqSOC8NL7CAztdtNzn49x4fjZEiNOfHhOihdxfReJ8IUsk0wuChH0iSQaB4bEm7fsfCCYlCjO3JCfgoECuTb12Xf9r6opIu6S7ffkQZ35gWJJFtqQW26B-9gGm_9lcQf-u_TBw";
                  tagline = "Premium Fashion & Accessories";
                } else if (seller.businessName.toLowerCase().includes("techhaven")) {
                  bannerUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuDMXUvs0_QuI7rYGumzbQwlNpLRMpBo1EaU25cv27BPyg7WslkYG6EfI3sj1slG-KBB0jW-SNeK2KwryHG7ueD8RuK7qqC8hhEHrVdR0MSYp4LfLVlnwPmI3V_Ctg5MfPgcKTadaP-W8zHcA-Lqrd5kv2axT7Zz0qKQsUpV9XX79rTbDgmRBL0hwbvutEwGfRf0hDnc7PUoZziq5MtUfhO6ID57PHwk7olsbyIl_VD2Ch9n-w-QRyMZZBr-VcVzea3vbsCCgrpzlb2h";
                  logoUrl = null;
                  tagline = "Next-Gen Electronics";
                } else if (seller.businessName.toLowerCase().includes("nest living")) {
                  tagline = "Artisan Home Decor & Goods";
                } else if (seller.businessName.toLowerCase().includes("apex gear")) {
                  tagline = "High-Performance Sports Gear";
                }

                return (
                  <div
                    key={seller.id}
                    className="w-full h-auto md:h-[200px] border border-border-gray rounded-none overflow-hidden flex flex-col md:flex-row bg-white group shadow-xs"
                  >
                    <div className="w-full h-36 md:w-[320px] md:h-full relative overflow-hidden flex-shrink-0">
                      <Image
                        src={bannerUrl}
                        alt={`${seller.businessName} banner`}
                        fill
                        sizes="(max-width: 768px) 100vw, 320px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 p-md md:px-lg flex items-center justify-between gap-sm">
                      <div className="flex items-center gap-sm md:gap-md min-w-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg border border-border-gray overflow-hidden flex-shrink-0 bg-black flex items-center justify-center relative">
                          {logoUrl ? (
                            <Image
                              src={logoUrl}
                              alt={seller.businessName}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-black text-white font-bold text-headline-sm">
                              {seller.businessName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-xs truncate">
                            <h3 className="text-base md:text-xl font-bold text-primary font-headline-sm truncate">
                              {seller.businessName}
                            </h3>
                            <span
                              className="material-symbols-outlined text-success-green text-base md:text-lg shrink-0"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                              title="Verified Brand"
                            >
                              verified
                            </span>
                          </div>
                          <span className="text-xs md:text-[14px] text-text-muted mt-xs truncate">
                            {tagline}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/sellers/${seller.id}`}
                        className="border border-primary text-primary px-md md:px-lg py-xs md:py-sm font-label-bold text-xs md:text-label-bold hover:bg-primary hover:text-on-primary transition-colors select-none shrink-0"
                      >
                        Follow
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Product Feed */}
        {trendingProducts.length > 0 && (
          <section className="w-full max-w-container-max px-base lg:px-xl mt-xxl">
            <div className="flex items-center justify-between mb-lg border-b border-border-gray pb-sm">
              <h2 className="text-headline-sm font-bold font-headline-sm text-primary">Trending Products</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-base lg:gap-lg">
              {trendingProducts.map((product, idx) => {
                const imgUrl = product.images?.[0]?.url || "/placeholder.jpg";
                const priceInINR = Math.round(product.price / 100);
                const originalPriceInINR = Math.round(priceInINR * 1.5);
                const discount = 33;
                const isBestseller = idx === 1;
                const isWishlisted = wishlistIds.includes(product.id);

                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col bg-surface border border-border-gray rounded-DEFAULT overflow-hidden hover:shadow-sm transition-shadow duration-200"
                  >
                    <div className="relative w-full aspect-square bg-surface-container-low overflow-hidden">
                      <Image
                        src={imgUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <WishlistIconButton
                        productId={product.id}
                        isLoggedIn={!!session?.user}
                        initialIsWishlisted={isWishlisted}
                      />
                      {isBestseller && (
                        <div className="absolute top-sm left-sm bg-accent-yellow text-primary text-body-sm font-bold px-xs py-0.5 rounded-sm z-10 select-none">
                          Bestseller
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 w-full bg-surface/90 backdrop-blur-sm py-xs px-sm translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex justify-center border-t border-border-gray z-10">
                        <Link
                          href={`/products/${product.id}`}
                          className="text-label-bold font-label-bold text-primary hover:text-accent-yellow select-none"
                        >
                          Quick View
                        </Link>
                      </div>
                    </div>
                    <div className="p-sm flex flex-col flex-1">
                      <div className="flex items-center gap-xs mb-xs">
                        <span className="text-body-sm font-body-sm text-text-muted">
                          {product.seller.businessName}
                        </span>
                        <span
                          className="material-symbols-outlined text-success-green text-[14px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                          title="Verified Seller"
                        >
                          verified
                        </span>
                      </div>
                      <Link href={`/products/${product.id}`} className="block">
                        <h3 className="text-body-md font-body-md text-primary font-medium line-clamp-2 mb-sm group-hover:text-accent-yellow transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="mt-auto flex items-end gap-sm">
                        <span className="text-price-lg font-price-lg text-primary">
                          ₹{priceInINR.toLocaleString("en-IN")}
                        </span>
                        <span className="text-body-sm font-body-sm text-text-muted line-through mb-[2px]">
                          ₹{originalPriceInINR.toLocaleString("en-IN")}
                        </span>
                        <span className="text-body-sm font-body-sm text-success-green font-semibold mb-[2px]">
                          -{discount}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="w-full flex justify-center mt-lg">
              <Link
                href={currentPage < totalPages ? `/?page=${currentPage + 1}` : "#"}
                className="border border-border-gray text-primary font-label-bold px-xl py-sm rounded-DEFAULT hover:bg-surface-container-low transition-colors select-none text-body-md"
              >
                Load More
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* Footer Container */}
      <footer className="w-full bg-tertiary">
        {/* Footer (from JSON) */}
        <div className="w-full py-xxl px-base lg:px-xl grid grid-cols-2 md:grid-cols-5 gap-lg max-w-container-max mx-auto bg-tertiary">
          <div className="col-span-2 md:col-span-1 flex flex-col">
            <span className="text-headline-sm font-headline-sm text-on-tertiary mb-md">MINIBRANDS</span>
          </div>
          <div className="flex flex-col gap-sm">
            <a className="text-body-sm font-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors" href="#">About Us</a>
          </div>
          <div className="flex flex-col gap-sm">
            <a className="text-body-sm font-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors" href="#">Help Center</a>
          </div>
          <div className="flex flex-col gap-sm">
            <a className="text-body-sm font-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors" href="#">Become a Seller</a>
            <a className="text-body-sm font-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors" href="#">Policies</a>
          </div>
          <div className="flex flex-col gap-sm">
            <a className="text-body-sm font-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors" href="#">Contact Us</a>
          </div>
          <div className="col-span-2 md:col-span-5 mt-lg pt-lg border-t border-on-secondary-fixed-variant/20 flex flex-col md:flex-row items-center justify-between">
            <span className="text-body-sm font-body-sm text-on-secondary-fixed-variant">© 2024 MINIBRANDS Marketplace. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
