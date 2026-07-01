"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

// Helper to retrieve the authenticated user profile
async function getProfile() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user) return null;

  return prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });
}

/**
 * Adds a product ID to the user's wishlist in Redis.
 */
export async function addToWishlistAction(productId: string) {
  const profile = await getProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized" };
  }

  const key = `wishlist:${profile.id}`;
  await redis.sadd(key, productId);
  return { success: true };
}

/**
 * Removes a product ID from the user's wishlist in Redis.
 */
export async function removeFromWishlistAction(productId: string) {
  const profile = await getProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized" };
  }

  const key = `wishlist:${profile.id}`;
  await redis.srem(key, productId);
  return { success: true };
}

/**
 * Retrieves all product details currently in the user's wishlist.
 */
export async function getWishlistAction() {
  const profile = await getProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized" };
  }

  const key = `wishlist:${profile.id}`;
  const productIds = await redis.smembers(key);

  if (!productIds || productIds.length === 0) {
    return { success: true, products: [] };
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isDeleted: false,
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      seller: { include: { verification: true } },
      variants: true,
    },
  });

  // Reorder products to preserve the Redis set elements ordering (or default ordering)
  const orderedProducts = productIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);

  return { success: true, products: orderedProducts };
}
