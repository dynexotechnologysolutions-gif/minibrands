import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { trackEvent } from "@/lib/posthog";
import { redis, getUserReservations } from "@/lib/redis";
import ProductDetailClient from "./ProductDetailClient";

interface PageProps {
  params: Promise<{
    productId: string;
  }>;
}

// 1. Dynamic SEO Metadata Generation
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: true,
      seller: {
        include: {
          verification: true,
        },
      },
    },
  });

  if (!product || product.isDeleted || !product.isPublished) {
    return {
      title: "Product Not Found | Velvet Lane",
    };
  }

  const isSellerVerified =
    product.seller.verification &&
    (product.seller.verification.kycStatus === "auto_approved" ||
      product.seller.verification.kycStatus === "approved") &&
    product.seller.verification.bankVerified;

  if (!isSellerVerified) {
    return {
      title: "Product Not Available | Velvet Lane",
    };
  }

  return {
    title: `${product.name} | ${product.seller.businessName} on Velvet Lane`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} | ${product.seller.businessName}`,
      description: product.shortDescription,
      images: product.images?.[0] ? [{ url: product.images[0].url }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { productId } = await params;

  // 2. Query product with images, variants, and seller verification + userProfile for seller logo
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      variants: true,
      seller: {
        include: {
          userProfile: {
            include: {
              user: true,
            },
          },
          verification: true,
        },
      },
    },
  });

  // Verify product eligibility for public listing
  if (!product || product.isDeleted || !product.isPublished) {
    notFound();
  }

  const isSellerVerified =
    product.seller.verification &&
    (product.seller.verification.kycStatus === "auto_approved" ||
      product.seller.verification.kycStatus === "approved") &&
    product.seller.verification.bankVerified;

  if (!isSellerVerified) {
    notFound();
  }

  // Fetch session to track product_viewed and load user identity
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const distinctId = session?.user?.id || "anonymous";
  trackEvent(distinctId, "product_viewed", {
    productId: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    sellerId: product.sellerId,
  });

  // Load userProfile & cartCount if authenticated
  let userProfile = null;
  let cartCount = 0;
  let initialIsWishlisted = false;

  if (session?.user) {
    userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        seller: {
          include: {
            verification: true,
          },
        },
      },
    });

    if (userProfile) {
      const reservations = await getUserReservations(userProfile.id);
      cartCount = reservations.reduce((acc, curr) => acc + curr.quantity, 0);

      // Check if product is in wishlist
      const wishlistKey = `wishlist:${userProfile.id}`;
      const isMember = await redis.sismember(wishlistKey, product.id);
      initialIsWishlisted = isMember === 1;
    }
  }

  // Query similar products (same category)
  const similarProducts = await prisma.product.findMany({
    where: {
      category: product.category,
      id: { not: product.id },
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
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      seller: true,
    },
    take: 8,
  });

  // Query fallback products for recently viewed
  const recentlyViewedFallback = await prisma.product.findMany({
    where: {
      id: {
        notIn: [product.id, ...similarProducts.map((p) => p.id)],
      },
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
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      seller: true,
    },
    take: 6,
  });

  // 3. Construct Product JSON-LD Schema
  const hasInStock = product.variants.some((v) => v.stockCount > 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images.map((img) => img.url),
    "description": product.shortDescription,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": (product.price / 100).toFixed(2),
      "availability": hasInStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "LocalBusiness",
        "name": product.seller.businessName,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": product.seller.city,
          "addressRegion": "Tamil Nadu",
          "addressCountry": "IN",
        },
      },
    },
  };

  // Convert schema object to raw props matching the form expectation
  const formattedProduct = {
    id: product.id,
    name: product.name,
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    category: product.category,
    subcategory: product.subcategory,
    tags: product.tags,
    price: product.price,
    isPublished: product.isPublished,
    aiGenerated: product.aiGenerated,
    images: product.images.map((img) => ({
      url: img.url,
      cloudinaryPublicId: img.cloudinaryPublicId,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size,
      stockCount: v.stockCount,
    })),
    seller: {
      id: product.seller.id,
      businessName: product.seller.businessName,
      city: product.seller.city,
      logoUrl: product.seller.storeLogo || product.seller.userProfile?.user?.image || null,
      verification: product.seller.verification
        ? {
            kycStatus: product.seller.verification.kycStatus,
            bankVerified: product.seller.verification.bankVerified,
            trustScore: product.seller.verification.trustScore,
          }
        : null,
    },
  };

  const formattedSimilarProducts = similarProducts.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    images: p.images.map((img) => ({ url: img.url })),
    seller: {
      businessName: p.seller.businessName,
    },
  }));

  const formattedRecentlyViewed = recentlyViewedFallback.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    images: p.images.map((img) => ({ url: img.url })),
    seller: {
      businessName: p.seller.businessName,
    },
  }));

  // Fetch reviews distribution
  const reviewGroups = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId: product.id, isVisible: true },
    _count: { rating: true },
  });

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviewGroups.forEach((g) => {
    distribution[g.rating] = g._count.rating;
  });

  // Fetch initial reviews
  const initialReviews = await prisma.review.findMany({
    where: { productId: product.id, isVisible: true },
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
  });

  const formattedInitialReviews = initialReviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    photoUrls: r.photoUrls,
    createdAt: r.createdAt.toISOString(),
    buyer: {
      user: {
        name: r.buyer.user.name,
      },
    },
  }));

  const reviewSummary = {
    averageRating: product.averageRating,
    reviewCount: product.reviewCount,
    distribution,
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ProductDetailClient
        product={formattedProduct}
        userProfile={userProfile}
        cartCount={cartCount}
        similarProducts={formattedSimilarProducts}
        recentlyViewed={formattedRecentlyViewed}
        initialIsWishlisted={initialIsWishlisted}
        reviewSummary={reviewSummary}
        initialReviews={formattedInitialReviews}
      />
    </div>
  );
}


