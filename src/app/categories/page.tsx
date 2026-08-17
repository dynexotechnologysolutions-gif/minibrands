import React from "react";
import HomeCategoryGrid from "@/components/home/HomeCategoryGrid";
import HomeHeader from "@/components/home/HomeHeader";
import MobileBottomNavigation from "@/components/mobile/MobileBottomNavigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getUserReservations } from "@/lib/redis";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  let userProfile = null;
  let cartCount = 0;
  let sellerHref = "/login?role=seller";

  if (session?.user) {
    userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true, seller: { include: { verification: true } }, addresses: { where: { isDeleted: false } } },
    });
    
    if (userProfile?.role === "SELLER") {
      const ver = userProfile.seller?.verification;
      const isVerified = ver && (ver.kycStatus === "auto_approved" || ver.kycStatus === "approved") && ver.bankVerified;
      sellerHref = isVerified ? "/seller/dashboard" : "/seller/onboarding";
    }

    if (userProfile) {
      const reservations = await getUserReservations(userProfile.id);
      cartCount = reservations.reduce((acc, curr) => acc + curr.quantity, 0);
    }
  }

  return (
    <div className="min-h-screen w-full bg-white font-sans text-slate-800 pb-24 md:pb-0">
      <HomeHeader userProfile={userProfile} cartCount={cartCount} sellerHref={sellerHref} />
      <main className="pt-[108px] md:pt-24 max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="my-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#222222]">All Categories</h1>
          <p className="text-sm text-slate-500 mt-1">Explore products by category</p>
        </div>
        <HomeCategoryGrid />
      </main>
      <MobileBottomNavigation userProfile={userProfile} cartCount={cartCount} />
    </div>
  );
}
