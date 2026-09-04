import { cache } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getUserReservations } from "@/lib/redis";
import { getRequestSessionAndProfile } from "@/lib/request-auth";
import HomeHeader from "@/components/home/HomeHeader";
import MobileBottomNavigation from "@/components/mobile/MobileBottomNavigation";
import SellerStorefrontClient from "@/components/seller/SellerStorefrontClient";

interface PageProps {
  params: Promise<{
    sellerId: string;
  }>;
}


// Cached seller fetcher to share between generateMetadata and page render
const getCachedSeller = cache(async (sellerId: string) => {
  return prisma.seller.findUnique({
    where: { id: sellerId },
    include: {
      verification: true,
      userProfile: {
        include: {
          user: true,
        },
      },
      products: {
        where: {
          isDeleted: false,
          isPublished: true,
        },
        include: {
          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },
          variants: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
});

import { getCanonicalUrl } from "@/lib/seo/url";

// 1. Dynamic SEO Metadata Generation for Seller Storefront
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sellerId } = await params;

  const seller = await getCachedSeller(sellerId);

  if (!seller) {
    return {
      title: "Seller Storefront Not Found | MiniBrands",
    };
  }

  if (!seller.verification) {
    return {
      title: "Storefront Unavailable | MiniBrands",
    };
  }

  const storeName = seller.storeName || seller.businessName;
  const sellerUrl = getCanonicalUrl(`/sellers/${seller.id}`);
  const title = `${storeName} | Fashion Boutique in ${seller.city} | MiniBrands`;
  const description = `Shop verified fashion boutique ${storeName} from ${seller.city}, India. Discover handpicked ethnic wear, custom designs, and streetwear with secure escrow checkouts.`;
  const images = seller.storeBanner || seller.storeLogo ? [seller.storeBanner || seller.storeLogo!] : [];

  return {
    title,
    description,
    alternates: {
      canonical: sellerUrl,
    },
    openGraph: {
      title: `${storeName} Storefront | MiniBrands`,
      description: `Verified independent fashion boutique from ${seller.city}. Shop local with escrow payment protection.`,
      url: sellerUrl,
      siteName: "MiniBrands",
      locale: "en_IN",
      type: "profile",
      images: images.map((url) => ({ url })),
    },
    twitter: {
      card: "summary_large_image",
      title: `${storeName} Storefront | MiniBrands`,
      description: `Verified independent fashion boutique from ${seller.city}. Shop local with escrow payment protection.`,
      images,
    },
  };
}

export default async function SellerStorefrontPage({ params }: PageProps) {
  const { sellerId } = await params;

  // 2. Fetch Seller details using cached function
  const seller = await getCachedSeller(sellerId);

  if (!seller || !seller.verification) {
    notFound();
  }

  const isSellerVerified =
    seller.verification &&
    (seller.verification.kycStatus === "auto_approved" ||
      seller.verification.kycStatus === "approved") &&
    seller.verification.bankVerified;

  const sellerStoreName = seller.storeName || seller.businessName;
  const sellerUrl = getCanonicalUrl(`/sellers/${seller.id}`);
  const coverImage =
    seller.storeBanner ||
    seller.storeLogo ||
    "https://res.cloudinary.com/MiniBrands/image/upload/placeholder.jpg";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": getCanonicalUrl("/") },
          { "@type": "ListItem", "position": 2, "name": "Stores", "item": getCanonicalUrl("/stores") },
          { "@type": "ListItem", "position": 3, "name": sellerStoreName, "item": sellerUrl },
        ],
      },
      {
        "@type": "LocalBusiness",
        "name": sellerStoreName,
        "image": coverImage,
        "url": sellerUrl,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": seller.city,
          "addressRegion": "Tamil Nadu",
          "addressCountry": "IN",
        },
        "priceRange": "₹₹",
      },
    ],
  };

  const { userProfile, sellerHref } = await getRequestSessionAndProfile();
  let cartCount = 0;
  if (userProfile) {
    const reservations = await getUserReservations(userProfile.id);
    cartCount = reservations.reduce((acc, curr) => acc + curr.quantity, 0);
  }

  // Format products to match ProductCard expectations
  const formattedProducts = seller.products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    images: p.images.map((img) => ({
      url: img.url,
      cloudinaryPublicId: img.cloudinaryPublicId || "",
    })),
    variants: p.variants.map((v) => ({
      size: v.size,
      stockCount: v.stockCount,
    })),
    seller: {
      businessName: seller.storeName || seller.businessName,
      storeLogo: seller.storeLogo,
      verification: {
        kycStatus: seller.verification!.kycStatus,
        bankVerified: seller.verification!.bankVerified,
      },
    },
  }));

  const joinedYear = new Date(seller.createdAt).getFullYear();

  // Fetch reviews stats and initial list in parallel
  const [reviewGroups, initialReviews, avgAggregate] = await Promise.all([
    prisma.review.groupBy({
      by: ["rating"],
      where: { sellerId: seller.id, isVisible: true },
      _count: { rating: true },
    }),
    prisma.review.findMany({
      where: { sellerId: seller.id, isVisible: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        buyer: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    }),
    prisma.review.aggregate({
      where: { sellerId: seller.id, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviewGroups.forEach((g) => {
    distribution[g.rating] = g._count.rating;
  });

  const averageRating = avgAggregate._avg.rating ?? 0;
  const reviewCount = avgAggregate._count.rating ?? 0;

  const formattedInitialReviews = initialReviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment || "",
    photoUrls: r.photoUrls,
    createdAt: r.createdAt.toISOString(),
    buyer: {
      user: {
        name: r.buyer.user.name,
      },
    },
  }));

  const reviewSummary = {
    averageRating,
    reviewCount,
    distribution,
  };

  return (
    <div className="bg-vl-surface min-h-screen">
      <HomeHeader userProfile={userProfile} cartCount={cartCount} sellerHref={sellerHref} variant="green" />
      {/* Inject LocalBusiness Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <SellerStorefrontClient
        seller={seller}
        isSellerVerified={!!isSellerVerified}
        joinedYear={joinedYear}
        formattedProducts={formattedProducts}
        reviewSummary={reviewSummary}
        formattedInitialReviews={formattedInitialReviews}
      />
      <MobileBottomNavigation userProfile={userProfile} cartCount={cartCount} />
    </div>
  );
}
