import React from "react";
import { cookies } from "next/headers";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import GuestCheckoutClient from "./GuestCheckoutClient";
import { CheckoutSessionPayload } from "@/actions/checkout-session.action";

export const dynamic = "force-dynamic";

interface GuestCheckoutPageProps {
  searchParams: Promise<{
    sessionId?: string;
  }>;
}

export default async function GuestCheckoutPage({ searchParams }: GuestCheckoutPageProps) {
  const params = await searchParams;
  const sessionId = params.sessionId;
  const cookieStore = await cookies();
  const guestCartId = cookieStore.get("mb-guest-cart")?.value;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkoutProducts: any[] = [];
  let totalQuantity = 0;

  if (sessionId) {
    // Retrieve single session checkout (e.g. from Buy Now or specific cart group checkout)
    const sessionKey = `checkout-session:${sessionId}`;
    const sessionRaw = await redis.get(sessionKey);

    if (!sessionRaw) {
      return (
        <main className="min-h-screen bg-vl-surface px-4 py-16 max-w-[448px] mx-auto text-center flex flex-col justify-center items-center font-vl-body">
          <div className="p-8 rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft">
            <h1 className="text-xl font-extrabold text-vl-ink font-vl-heading mb-2">Checkout Expired</h1>
            <p className="text-vl-muted text-sm mb-6 leading-relaxed">
              Your checkout session has expired. Please try again.
            </p>
            <Link
              href="/cart"
              className="inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-6 text-sm font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.25)] transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98]"
            >
              Return to Cart
            </Link>
          </div>
        </main>
      );
    }

    const checkoutSession = (
      typeof sessionRaw === "string" ? JSON.parse(sessionRaw) : sessionRaw
    ) as CheckoutSessionPayload;

    totalQuantity = checkoutSession.products.reduce((acc, p) => acc + p.quantity, 0);

    for (const item of checkoutSession.products) {
      // Fetch product info from DB to guarantee price security
      const product = await prisma.product.findUnique({
        where: { id: item.productId, isDeleted: false },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: { where: { id: item.variantId } },
          seller: { include: { verification: true } },
        },
      });

      const variant = product?.variants[0];
      if (!product || !variant || !product.isPublished) continue;

      const verification = product.seller.verification;
      const isSellerVerified =
        !!verification &&
        (verification.kycStatus === "auto_approved" || verification.kycStatus === "approved") &&
        verification.bankVerified;

      checkoutProducts.push({
        id: product.id,
        name: product.name,
        price: product.price, // in paise
        size: variant.size,
        image: product.images[0]?.url || "/placeholder.jpg",
        sellerName: product.seller.businessName,
        isSellerVerified,
        quantity: item.quantity,
        variantId: variant.id,
        sellerId: product.sellerId,
      });
    }
  } else {
    // Guest cart fallback
    if (!guestCartId) {
      return (
        <main className="min-h-screen bg-vl-surface px-4 py-16 max-w-[448px] mx-auto text-center flex flex-col justify-center items-center font-vl-body">
          <div className="p-8 rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft">
            <h1 className="text-xl font-extrabold text-vl-ink font-vl-heading mb-2">Cart is Empty</h1>
            <p className="text-vl-muted text-sm mb-6 leading-relaxed">
              Please add items to your cart before proceeding to checkout.
            </p>
            <Link
              href="/products"
              className="inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-6 text-sm font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.25)] transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98]"
            >
              Go to Shop
            </Link>
          </div>
        </main>
      );
    }

    // Retrieve guest reservations
    const guestKeys = await redis.keys(`guest-reservation:${guestCartId}:*`);
    if (guestKeys.length === 0) {
      return (
        <main className="min-h-screen bg-vl-surface px-4 py-16 max-w-[448px] mx-auto text-center flex flex-col justify-center items-center font-vl-body">
          <div className="p-8 rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft">
            <h1 className="text-xl font-extrabold text-vl-ink font-vl-heading mb-2">Checkout Expired</h1>
            <p className="text-vl-muted text-sm mb-6 leading-relaxed">
              Your cart hold reservation has expired. Please reserve your items again.
            </p>
            <Link
              href="/cart"
              className="inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-6 text-sm font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.25)] transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98]"
            >
              Return to Cart
            </Link>
          </div>
        </main>
      );
    }

    const pipeline = redis.pipeline();
    guestKeys.forEach((key) => pipeline.get(key));
    const results = await pipeline.exec();

    for (const val of results) {
      if (!val) continue;
      const item = typeof val === "string" ? JSON.parse(val) : val;
      totalQuantity += item.quantity;

      // Fetch product info from DB to guarantee price security
      const product = await prisma.product.findUnique({
        where: { id: item.productId, isDeleted: false },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: { where: { id: item.variantId } },
          seller: { include: { verification: true } },
        },
      });

      const variant = product?.variants[0];
      if (!product || !variant || !product.isPublished) continue;

      const verification = product.seller.verification;
      const isSellerVerified =
        !!verification &&
        (verification.kycStatus === "auto_approved" || verification.kycStatus === "approved") &&
        verification.bankVerified;

      checkoutProducts.push({
        id: product.id,
        name: product.name,
        price: product.price, // in paise
        size: variant.size,
        image: product.images[0]?.url || "/placeholder.jpg",
        sellerName: product.seller.businessName,
        isSellerVerified,
        quantity: item.quantity,
        variantId: variant.id,
        sellerId: product.sellerId,
      });
    }
  }

  if (checkoutProducts.length === 0) {
    return (
      <main className="min-h-screen bg-vl-surface px-4 py-16 max-w-[448px] mx-auto text-center flex flex-col justify-center items-center font-vl-body">
        <div className="p-8 rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft">
          <h1 className="text-xl font-extrabold text-vl-ink font-vl-heading mb-2">Items Unavailable</h1>
          <p className="text-vl-muted text-sm mb-6 leading-relaxed">
            The items in your checkout are no longer available.
          </p>
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-6 text-sm font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.25)] transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98]"
          >
            Back to Catalog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <GuestCheckoutClient products={checkoutProducts} cartCount={totalQuantity} />
    </main>
  );
}
