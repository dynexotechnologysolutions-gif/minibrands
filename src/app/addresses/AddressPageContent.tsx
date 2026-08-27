import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { redis, ReservationData, getUserReservations } from "@/lib/redis";
import { getRequestSessionAndProfile } from "@/lib/request-auth";
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
  const redirectTo = params.redirectTo;
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

  const { session, userProfile, sellerHref } = await getRequestSessionAndProfile();

  if (!session || !session.user || !userProfile) {
    const loginRedirect = redirectTo
      ? `/login?redirectTo=/addresses?redirectTo=${encodeURIComponent(redirectTo)}` +
        (sessionId ? `&sessionId=${sessionId}` : "") +
        (reservationId ? `&reservationId=${reservationId}` : "")
      : "/login?redirectTo=/addresses";
    redirect(loginRedirect);
  }

  // Fetch addresses, active reservations, and optional session in parallel
  const sessionKey = sessionId ? `checkout-session:${sessionId}` : null;
  const reservationKey = !sessionId && reservationId ? `reservation:${reservationId}` : null;

  const [addresses, allReservations, sessionRaw, reservationRaw] = await Promise.all([
    prisma.address.findMany({
      where: {
        userProfileId: userProfile.id,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
    }),
    getUserReservations(userProfile.id),
    sessionKey ? redis.get(sessionKey) : Promise.resolve(null),
    reservationKey ? redis.get(reservationKey) : Promise.resolve(null),
  ]);

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

  const cartCount = allReservations.reduce((acc, curr) => acc + curr.quantity, 0);

  // Fetch products for checkout summary in a single batch query (No N+1 loops)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkoutProducts: any[] = [];

  if (sessionRaw) {
    const checkoutSession = (
      typeof sessionRaw === "string" ? JSON.parse(sessionRaw) : sessionRaw
    ) as CheckoutSessionPayload;

    const productIds = [
      ...new Set(checkoutSession.products.map((p) => p.productId).filter(Boolean)),
    ];

    if (productIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, isDeleted: false },
        select: { id: true, name: true, price: true },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of checkoutSession.products) {
        const product = productMap.get(item.productId);
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
  } else if (reservationRaw) {
    const reservation = (
      typeof reservationRaw === "string" ? JSON.parse(reservationRaw) : reservationRaw
    ) as ReservationData;

    const product = await prisma.product.findUnique({
      where: { id: reservation.productId, isDeleted: false },
      select: { id: true, name: true, price: true },
    });

    if (product) {
      checkoutProducts.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: reservation.quantity,
      });
    }
  } else if (allReservations.length > 0) {
    // Fallback: active cart reservations batched in 1 query
    const productIds = [...new Set(allReservations.map((r) => r.productId).filter(Boolean))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isDeleted: false },
      select: { id: true, name: true, price: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const res of allReservations) {
      const product = productMap.get(res.productId);
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
