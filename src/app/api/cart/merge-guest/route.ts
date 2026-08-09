import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { mergeGuestCart } from "@/lib/cart-merge.service";

/**
 * POST /api/cart/merge-guest
 *
 * Called after login to merge the guest cart into the authenticated user's cart.
 * Reads the mb-guest-cart cookie (set server-side as HttpOnly).
 *
 * This endpoint is idempotent — if there is no guest cart cookie, it returns success
 * without doing anything.
 */
export async function POST() {
  try {
    // 1. Verify session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Read guest cart cookie
    const cookieStore = await cookies();
    const guestCartId = cookieStore.get("mb-guest-cart")?.value;

    if (!guestCartId) {
      // No guest cart to merge — this is normal after account-only checkout
      return NextResponse.json({ success: true, mergedCount: 0, skippedVariants: [] });
    }

    // 3. Merge guest cart into authenticated user's reservation keys
    const result = await mergeGuestCart(guestCartId, session.user.id);

    if (!result.success) {
      console.error("[MergeGuestCart API] Merge failed:", result.error);
      return NextResponse.json({ error: result.error || "Cart merge failed" }, { status: 500 });
    }

    // 4. Clear the guest cart cookie after successful merge
    const response = NextResponse.json({
      success: true,
      mergedCount: result.mergedCount,
      skippedVariants: result.skippedVariants,
    });

    response.cookies.set("mb-guest-cart", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Delete cookie
    });

    return response;
  } catch (error: any) {
    console.error("[MergeGuestCart API ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
