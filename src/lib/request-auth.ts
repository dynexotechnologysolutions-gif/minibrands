import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface UserProfileData {
  id: string;
  userId: string;
  role: "BUYER" | "SELLER" | "ADMIN" | "SUPER_ADMIN";
  user: {
    id?: string;
    name: string;
    email: string;
    image?: string | null;
  };
  seller?: {
    id: string;
    businessName: string;
    storeName: string;
    storeLogo?: string | null;
    status?: string;
    verification?: {
      kycStatus: string;
      bankVerified: boolean;
      trustScore?: number;
    } | null;
  } | null;
  addresses?: Array<{
    id: string;
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    pincode: string;
    isDefault: boolean;
    isDeleted: boolean;
  }>;
}

/**
 * Request-level memoized session retriever.
 * Scoped strictly to the lifecycle of a single incoming HTTP request via React cache().
 */
export const getRequestSession = cache(async () => {
  try {
    const reqHeaders = await headers();
    return await auth.api.getSession({ headers: reqHeaders });
  } catch (error) {
    console.error("getRequestSession error:", error);
    return null;
  }
});

/**
 * Request-level memoized UserProfile retriever.
 * Includes user, seller (with verification), and non-deleted addresses.
 * Scoped to a single request lifecycle.
 */
export const getRequestUserProfile = cache(async (userId: string): Promise<UserProfileData | null> => {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        seller: {
          include: {
            verification: true,
          },
        },
        addresses: {
          where: {
            isDeleted: false,
          },
        },
      },
    });

    if (!profile) return null;

    // Self-healing founder admin check matching RoleService
    if (profile.user.email === "sham1309kumar@gmail.com" && profile.role !== "ADMIN") {
      console.log(`getRequestUserProfile: Promoting founder email ${profile.user.email} to ADMIN.`);
      const updatedProfile = await prisma.userProfile.update({
        where: { id: profile.id },
        data: { role: "ADMIN" },
        include: {
          user: true,
          seller: {
            include: {
              verification: true,
            },
          },
          addresses: {
            where: {
              isDeleted: false,
            },
          },
        },
      });
      return updatedProfile as unknown as UserProfileData;
    }

    return profile as unknown as UserProfileData;
  } catch (error) {
    console.error("getRequestUserProfile error:", error);
    return null;
  }
});

/**
 * Unified auth helper that retrieves the memoized session and profile together.
 * Computes standard sellerHref for navigation.
 */
export const getRequestSessionAndProfile = cache(async () => {
  const session = await getRequestSession();

  if (!session?.user?.id) {
    return {
      session: null,
      userProfile: null,
      sellerHref: "/login?role=seller",
    };
  }

  const userProfile = await getRequestUserProfile(session.user.id);

  let sellerHref = "/login?role=seller";
  if (userProfile?.role === "SELLER") {
    const ver = userProfile.seller?.verification;
    const isVerified =
      ver &&
      (ver.kycStatus === "auto_approved" || ver.kycStatus === "approved") &&
      ver.bankVerified;
    sellerHref = isVerified ? "/seller/dashboard" : "/seller/onboarding";
  }

  return {
    session,
    userProfile,
    sellerHref,
  };
});
