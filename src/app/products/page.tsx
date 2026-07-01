import React, { Suspense } from "react";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserReservations } from "@/lib/redis";
import CatalogPage from "@/features/catalog/pages/CatalogPage";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
    sort?: string;
    priceRange?: string;
    rating?: string;
    discount?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q || "";
  const category = params.category || "";

  let title = "Products | MINIBRANDS";
  if (q) {
    title = `Search Results for "${q}" | MINIBRANDS`;
  } else if (category && category !== "All") {
    title = `${category} Products | MINIBRANDS`;
  }

  return {
    title,
    description: "Explore curated items, streetwear, handlooms, and accessories from verified boutiques in Chennai.",
  };
}

export default async function PublicCatalogPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let userProfile = null;
  let cartCount = 0;
  let sellerHref = "/login?role=seller";

  if (session?.user) {
    userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        seller: {
          include: {
            verification: true,
          },
        },
      },
    });

    if (userProfile?.role === "SELLER") {
      const ver = userProfile.seller?.verification;
      const isVerified =
        ver &&
        (ver.kycStatus === "auto_approved" || ver.kycStatus === "approved") &&
        ver.bankVerified;
      sellerHref = isVerified ? "/seller/dashboard" : "/seller/onboarding";
    }

    if (userProfile) {
      const reservations = await getUserReservations(userProfile.id);
      cartCount = reservations.reduce((acc, curr) => acc + curr.quantity, 0);
    }
  }

  // Format the userProfile object securely to pass to the client component
  let formattedUserProfile = null;
  if (userProfile) {
    formattedUserProfile = {
      id: userProfile.id,
      role: userProfile.role,
      user: {
        name: userProfile.user.name,
        email: userProfile.user.email,
        image: userProfile.user.image,
      },
      seller: userProfile.seller
        ? {
            id: userProfile.seller.id,
            businessName: userProfile.seller.businessName,
            storeName: userProfile.seller.storeName,
            storeLogo: userProfile.seller.storeLogo,
          }
        : null,
    };
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <CatalogPage
        userProfile={formattedUserProfile}
        initialCartCount={cartCount}
        sellerHref={sellerHref}
      />
    </Suspense>
  );
}
