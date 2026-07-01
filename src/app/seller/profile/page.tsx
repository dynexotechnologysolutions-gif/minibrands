import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SellerProfileClient from "./SellerProfileClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Store Profile Settings | Velvet Lane",
  description: "Manage your independent boutique store logo, banner, categories, and review your verification status.",
};

export default async function SellerProfilePage() {
  // 1. Session verification
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login?role=seller");
  }

  // 2. Fetch User Profile, Seller, and Verification status
  const userProfile = await prisma.userProfile.findUnique({
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

  if (!userProfile || userProfile.role !== "SELLER" || !userProfile.seller) {
    redirect("/login?role=seller");
  }

  return (
    <SellerProfileClient 
      seller={userProfile.seller} 
      verification={userProfile.seller.verification} 
      userProfile={userProfile}
    />
  );
}
