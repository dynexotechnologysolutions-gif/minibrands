import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserReservations } from "@/lib/redis";
import SecurityClient from "./SecurityClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Security Settings | Velvet Lane",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SecurityPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login?redirectTo=/account/security");
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      seller: true,
    },
  });

  if (!userProfile) {
    redirect("/login?redirectTo=/account/security");
  }

  // Redis cart count
  const allReservations = await getUserReservations(userProfile.id);
  const cartCount = allReservations.reduce((acc, curr) => acc + curr.quantity, 0);

  let sellerHref = "/login?role=seller";
  if (userProfile.role === "SELLER" && userProfile.seller) {
    sellerHref = "/seller/dashboard";
  }

  return (
    <SecurityClient
      userProfile={userProfile}
      cartCount={cartCount}
      sellerHref={sellerHref}
    />
  );
}
