"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
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
 * Follows a seller. Idempotent — safe to call when already following.
 */
export async function followSellerAction(sellerId: string) {
  const profile = await getProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized" };
  }

  const seller = await prisma.seller.findUnique({ where: { id: sellerId }, select: { id: true } });
  if (!seller) {
    return { success: false, error: "Store not found" };
  }

  await prisma.sellerFollow.upsert({
    where: { userProfileId_sellerId: { userProfileId: profile.id, sellerId } },
    create: { userProfileId: profile.id, sellerId },
    update: {},
  });

  return { success: true };
}

/**
 * Unfollows a seller. Idempotent — safe to call when not following.
 */
export async function unfollowSellerAction(sellerId: string) {
  const profile = await getProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.sellerFollow.deleteMany({
    where: { userProfileId: profile.id, sellerId },
  });

  return { success: true };
}