import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redis, getUserReservations } from "@/lib/redis";
import WishlistClient, { WishlistProduct } from "../../wishlist/WishlistClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Wishlist | MINIBRANDS",
  robots: {
    index: false,
    follow: false,
  },
};

const mockRecentlyViewed = [
  {
    id: "rv-mock-1",
    name: "Classic White Sneakers",
    price: 299900,
    category: "Shoes",
    images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB8bo0F_c2tZ8uYsDg63Hl5mU5vi07wZnXoIynWqbviQAcE7kRk4bwhG-Zf08V__FAzbnPVoI8-z6nM8dD_-OCF1L0Io28VidLdek861Z7HE-0J4Rapa2B7EP6QPJfkiFQl9LTvjyxQIHctVgk4BLcOAibSrYqLvFIt-ixYMbAA9OYxHuGU55OP6RMz9rGH4J1Vl6UJhZaCMSqDzzMFQ1V1udnLvrxMEu1Q38sOj5rh_y2-ZdGRrwthxSKz12jxAhBinq6k-NXMkMH_" }],
    seller: { businessName: "MINIBRANDS" },
    variants: []
  },
  {
    id: "rv-mock-2",
    name: "Essential Acc. Set",
    price: 449900,
    category: "Accessories",
    images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuALVlpoczr3zjbFrvOfSrb49al8XKFYu734hG9EZ2zPSQPH7apIz2f2JkzDXOKRLXDPfvCaDMio9FpGB3Ghd9S8mXNx6cGKx-rafbNi0ctLad6JzAdp0HQJpMSy4PFZmNlYfHf6K5aarRfOIHeABKcAvt-hrzvsBKXMr-ntHvDEPl6bGe2cTA9UIkw9wGF4VouK10f51oksxZ_JBp39UnzCzOqUXsUUUTRG5Nup7e5PnriYsV93cDCHZr68XnzesbaOobwoNwdkkRMB" }],
    seller: { businessName: "MINIBRANDS" },
    variants: []
  },
  {
    id: "rv-mock-3",
    name: "Sunflower Summer Dress",
    price: 129900,
    category: "Clothing",
    images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuD1W42Ra3YxdOOvC7mfRDVfLBR1fIBLiHz4sVYLogTuzxxpMZ2GFuJ44EPDNAtfPOJizmxe1OwI7H42pMpdkUJBTWvTyTP3azMRM8FwB3KuYxMlRokX1sA9jjxSoHp0dUrO-CrAdFPKfIytPAkkSHI1zSA_Dzn-GOi-TmYiXS8KlM9K5N9NnLuZjlwfJwiviaWXUe_mqn-FJjpcBFwvIU28Jtfvu9M_Loau9uyizhYecRy30YVzK3ammhphdWONiuPOwt9xJRjHpfcb" }],
    seller: { businessName: "MINIBRANDS" },
    variants: []
  },
  {
    id: "rv-mock-4",
    name: "Eco-Felt Laptop Case",
    price: 99900,
    category: "Bags",
    images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnpLTpuvpmRj0Gghqu69IPXohKANbv2yiBHhymhA12gfi2CK_r59aL_wF2-sNybhJva2P2tuCbrDxF4fE92fuM6-THFmAG8v--G__6Zn499g8tkVtyHQ5FRG9KYT_dC97tGk39Q99GiABfjCF2hPm3whtVsyfHxn6bd9EyT3BuPOthx7oBTYG7bO6DTl_FDO9Nrdi53YpzdjTdyEmt24PS1BP5dg7L-ODvPh_cxSyjsYyEGaQKgiA-MwlltAHt-nVb5nCVlR8ZiZ6h" }],
    seller: { businessName: "MINIBRANDS" },
    variants: []
  }
];

export default async function WishlistPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login?redirectTo=/account/wishlist");
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      seller: { include: { verification: true } },
    },
  });

  if (!userProfile) {
    redirect("/login?redirectTo=/account/wishlist");
  }

  // Fetch active reservations for cart count
  const allReservations = await getUserReservations(userProfile.id);
  const cartCount = allReservations.reduce((acc, curr) => acc + curr.quantity, 0);

  let sellerHref = "/login?role=seller";
  if (userProfile.role === "SELLER") {
    const ver = userProfile.seller?.verification;
    const isVerified =
      ver &&
      (ver.kycStatus === "auto_approved" || ver.kycStatus === "approved") &&
      ver.bankVerified;
    sellerHref = isVerified ? "/seller/dashboard" : "/seller/onboarding";
  }

  // Fetch wishlist product IDs from Redis Set
  const wishlistKey = `wishlist:${userProfile.id}`;
  const wishlistProductIds = await redis.smembers(wishlistKey);

  let wishlistProducts: WishlistProduct[] = [];
  if (wishlistProductIds && wishlistProductIds.length > 0) {
    const dbWishlistProducts = await prisma.product.findMany({
      where: {
        id: { in: wishlistProductIds },
        isDeleted: false,
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        seller: true,
        variants: true,
      },
    });

    // Sort to match the order returned by Redis Set members (retains consistency)
    wishlistProducts = wishlistProductIds
      .map((id) => dbWishlistProducts.find((p) => p.id === id))
      .filter(Boolean) as WishlistProduct[];
  }

  // Fetch recently viewed active published products to display in the carousel
  const dbRecentlyViewed = await prisma.product.findMany({
    where: {
      isDeleted: false,
      isPublished: true,
      seller: {
        verification: {
          kycStatus: { in: ["auto_approved", "approved"] },
          bankVerified: true,
        },
      },
      // Exclude items already in wishlist to provide diverse recommendations
      id: { notIn: wishlistProductIds },
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      seller: true,
      variants: true,
    },
    take: 4,
  });

  const finalRecentlyViewed = [...dbRecentlyViewed];
  if (finalRecentlyViewed.length < 4) {
    const needed = 4 - finalRecentlyViewed.length;
    for (let i = 0; i < needed; i++) {
      finalRecentlyViewed.push(mockRecentlyViewed[i] as any);
    }
  }

  // Format the Profile image prop correctly to fit interface
  const formattedUserProfile = {
    id: userProfile.id,
    role: userProfile.role,
    user: {
      name: userProfile.user.name,
      email: userProfile.user.email,
      image: userProfile.user.image,
    },
  };

  return (
    <WishlistClient
      initialProducts={wishlistProducts}
      initialCartCount={cartCount}
      recentlyViewedProducts={finalRecentlyViewed as WishlistProduct[]}
      userProfile={formattedUserProfile}
      sellerHref={sellerHref}
    />
  );
}
