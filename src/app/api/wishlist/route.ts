import { NextResponse } from "next/server";
import { getWishlistAction, addToWishlistAction } from "@/actions/wishlist.action";
import { enrichProductWithComputedFields } from "@/features/catalog/utils/deterministic";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await getWishlistAction();
    if (!res.success) {
      return NextResponse.json({ error: res.error || "Unauthorized" }, { status: 401 });
    }
    
    // Enrich with computed fields (mrp, rating, review count, discount, etc.)
    const dbProducts = (res.products || []).filter((p): p is any => !!p);
    const wishlistIds = dbProducts.map((p) => p.id);
    const enrichedProducts = dbProducts.map((p) => enrichProductWithComputedFields(p, wishlistIds));

    return NextResponse.json({ success: true, products: enrichedProducts });
  } catch (error) {
    console.error("Failed to get wishlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId } = body;
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const res = await addToWishlistAction(productId);
    if (!res.success) {
      return NextResponse.json({ error: res.error || "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to add to wishlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
