import { NextResponse } from "next/server";
import { getOrCreateGuestCartId, clearGuestCartId } from "@/lib/guest-cookie";
import { addGuestCartItem, clearGuestCart } from "@/lib/guest-cart";

/**
 * Guest Cart item addition/reservation endpoint.
 * Ensures cryptographically secure session cookies are created.
 */
export async function POST(req: Request) {
  try {
    const { productId, variantId, quantity } = await req.json();

    if (!productId || !variantId || !quantity) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Resolve or generate secure HttpOnly guest ID
    const guestCartId = await getOrCreateGuestCartId();

    // Call service layer for stock validation and Redis persistence
    const result = await addGuestCartItem(guestCartId, productId, variantId, quantity);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to add item to cart" }, { status: 400 });
    }

    return NextResponse.json({ success: true, guestCartId });
  } catch (error: any) {
    console.error("[Guest Cart Reserve POST Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Guest Cart clearing endpoint.
 */
export async function DELETE() {
  try {
    const guestCartId = await getOrCreateGuestCartId();
    await clearGuestCart(guestCartId);
    await clearGuestCartId();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Guest Cart Reserve DELETE Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
