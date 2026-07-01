import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redis, ReservationData, getUserReservations } from "@/lib/redis";
import AddressClient from "./AddressClient";
import { CheckoutSessionPayload } from "@/actions/checkout-session.action";

export interface AddressesPageProps {
  searchParams: Promise<{
    redirectTo?: string;
    sessionId?: string;
    reservationId?: string;
  }>;
}

export default async function AddressPageContent({ searchParams }: AddressesPageProps) {
  const params = await searchParams;
  let redirectTo = params.redirectTo;
  let sessionId = params.sessionId;
  let reservationId = params.reservationId;

  // Extract from redirectTo if not present in root query
  if (redirectTo && (!sessionId && !reservationId)) {
    try {
      const dummyUrl = new URL(redirectTo, "http://localhost");
      const urlSessionId = dummyUrl.searchParams.get("sessionId");
      const urlReservationId = dummyUrl.searchParams.get("reservationId");
      if (urlSessionId) sessionId = urlSessionId;
      if (urlReservationId) reservationId = urlReservationId;
    } catch (e) {
      console.error("Failed to parse redirectTo query:", e);
    }
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    const loginRedirect = redirectTo
      ? `/login?redirectTo=/addresses?redirectTo=${encodeURIComponent(redirectTo)}` +
        (sessionId ? `&sessionId=${sessionId}` : "") +
        (reservationId ? `&reservationId=${reservationId}` : "")
      : "/login?redirectTo=/addresses";
    redirect(loginRedirect);
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      seller: { include: { verification: true } },
    },
  });

  if (!userProfile) {
    redirect("/login?redirectTo=/addresses");
  }

  // Fetch addresses
  const addresses = await prisma.address.findMany({
    where: {
      userProfileId: userProfile.id,
      isDeleted: false,
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedAddresses = addresses.map((addr) => ({
    id: addr.id,
    fullName: addr.fullName,
    phone: addr.phone,
    line1: addr.line1,
    line2: addr.line2,
    city: addr.city as "Chennai",
    pincode: addr.pincode,
    isDefault: addr.isDefault,
  }));

  // Fetch active reservations to calculate cart count
  const allReservations = await getUserReservations(userProfile.id);
  const cartCount = allReservations.reduce((acc, curr) => acc + curr.quantity, 0);

  // Fetch products for checkout summary
  let checkoutProducts: any[] = [];

  if (sessionId) {
    const sessionKey = `checkout-session:${sessionId}`;
    const sessionRaw = await redis.get(sessionKey);
    if (sessionRaw) {
      const checkoutSession = (
        typeof sessionRaw === "string" ? JSON.parse(sessionRaw) : sessionRaw
      ) as CheckoutSessionPayload;

      for (const item of checkoutSession.products) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId, isDeleted: false },
        });
        if (product) {
          checkoutProducts.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
          });
        }
      }
    }
  } else if (reservationId) {
    const reservationKey = `reservation:${reservationId}`;
    const reservationRaw = await redis.get(reservationKey);
    if (reservationRaw) {
      const reservation = (
        typeof reservationRaw === "string" ? JSON.parse(reservationRaw) : reservationRaw
      ) as ReservationData;

      const product = await prisma.product.findUnique({
        where: { id: reservation.productId, isDeleted: false },
      });
      if (product) {
        checkoutProducts.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: reservation.quantity,
        });
      }
    }
  } else {
    // Fallback: active cart reservations
    for (const res of allReservations) {
      const product = await prisma.product.findUnique({
        where: { id: res.productId, isDeleted: false },
      });
      if (product) {
        checkoutProducts.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: res.quantity,
        });
      }
    }
  }

  let sellerHref = "/login?role=seller";
  if (userProfile.role === "SELLER") {
    const ver = userProfile.seller?.verification;
    const isVerified =
      ver &&
      (ver.kycStatus === "auto_approved" || ver.kycStatus === "approved") &&
      ver.bankVerified;
    sellerHref = isVerified ? "/seller/dashboard" : "/seller/onboarding";
  }

  return (
    <AddressClient
      initialAddresses={formattedAddresses}
      checkoutProducts={checkoutProducts}
      redirectTo={redirectTo}
      sessionId={sessionId}
      reservationId={reservationId}
      userProfile={userProfile}
      cartCount={cartCount}
      sellerHref={sellerHref}
    />
  );
}
