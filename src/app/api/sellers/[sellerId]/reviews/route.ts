import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
): Promise<NextResponse> {
  try {
    const { sellerId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "6", 10);

    const skip = page * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { sellerId, isVisible: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
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
      prisma.review.count({
        where: { sellerId, isVisible: true },
      }),
    ]);

    const hasMore = skip + reviews.length < total;

    return NextResponse.json({
      reviews: reviews.map((r) => ({
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
      })),
      hasMore,
      total,
    });
  } catch (error: any) {
    console.error("Failed to fetch seller reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
