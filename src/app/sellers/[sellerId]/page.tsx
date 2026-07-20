import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import SellerStorefrontClient from "@/components/seller/SellerStorefrontClient";

interface PageProps {
  params: Promise<{
    sellerId: string;
  }>;
}

// 1. Dynamic SEO Metadata Generation for Seller Storefront
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sellerId } = await params;

  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    include: {
      verification: true,
    },
  });

  if (!seller) {
    return {
      title: "Seller Storefront Not Found | Velvet Lane",
    };
  }

  if (!seller.verification) {
    return {
      title: "Storefront Unavailable | Velvet Lane",
    };
  }

  return {
    title: `${seller.storeName || seller.businessName} | Fashion Boutique in ${seller.city} | Velvet Lane`,
    description: `Shop verified fashion boutique ${seller.storeName || seller.businessName} from ${seller.city}, India. Discover handpicked ethnic wear, custom designs, and streetwear with secure escrow checkouts.`,
    openGraph: {
      title: `${seller.storeName || seller.businessName} Storefront | Velvet Lane`,
      description: `Verified independent fashion boutique from ${seller.city}. Shop local with escrow payment protection.`,
    },
  };
}

export default async function SellerStorefrontPage({ params }: PageProps) {
  const { sellerId } = await params;

  // 2. Fetch Seller details with verification and their active published products
  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    include: {
      verification: true,
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

  if (!seller) {
    notFound();
  }

  if (!seller.verification) {
    notFound();
  }

  const isSellerVerified =
    seller.verification &&
    (seller.verification.kycStatus === "auto_approved" ||
      seller.verification.kycStatus === "approved") &&
    seller.verification.bankVerified;

  // 3. Construct LocalBusiness JSON-LD Schema
  const coverImage = seller.products[0]?.images[0]?.url || "https://res.cloudinary.com/velvetlane/image/upload/placeholder.jpg";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": seller.storeName || seller.businessName,
    "image": coverImage,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": seller.city,
      "addressRegion": "Tamil Nadu",
      "addressCountry": "IN",
    },
    "priceRange": "₹₹",
    "telephone": "",
  };

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
      verification: {
        kycStatus: seller.verification!.kycStatus,
        bankVerified: seller.verification!.bankVerified,
      },
    },
  }));

  const joinedYear = new Date(seller.createdAt).getFullYear();

  // Fetch reviews distribution for seller
  const reviewGroups = await prisma.review.groupBy({
    by: ["rating"],
    where: { sellerId: seller.id, isVisible: true },
    _count: { rating: true },
  });

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviewGroups.forEach((g) => {
    distribution[g.rating] = g._count.rating;
  });

  // Fetch initial reviews
  const initialReviews = await prisma.review.findMany({
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
  });

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

  const avgAggregate = await prisma.review.aggregate({
    where: { sellerId: seller.id, isVisible: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const averageRating = avgAggregate._avg.rating ?? 0;
  const reviewCount = avgAggregate._count.rating ?? 0;

  const reviewSummary = {
    averageRating,
    reviewCount,
    distribution,
  };

  return (
    <>
      {/* Inject LocalBusiness Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SellerStorefrontClient
        seller={seller}
        isSellerVerified={!!isSellerVerified}
        joinedYear={joinedYear}
        formattedProducts={formattedProducts}
        reviewSummary={reviewSummary}
        formattedInitialReviews={formattedInitialReviews}
      />
    </>
  );
}
