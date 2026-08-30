import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserReservations } from "@/lib/redis";
import { getRequestSessionAndProfile } from "@/lib/request-auth";
import SecurityClient from "./SecurityClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Security Settings | MiniBrands",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SecurityPage() {
  const { session, userProfile, sellerHref } = await getRequestSessionAndProfile();

  if (!session || !session.user || !userProfile) {
    redirect("/login?redirectTo=/account/security");
  }

  // Cart count
  const allReservations = await getUserReservations(userProfile.id);
  const cartCount = allReservations.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <SecurityClient
      userProfile={userProfile}
      cartCount={cartCount}
      sellerHref={sellerHref}
    />
  );
}
