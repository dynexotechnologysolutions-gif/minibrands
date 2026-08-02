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
import HomeSellerSpotlight from "@/components/home/HomeSellerSpotlight";
import HomeInspiration from "@/components/home/HomeInspiration";
import HomeTrustStrip from "@/components/home/HomeTrustStrip";
import HomeNewsletter from "@/components/home/HomeNewsletter";
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
      include: { user: true, seller: { include: { verification: true } } },
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

  const [featuredSellers, spotlightProducts, suggestedProducts, brandsSellers, trendingCount, trendingProducts] = await Promise.all([
    prisma.seller.findMany({
      where: { verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true }, products: { some: { isPublished: true, isDeleted: false } } },
      include: { userProfile: { include: { user: true } }, verification: true, _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" }, take: 10,
    }),
    prisma.product.findMany({
      where: { isDeleted: false, isPublished: true, seller: { verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true } } },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true, seller: { include: { verification: true } } },
      orderBy: { createdAt: "desc" }, take: 2,
    }),
    prisma.product.findMany({
      where: { isDeleted: false, isPublished: true, seller: { verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true } } },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true, seller: { include: { verification: true } } },
      orderBy: { createdAt: "desc" }, skip: 2, take: 4,
    }),
    prisma.seller.findMany({
      where: { verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true } },
      include: { userProfile: { include: { user: true } }, verification: true, _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" }, take: 2,
    }),
    prisma.product.count({ where: { isDeleted: false, isPublished: true, seller: { verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true } } } }),
    prisma.product.findMany({
      where: { isDeleted: false, isPublished: true, seller: { verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true } } },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true, seller: { include: { verification: true } } },
      orderBy: { createdAt: "desc" }, skip: (currentPage - 1) * itemsPerPage, take: itemsPerPage,
    }),
  ]);

  const totalPages = Math.ceil(trendingCount / itemsPerPage);
  const shapeSeller = (seller: (typeof featuredSellers)[number]) => ({ id: seller.id, businessName: seller.businessName, category: seller.category, logoUrl: seller.storeLogo || seller.userProfile?.user?.image || null });
  const mockSellers = [
    { id: "mock-store-1", businessName: "TechHaven", category: "Electronics", logoUrl: null },
    { id: "mock-store-2", businessName: "Aura Wear", category: "Fashion", logoUrl: null },
    { id: "mock-store-3", businessName: "Nest Living", category: "Home", logoUrl: null },
    { id: "mock-store-4", businessName: "Apex Gear", category: "Sports", logoUrl: null },
    { id: "mock-store-5", businessName: "GlowUp", category: "Beauty", logoUrl: null },
  ];
  const allSellers = [...featuredSellers.map(shapeSeller), ...mockSellers];

  const sellerSpotlights = brandsSellers.map((seller) => ({
    id: seller.id,
    businessName: seller.businessName,
    category: seller.category,
    logoUrl: seller.storeLogo || seller.userProfile?.user?.image || null,
    bannerUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85",
    tagline: seller.category || "Independent fashion label",
    productCount: seller._count.products,
  }));

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
      <main className="pb-24 md:pb-0">
        <HomeHero />
        <HomeCategoryGrid />
        {spotlightProducts.length > 0 ? (
          <section className="vl-section-shell mt-10 sm:mt-24">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">Trending now</p>
                <h2 className="font-vl-heading text-xl sm:text-3xl font-bold tracking-[-0.04em] text-vl-ink">The pieces everyone is saving</h2>
              </div>
              <Link href="/products" className="hidden rounded-vl-control px-3 py-2 text-sm font-semibold text-vl-muted transition hover:bg-vl-card hover:text-vl-primary sm:inline-flex">Shop all</Link>
            </div>
            <div className="mt-4 grid gap-3 sm:gap-4 md:grid-cols-2">
              {spotlightProducts.map((product) => (
                <article key={product.id} className="group grid overflow-hidden rounded-vl-card bg-vl-ink text-white grid-cols-1 sm:grid-cols-[0.9fr_1.1fr]">
                  <div className="relative min-h-[280px] sm:min-h-[320px] bg-vl-border">
                    <Image src={product.images?.[0]?.url || "/placeholder.jpg"} alt={product.name} fill sizes="(max-width: 640px) 100vw, 30vw" className="object-cover transition duration-500 group-hover:scale-105" />
                    <WishlistIconButton productId={product.id} isLoggedIn={!!session?.user} initialIsWishlisted={wishlistIds.includes(product.id)} />
                  </div>
                  <div className="flex flex-col justify-center p-4 sm:p-7">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-white/55">{product.seller.businessName}</p>
                    <h3 className="mt-1 sm:mt-3 font-vl-heading text-lg sm:text-2xl font-bold leading-tight tracking-[-0.04em]">{product.name}</h3>
                    <div className="mt-2 sm:mt-5 flex items-baseline gap-2 sm:gap-3">
                      <span className="font-vl-heading text-lg sm:text-2xl font-bold">{formatPrice(product.price)}</span>
                      <span className="text-xs sm:text-sm text-white/45 line-through">{formatPrice(product.price * 1.4)}</span>
                    </div>
                    <Link href={`/products/${product.id}`} className="mt-4 sm:mt-6 inline-flex min-h-9 sm:min-h-11 w-fit items-center rounded-vl-control bg-vl-primary px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white transition hover:bg-vl-primary-strong">Shop this piece</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        <HomeEditorialCollections />
        {allSellers.length > 0 ? <HomeStoreRow sellers={allSellers} /> : null}
        {suggestedProducts.length > 0 ? <section className="vl-section-shell mt-16 sm:mt-24"><div className="flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">New arrivals</p><h2 className="font-vl-heading text-2xl font-bold tracking-[-0.04em] text-vl-ink sm:text-3xl">Fresh from the labels</h2></div><Link href="/products?sort=newest" className="hidden rounded-vl-control px-3 py-2 text-sm font-semibold text-vl-muted transition hover:bg-vl-card hover:text-vl-primary sm:inline-flex">See newness</Link></div><div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">{suggestedProducts.map(productCard)}</div></section> : null}
        {sellerSpotlights.length > 0 ? <HomeSellerSpotlight sellers={sellerSpotlights} /> : null}
        {trendingProducts.length > 0 ? <section className="vl-section-shell mt-16 sm:mt-24"><div className="flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">Best sellers</p><h2 className="font-vl-heading text-2xl font-bold tracking-[-0.04em] text-vl-ink sm:text-3xl">Your next wardrobe staple</h2></div><span className="hidden text-sm text-vl-muted sm:inline">{trendingCount.toLocaleString("en-IN")} pieces to discover</span></div><div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">{trendingProducts.map(productCard)}</div>{currentPage < totalPages ? <div className="mt-8 flex justify-center"><Link href={`/?page=${currentPage + 1}`} className="inline-flex min-h-11 items-center rounded-vl-control border border-vl-border bg-vl-card px-5 text-sm font-semibold text-vl-ink transition hover:border-vl-primary hover:text-vl-primary">Load more</Link></div> : null}</section> : null}
        <HomeInspiration />
        <HomeTrustStrip />
        <HomeNewsletter />
      </main>
    </div>
  );
}
