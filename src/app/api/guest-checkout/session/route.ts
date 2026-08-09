import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redis } from "@/lib/redis";
import crypto from "crypto";
import { getGuestCartItems } from "@/lib/guest-cart";

export interface GuestCheckoutSessionProduct {
  productId: string;
  variantId: string;
  quantity: number;
  size: string;
  image: string;
  sellerName: string;
  sellerId: string;
}

export interface GuestCheckoutSessionPayload {
  mode: "BUY_NOW" | "CART_CHECKOUT";
  guestCartId?: string; // present for CART_CHECKOUT path only
  products: GuestCheckoutSessionProduct[];
  createdAt: string;
}

/**
 * POST /api/guest-checkout/session
 *
 * Creates an ephemeral guest checkout session in Redis with a 15-minute TTL.
 * For Buy Now: payload comes from request body.
 * For Cart Checkout: payload is sourced from guest-cart cookie + Redis catalog.
 *
 * Returns { sessionId } that the client uses to navigate to /checkout/guest?sessionId=...
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mode: "BUY_NOW" | "CART_CHECKOUT" = body.mode;

    if (mode !== "BUY_NOW" && mode !== "CART_CHECKOUT") {
      return NextResponse.json({ error: "Invalid checkout mode" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const guestCartId = cookieStore.get("mb-guest-cart")?.value;

    let products: GuestCheckoutSessionProduct[] = [];

    if (mode === "BUY_NOW") {
      // For Buy Now: product details come directly in request body
      const { productId, variantId, quantity, size, image, sellerName, sellerId } = body;

      if (!productId || !variantId || !quantity || !sellerId) {
        return NextResponse.json({ error: "Missing required Buy Now product parameters" }, { status: 400 });
      }

      products = [{ productId, variantId, quantity, size: size || "", image: image || "", sellerName: sellerName || "", sellerId }];

    } else {
      // For Cart Checkout: load products from guest cart index
      if (!guestCartId) {
        return NextResponse.json({ error: "No guest cart session found. Please add items to cart first." }, { status: 400 });
      }

      const cartItems = await getGuestCartItems(guestCartId);
      if (!cartItems.length) {
        return NextResponse.json({ error: "Guest cart is empty or all reservations have expired." }, { status: 400 });
      }

      // Validate all items belong to same seller — enforced at payment time,
      // but we record them all for the session.
      products = cartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        size: "", // resolved from DB at checkout page render
        image: "",
        sellerName: "",
        sellerId: "",
      }));
    }

    const sessionId = crypto.randomUUID();
    const sessionKey = `guest-checkout-session:${sessionId}`;

    const sessionData: GuestCheckoutSessionPayload = {
      mode,
      guestCartId: mode === "CART_CHECKOUT" ? guestCartId : undefined,
      products,
      createdAt: new Date().toISOString(),
    };

    await redis.set(sessionKey, JSON.stringify(sessionData), { ex: 900 }); // 15 minutes

    return NextResponse.json({ success: true, sessionId });
  } catch (error: any) {
    console.error("[Guest Checkout Session Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
