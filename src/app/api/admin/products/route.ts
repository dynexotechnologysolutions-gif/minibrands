import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await verifyAdminSession("moderate_products");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "ALL"; // ALL, PENDING, PUBLISHED, UNPUBLISHED

    const whereClause: any = { isDeleted: false };

    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { seller: { businessName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (filter === "PUBLISHED") whereClause.isPublished = true;
    if (filter === "UNPUBLISHED") whereClause.isPublished = false;

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        seller: true,
        images: true,
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      shortDescription: p.shortDescription,
      category: p.category,
      subcategory: p.subcategory,
      price: p.price / 100,
      isPublished: p.isPublished,
      publishedAt: p.publishedAt?.toISOString(),
      aiGenerated: p.aiGenerated,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
      sellerName: p.seller.businessName,
      sellerId: p.seller.id,
      stockCount: p.variants.reduce((sum, v) => sum + v.stockCount, 0),
      imageUrl: p.images[0]?.url || "/placeholder.png",
      images: p.images,
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch products." }, { status: 403 });
  }
}
