import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redis } from "@/lib/redis";
import { enrichProductWithComputedFields } from "@/features/catalog/utils/deterministic";

export const dynamic = "force-dynamic";

async function getWishlistProductIds() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || !session.user) return [];
    
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
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
      seller: {
        verification: {
          kycStatus: { in: ["auto_approved", "approved"] },
          bankVerified: true,
        },
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

    const dbProducts = await prisma.product.findMany({
      where: whereClause,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        seller: { include: { verification: true } },
      },
    });

    // 2. Enrich with computed fields
    let products = dbProducts.map((p) => enrichProductWithComputedFields(p, wishlistIds));

    // 3. Filter in-memory
    // Price Range Filter
    if (priceRange) {
      const parts = priceRange.split("-");
      const minPrice = parseFloat(parts[0] || "0");
      const maxPrice = parseFloat(parts[1] || "999999");
      
      const minPaise = minPrice * 100;
      const maxPaise = maxPrice * 100;

      products = products.filter((p) => {
        if (maxPrice >= 10000) {
          // treat ₹10,000+ as unlimited max
          return p.price >= minPaise;
        }
        return p.price >= minPaise && p.price <= maxPaise;
      });
    }

    // Rating Filter
    if (ratingParam) {
      const minRating = parseFloat(ratingParam);
      if (!isNaN(minRating)) {
        products = products.filter((p) => p.rating >= minRating);
      }
    }

    // Discount Filter
    if (discountParam) {
      const minDiscount = parseFloat(discountParam);
      if (!isNaN(minDiscount)) {
        products = products.filter((p) => p.discountPercent >= minDiscount);
      }
    }

    // 4. Sort
    if (sort === "price_asc") {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === "rating") {
      products.sort((a, b) => b.rating - a.rating);
    } else {
      // default: popularity
      products.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    // 5. Paginate
    const totalItems = products.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const paginatedProducts = products.slice(offset, offset + limit);

    return NextResponse.json({
      products: paginatedProducts,
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
