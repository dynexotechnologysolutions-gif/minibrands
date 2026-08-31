import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserReservations } from "@/lib/redis";
import { getRequestSessionAndProfile } from "@/lib/request-auth";
import HomeHeader from "@/components/home/HomeHeader";
import HomeTrustStrip from "@/components/home/HomeTrustStrip";
import StoresPageClient from "@/components/store/StoresPageClient";
import { StoreSummary } from "@/components/store/StoreCard";

export const dynamic = "force-dynamic";

const getCachedVerifiedSellers = unstable_cache(
  async () => {
    return prisma.seller.findMany({
      where: {
        verification: { kycStatus: { in: ["auto_approved", "approved"] }, bankVerified: true },
        products: { some: { isPublished: true, isDeleted: false } },
      },
      include: {
        userProfile: { include: { user: true } },
        verification: true,
        reviews: { select: { rating: true } },
        products: {
          where: { isPublished: true, isDeleted: false },
          include: { images: { orderBy: { sortOrder: "asc" } } },
          take: 1,
        },
        _count: { select: { products: true, reviews: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },
  ["verified-sellers-list"],
  { revalidate: 60, tags: ["stores", "sellers"] }
);

export default async function StoresPage() {
  const { session, userProfile, sellerHref } = await getRequestSessionAndProfile();

  const [allReservations, follows, verifiedSellers] = await Promise.all([
    userProfile ? getUserReservations(userProfile.id) : Promise.resolve([]),
    userProfile
      ? prisma.sellerFollow.findMany({
          where: { userProfileId: userProfile.id },
          select: { sellerId: true },
        })
      : Promise.resolve([]),
    getCachedVerifiedSellers(),
  ]);

  const cartCount = allReservations.reduce((acc, curr) => acc + curr.quantity, 0);
  const followedSellerIds = follows.map((f) => f.sellerId);

  const stores: StoreSummary[] = verifiedSellers.map((seller) => {
    const rating = seller.reviews.length
      ? Math.round((seller.reviews.reduce((sum, review) => sum + review.rating, 0) / seller.reviews.length) * 10) / 10
      : 0;
    const isVerified =
      !!seller.verification &&
      (seller.verification.kycStatus === "auto_approved" || seller.verification.kycStatus === "approved") &&
      seller.verification.bankVerified;

    return {
      id: seller.id,
      name: seller.storeName || seller.businessName,
      category: seller.category,
      city: seller.city,
      logoUrl: seller.storeLogo || null,
      coverImage: seller.storeBanner || null,
      rating,
      reviewCount: seller._count.reviews,
      productCount: seller._count.products,
      trustScore: seller.verification?.trustScore || 0,
      isVerified,
      createdAt: new Date(seller.createdAt).toISOString(),
      description: seller.storeDescription || "",
    };
  });

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-vl-surface font-sans text-vl-ink">
      <HomeHeader userProfile={userProfile} cartCount={cartCount} sellerHref={sellerHref} />
      <main className="pb-[76px] pt-[calc(96px+env(safe-area-inset-top))] md:pb-0 md:pt-6">
        <div className="vl-section-shell">
          <StoresPageClient stores={stores} isLoggedIn={!!session?.user} initialFollowedIds={followedSellerIds} />
        </div>

        {/* Existing trust section */}
        <HomeTrustStrip />
      </main>
    </div>
  );
}