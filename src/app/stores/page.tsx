import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getUserReservations } from "@/lib/redis";
import HomeHeader from "@/components/home/HomeHeader";
import HomeTrustStrip from "@/components/home/HomeTrustStrip";
import StoresIntro from "@/components/store/StoresIntro";
import StoresPageClient from "@/components/store/StoresPageClient";
import { StoreSummary } from "@/components/store/StoreCard";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  let userProfile = null;
  let cartCount = 0;
  let sellerHref = "/login?role=seller";
  let followedSellerIds: string[] = [];

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

      const follows = await prisma.sellerFollow.findMany({
        where: { userProfileId: userProfile.id },
        select: { sellerId: true },
      });
      followedSellerIds = follows.map((f) => f.sellerId);
    }
  }

  const verifiedSellers = await prisma.seller.findMany({
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
      coverImage: seller.storeBanner || seller.products[0]?.images[0]?.url || null,
      rating,
      reviewCount: seller._count.reviews,
      productCount: seller._count.products,
      trustScore: seller.verification?.trustScore || 0,
      isVerified,
      createdAt: seller.createdAt.toISOString(),
    };
  });

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white font-sans text-vl-ink">
      <HomeHeader userProfile={userProfile} cartCount={cartCount} sellerHref={sellerHref} />
      <main className="pb-[76px] pt-[108px] md:pb-0 md:pt-0">
        <div className="vl-section-shell">
          <StoresIntro />
          <StoresPageClient stores={stores} isLoggedIn={!!session?.user} initialFollowedIds={followedSellerIds} />
        </div>

        {/* Existing trust section */}
        <HomeTrustStrip />
      </main>
    </div>
  );
}