import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductGrid from "@/components/product/ProductGrid";
import { BadgeCheck, ShieldCheck, MapPin, Store, Calendar, ArrowLeft } from "lucide-react";
import ReviewGallery from "@/components/review/ReviewGallery";


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
    title: `${seller.businessName} | Fashion Boutique in ${seller.city} | Velvet Lane`,
    description: `Shop verified fashion boutique ${seller.businessName} from ${seller.city}, India. Discover handpicked ethnic wear, custom designs, and streetwear with secure escrow checkouts.`,
    openGraph: {
      title: `${seller.businessName} Storefront | Velvet Lane`,
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
    "name": seller.businessName,
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
      cloudinaryPublicId: img.cloudinaryPublicId,
    })),
    variants: p.variants.map((v) => ({
      size: v.size,
      stockCount: v.stockCount,
    })),
    seller: {
      businessName: seller.businessName,
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
    comment: r.comment,
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
    <main className="min-h-screen pb-16">
      {/* Inject LocalBusiness Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Banner Header */}
      <div 
        className="h-44 sm:h-56 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-cover bg-center relative shadow-inner"
        style={seller.storeBanner ? { backgroundImage: `url('${seller.storeBanner}')` } : {}}
      >
        <div className="absolute inset-0 bg-slate-900/15 backdrop-brightness-90" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end relative z-10 pb-6">
          <Link
            href="/products"
            className="absolute top-6 left-6 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/30 hover:bg-white/40 text-white backdrop-blur text-xs font-bold rounded-lg border border-white/20 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
            <span>Catalog</span>
          </Link>
        </div>
      </div>

      {/* Profile Overlapping Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14 relative z-20">
        <div className="glass-panel bg-white/95 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar and Info */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-indigo-600 to-pink-500 text-white rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-extrabold font-display border-4 border-white shadow-lg shrink-0 overflow-hidden">
              {seller.storeLogo ? (
                <img src={seller.storeLogo} alt={seller.storeName || seller.businessName} className="w-full h-full object-cover" />
              ) : (
                seller.businessName.charAt(0).toUpperCase()
              )}
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black font-display text-slate-900 tracking-tight">
                  {seller.storeName || seller.businessName}
                </h1>
                {isSellerVerified ? (
                  <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                    <BadgeCheck className="w-3.5 h-3.5 fill-emerald-50 text-emerald-700" />
                    <span>Verified Boutique</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase">
                    <span>Identity Under Review</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-semibold">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{seller.city}, India</span>
                </span>
                <span className="hidden sm:inline text-slate-300">&bull;</span>
                <span className="flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  <span>{seller.category}</span>
                </span>
                <span className="hidden sm:inline text-slate-300">&bull;</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Member since {joinedYear}</span>
                </span>
              </div>
              {seller.storeDescription && (
                <p className="text-xs text-slate-600 mt-2 max-w-[576px] border-l-2 border-indigo-500 pl-3 leading-relaxed">
                  {seller.storeDescription}
                </p>
              )}
            </div>
          </div>

          {/* Verification Details Panel */}
          <div className="p-4 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl flex items-center gap-4 self-stretch md:self-auto justify-around md:justify-start">
            <div className="text-center md:text-left">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                Verification Identity
              </span>
              <span className="text-xs font-extrabold text-indigo-950 block mt-0.5">
                KYC Completed
              </span>
            </div>
            <div className="w-px h-8 bg-indigo-100" />
            <div className="text-center md:text-left">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                Escrow Protection
              </span>
              <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1 mt-0.5 justify-center md:justify-start">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Active</span>
              </span>
            </div>
            <div className="w-px h-8 bg-indigo-100" />
            <div className="text-center md:text-left">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                Trust Score
              </span>
              <span className="text-xs font-extrabold text-emerald-600 block mt-0.5">
                {seller.verification?.trustScore || 95}%
              </span>
            </div>
          </div>
        </div>
        {!isSellerVerified && (
          <div className="mt-4 p-4 bg-amber-50/70 border border-amber-200/50 text-amber-950 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-sm animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>Storefront Pending Verification: This store is currently undergoing KYC review. Its items are hidden from public catalog search.</span>
          </div>
        )}
      </div>

      {/* Catalog items section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="border-b border-slate-100 pb-4 mb-8 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold font-display text-slate-800">
            Store Collection
          </h2>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            {formattedProducts.length} items listed
          </span>
        </div>

        {formattedProducts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-200 rounded-3xl bg-white max-w-[448px] mx-auto shadow-sm">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No active products</h3>
            <p className="text-xs text-slate-400 mt-1">
              This seller hasn&apos;t published any items in their store yet.
            </p>
          </div>
        ) : (
          <ProductGrid products={formattedProducts} />
        )}
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-100">
        <h2 className="text-lg sm:text-xl font-bold font-display text-slate-800 mb-8">
          Boutique Reviews
        </h2>
        <ReviewGallery
          sellerId={seller.id}
          initialSummary={reviewSummary}
          initialReviews={formattedInitialReviews}
        />
      </div>
    </main>
  );
}

