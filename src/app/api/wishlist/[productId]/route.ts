import { NextResponse } from "next/server";
import { removeFromWishlistAction } from "@/actions/wishlist.action";

interface ParamsProps {
  params: Promise<{
    productId: string;
  }>;
}

export async function DELETE(request: Request, { params }: ParamsProps) {
  try {
    const resolvedParams = await params;
    const { productId } = resolvedParams;
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const res = await removeFromWishlistAction(productId);
    if (!res.success) {
      return NextResponse.json({ error: res.error || "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove from wishlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
