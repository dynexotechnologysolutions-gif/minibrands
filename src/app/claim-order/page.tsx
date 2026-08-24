import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { GuestOrderService } from "@/lib/guest-order.service";
import { prisma } from "@/lib/prisma";
import HomeHeader from "@/components/home/HomeHeader";
import ClaimOrderClient from "./ClaimOrderClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Claim Your Order | MiniBrands",
  robots: { index: false, follow: false },
};

interface ClaimOrderPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ClaimOrderPage({ searchParams }: ClaimOrderPageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/products");
  }

  const tokenHash = GuestOrderService.hashGuestToken(token);

  // Look up order to pre-fill identity email securely
  const order = await prisma.order.findUnique({
    where: { guestTokenHash: tokenHash },
    select: {
      guestEmail: true,
      buyerId: true,
    },
  });

  if (!order) {
    redirect("/products");
  }

  if (order.buyerId !== null) {
    // Already claimed
    redirect("/login?redirectTo=/account/orders");
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink">
      <HomeHeader cartCount={0} sellerHref="/login?role=seller" userProfile={null} />

      <main className="vl-section-shell flex w-full flex-1 flex-col items-center justify-center py-10 px-4">
        <div className="w-full max-w-[450px] bg-white rounded-vl-card border border-vl-border p-6 sm:p-8 shadow-vl-medium">
          <ClaimOrderClient email={order.guestEmail || ""} token={token} />
        </div>
      </main>
    </div>
  );
}
