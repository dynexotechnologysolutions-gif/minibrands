"use server";

import { redis } from "@/lib/redis";
import crypto from "crypto";

export interface CheckoutSessionProduct {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  size: string;
  image: string;
  sellerName: string;
  sellerId: string;
  reservationId?: string; // If it came from a cart reservation
}

export interface CheckoutSessionPayload {
  mode: "BUY_NOW" | "CART_CHECKOUT";
  products: CheckoutSessionProduct[];
  createdAt: string;
}

export async function createCheckoutSession(
  payload: Omit<CheckoutSessionPayload, "createdAt">
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  try {
    if (payload.products.length === 0) {
      return { success: false, error: "No products selected for checkout." };
    }

    // Check if all products belong to the same seller
    const firstSellerId = payload.products[0].sellerId;
    const sameSeller = payload.products.every((p) => p.sellerId === firstSellerId);
    if (!sameSeller) {
      return {
        success: false,
        error: "Checkout only supports purchasing items from a single boutique at a time. Please checkout items from each boutique separately.",
      };
    }

    const sessionId = crypto.randomUUID();
    const sessionKey = `checkout-session:${sessionId}`;

    const sessionData: CheckoutSessionPayload = {
      ...payload,
      createdAt: new Date().toISOString(),
    };

    // Store payload in Redis with 15-minute TTL (900 seconds)
    await redis.set(sessionKey, JSON.stringify(sessionData), { ex: 900 });

    return { success: true, sessionId };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create checkout session." };
  }
}
