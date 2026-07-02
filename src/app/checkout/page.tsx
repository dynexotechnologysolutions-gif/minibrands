import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redis, ReservationData, getUserReservations } from "@/lib/redis";
import CheckoutClient from "./CheckoutClient";
import { CheckoutSessionPayload } from "@/actions/checkout-session.action";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout | Velvet Lane",
  robots: {
    index: false,
    follow: false,
  },
};

interface CheckoutPageProps {
  searchParams: Promise<{
    reservationId?: string;
    sessionId?: string;
    addressId?: string;
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const reservationId = params.reservationId;
  const sessionId = params.sessionId;

  if (!reservationId && !sessionId) {
    redirect("/cart");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    const redirectUrl = sessionId
      ? `/login?redirectTo=/checkout?sessionId=${sessionId}`
      : `/login?redirectTo=/checkout?reservationId=${reservationId}`;
    redirect(redirectUrl);
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      seller: { include: { verification: true } },
    },
  });

  if (!userProfile) {
    const redirectUrl = sessionId
      ? `/login?redirectTo=/checkout?sessionId=${sessionId}`
      : `/login?redirectTo=/checkout?reservationId=${reservationId}`;
    redirect(redirectUrl);
  }

  let checkoutProducts: any[] = [];
  let checkoutMode: "BUY_NOW" | "CART_CHECKOUT" = "CART_CHECKOUT";
  let createdAt = new Date().toISOString();

  if (sessionId) {
    // Fetch checkout session from Redis
    const sessionKey = `checkout-session:${sessionId}`;
    const sessionRaw = await redis.get(sessionKey);

    if (!sessionRaw) {
      redirect("/session-expired?redirectTo=/cart");
    }

    const checkoutSession = (
      typeof sessionRaw === "string" ? JSON.parse(sessionRaw) : sessionRaw
    ) as CheckoutSessionPayload;

    checkoutMode = checkoutSession.mode;
    createdAt = checkoutSession.createdAt;

    // Fetch product, variant, and seller details
    for (const item of checkoutSession.products) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId, isDeleted: false },
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
          variants: {
            where: { id: item.variantId },
          },
          seller: {
            include: {
              verification: true,
            },
          },
        },
      });

      const variant = product?.variants[0];

      if (!product || !variant || !product.isPublished) {
        return (
          <main className="min-h-screen px-4 py-16 max-w-[448px] mx-auto text-center flex flex-col justify-center items-center">
            <div className="glass-panel p-8 rounded-2xl border border-slate-100 bg-white/70">
              <h1 className="text-xl font-extrabold text-slate-800 font-display mb-2">Product Unavailable</h1>
              <p className="text-slate-500 text-xs mb-6">
                One or more products in your checkout are no longer available for purchase.
              </p>
              <a
                href="/products"
                className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md transition-all"
              >
                Back to Catalog
              </a>
            </div>
          </main>
        );
      }

      const verification = product.seller.verification;
      const isSellerVerified =
        !!verification &&
        (verification.kycStatus === "auto_approved" || verification.kycStatus === "approved") &&
        verification.bankVerified;

      checkoutProducts.push({
        id: product.id,
        name: product.name,
        price: product.price,
        size: variant.size,
        image: product.images[0]?.url || "/placeholder.jpg",
        sellerName: product.seller.businessName,
        isSellerVerified,
        quantity: item.quantity,
        variantId: variant.id,
      });
    }
  } else if (reservationId) {
    // Fetch reservation from Redis (legacy compatibility)
    const reservationKey = `reservation:${reservationId}`;
    const reservationRaw = await redis.get(reservationKey);

    if (!reservationRaw) {
      redirect("/session-expired?redirectTo=/cart");
    }

    const reservation = (
      typeof reservationRaw === "string" ? JSON.parse(reservationRaw) : reservationRaw
    ) as ReservationData;

    // Check reservation ownership
    if (reservation.userProfileId !== userProfile.id) {
      redirect("/cart");
    }

    createdAt = reservation.createdAt;
    checkoutMode = "CART_CHECKOUT";

    // Fetch product, variant, and seller details
    const product = await prisma.product.findUnique({
      where: { id: reservation.productId, isDeleted: false },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        variants: {
          where: { id: reservation.variantId },
        },
        seller: {
          include: {
            verification: true,
          },
        },
      },
    });

    const variant = product?.variants[0];

    if (!product || !variant || !product.isPublished) {
      return (
        <main className="min-h-screen px-4 py-16 max-w-[448px] mx-auto text-center flex flex-col justify-center items-center">
          <div className="glass-panel p-8 rounded-2xl border border-slate-100 bg-white/70">
            <h1 className="text-xl font-extrabold text-slate-800 font-display mb-2">Product Unavailable</h1>
            <p className="text-slate-500 text-xs mb-6">
              This product is no longer available for purchase.
            </p>
            <a
              href="/products"
              className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md transition-all"
            >
              Back to Catalog
            </a>
          </div>
        </main>
      );
    }

    const verification = product.seller.verification;
    const isSellerVerified =
      !!verification &&
      (verification.kycStatus === "auto_approved" || verification.kycStatus === "approved") &&
      verification.bankVerified;

    checkoutProducts.push({
      id: product.id,
      name: product.name,
      price: product.price,
      size: variant.size,
      image: product.images[0]?.url || "/placeholder.jpg",
      sellerName: product.seller.businessName,
      isSellerVerified,
      quantity: reservation.quantity,
      variantId: variant.id,
    });
  }

  // Fetch addresses
  const addresses = await prisma.address.findMany({
    where: {
      userProfileId: userProfile.id,
      isDeleted: false,
    },
    orderBy: { isDefault: "desc" },
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
    <main className="min-h-screen bg-background">
      <CheckoutClient
        reservationId={reservationId}
        createdAt={createdAt}
        products={checkoutProducts}
        mode={checkoutMode}
        checkoutSessionId={sessionId}
        addresses={formattedAddresses}
        buyerEmail={session.user.email}
        buyerName={session.user.name || userProfile.id}
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
        initialAddressId={params.addressId}
      />
    </main>
  );
}
