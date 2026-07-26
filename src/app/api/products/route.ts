import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redis } from "@/lib/redis";
import { enrichProductWithComputedFields, getProductDiscountAndMrp, getProductRatingAndReviews } from "@/features/catalog/utils/deterministic";

export const dynamic = "force-dynamic";

async function getWishlistProductIds() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || !session.user) return [];
    
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) return [];
    
    const key = `wishlist:${profile.id}`;
    return await redis.smembers(key) || [];
  } catch (error) {
    console.error("Failed to get wishlist product IDs:", error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const priceRange = searchParams.get("priceRange") || "";
    const ratingParam = searchParams.get("rating") || "";
    const discountParam = searchParams.get("discount") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const sort = searchParams.get("sort") || "popularity";

    const wishlistIds = await getWishlistProductIds();

    // 1. Prisma base filters
    const whereClause: any = {
      isDeleted: false,
      isPublished: true,
      status: "PUBLISHED",
      seller: {
        status: "APPROVED",
      },
    };

    if (category && category !== "All") {
      whereClause.category = category;
    }

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ];
    }

    if (priceRange) {
      const parts = priceRange.split("-");
      const minPrice = parseFloat(parts[0] || "0");
      const maxPrice = parseFloat(parts[1] || "999999");
      
      const minPaise = minPrice * 100;
      const maxPaise = maxPrice * 100;

      if (maxPrice >= 10000) {
        whereClause.price = { gte: minPaise };
      } else {
        whereClause.price = { gte: minPaise, lte: maxPaise };
      }
    }

    // Fetch lightweight list of all matching products to apply computed field filters/sorting
    const allMatchingProducts = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        price: true,
        createdAt: true,
      },
    });

    // 2. Enrich with minimal computed fields for filtering & sorting in memory
    let productsForFiltering = allMatchingProducts.map((p) => {
      const { discountPercent } = getProductDiscountAndMrp(p.price, p.id);
      const { rating, reviewCount } = getProductRatingAndReviews(p.id);
      return {
        id: p.id,
        price: p.price,
        createdAt: p.createdAt,
        discountPercent,
        rating,
        reviewCount,
      };
    });

    // Rating Filter
    if (ratingParam) {
      const minRating = parseFloat(ratingParam);
      if (!isNaN(minRating)) {
        productsForFiltering = productsForFiltering.filter((p) => p.rating >= minRating);
      }
    }

    // Discount Filter
    if (discountParam) {
      const minDiscount = parseFloat(discountParam);
      if (!isNaN(minDiscount)) {
        productsForFiltering = productsForFiltering.filter((p) => p.discountPercent >= minDiscount);
      }
    }

    // 4. Sort
    if (sort === "price_asc") {
      productsForFiltering.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      productsForFiltering.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      productsForFiltering.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === "rating") {
      productsForFiltering.sort((a, b) => b.rating - a.rating);
    } else {
      // default: popularity (reviewCount)
      productsForFiltering.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    // 5. Paginate
    const totalItems = productsForFiltering.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const paginatedItems = productsForFiltering.slice(offset, offset + limit);
    const paginatedIds = paginatedItems.map((p) => p.id);

    if (paginatedIds.length === 0) {
      return NextResponse.json({
        products: [],
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
        },
      });
    }

    // Fetch full details using targeted select blocks only for the paginated IDs
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: paginatedIds },
      },
      select: {
        id: true,
        sellerId: true,
        name: true,
        shortDescription: true,
        fullDescription: true,
        category: true,
        subcategory: true,
        tags: true,
        price: true,
        isPublished: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        images: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            productId: true,
            url: true,
            sortOrder: true,
          },
        },
        variants: {
          select: {
            id: true,
            productId: true,
            size: true,
            stockCount: true,
          },
        },
        seller: {
          select: {
            id: true,
            businessName: true,
            storeName: true,
            storeLogo: true,
            verification: {
              select: {
                kycStatus: true,
                bankVerified: true,
                trustScore: true,
              },
            },
          },
        },
      },
    });

    // Map dbProducts back to the correct sorted order of paginatedIds
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    const orderedProducts = paginatedIds
      .map((id) => productMap.get(id))
      .filter(Boolean);

    // Enrich with full computed fields
    const enrichedProducts = orderedProducts.map((p) => enrichProductWithComputedFields(p, wishlistIds));

    return NextResponse.json({
      products: enrichedProducts,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Failed to list products:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
