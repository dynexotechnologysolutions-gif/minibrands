import React from "react";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { GuestOrderService } from "@/lib/guest-order.service";
import HomeHeader from "@/components/home/HomeHeader";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmed | MINIBRANDS",
  robots: { index: false, follow: false },
};

interface GuestOrderSuccessPageProps {
  params: Promise<{ token: string }>;
}

export default async function GuestOrderSuccessPage({ params }: GuestOrderSuccessPageProps) {
  const { token } = await params;
  const tokenHash = GuestOrderService.hashGuestToken(token);

  const order = await prisma.order.findUnique({
    where: { guestTokenHash: tokenHash },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return (
      <main className="min-h-screen bg-vl-surface px-4 py-16 max-w-[448px] mx-auto text-center flex flex-col justify-center items-center font-vl-body">
        <div className="p-8 rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft">
          <h1 className="text-xl font-extrabold text-vl-ink font-vl-heading mb-2">Order Not Found</h1>
          <p className="text-vl-muted text-sm mb-6 leading-relaxed">
            The order confirmation session is invalid or expired.
          </p>
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-6 text-sm font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.25)] transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98]"
          >
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  // Format pricing
  const formatPrice = (amt: number) => {
    return (amt / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  // Check if this guest email already has a registered user account
  const existingUser = await prisma.user.findUnique({
    where: { email: order.guestEmail || "" },
  });

  const hasAccount = !!existingUser;

  return (
    <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink">
      <HomeHeader cartCount={0} sellerHref="/login?role=seller" userProfile={null} />

      <main className="vl-section-shell flex w-full flex-1 flex-col items-center justify-center py-10 px-4">
        <div className="w-full max-w-[550px] bg-white rounded-vl-card border border-vl-border p-6 sm:p-8 shadow-vl-medium space-y-6">
          {/* Header Status */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-vl-success/10 text-vl-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="font-vl-heading text-2xl font-extrabold text-vl-ink">Order Confirmed!</h1>
            <p className="text-sm text-vl-muted">
              Thank you for your purchase, <span className="font-bold text-vl-ink">{order.guestName}</span>.
            </p>
          </div>

          <hr className="border-vl-border" />

          {/* Reference Info */}
          <div className="grid grid-cols-2 gap-4 text-sm bg-vl-surface p-4 rounded-vl-control">
            <div>
              <span className="block text-xs text-vl-muted uppercase font-semibold">Order Reference</span>
              <span className="font-bold text-vl-ink">{order.razorpayOrderId}</span>
            </div>
            <div>
              <span className="block text-xs text-vl-muted uppercase font-semibold">Amount Paid</span>
              <span className="font-bold text-vl-primary">{formatPrice(order.totalAmount)}</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-vl-border/60">
              <span className="block text-xs text-vl-muted uppercase font-semibold">Confirmation Sent To</span>
              <span className="font-bold text-vl-ink">{order.guestEmail}</span>
            </div>
          </div>

          {/* Order items snapshot */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-vl-ink">Items Summary</h3>
            <div className="space-y-2 divide-y divide-vl-border/60">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm pt-2 first:pt-0">
                  <span className="text-vl-muted truncate max-w-[300px]">
                    {item.product.name} <span className="text-xs font-semibold">(Qty: {item.quantity})</span>
                  </span>
                  <span className="font-semibold text-vl-ink">{formatPrice(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-vl-border" />

          {/* Post-Purchase CTA claim order option */}
          <div className="bg-vl-primary/5 rounded-vl-card border border-vl-primary/10 p-5 space-y-4">
            <div className="flex gap-3">
              <ShieldCheck className="h-6 w-6 text-vl-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-vl-ink">Want to track your order easily?</h4>
                <p className="text-xs text-vl-muted mt-1 leading-relaxed">
                  {hasAccount
                    ? "Your email address already has a registered account. Sign in to automatically claim and view your order status."
                    : "Create a MiniBrands account with the email used for this order. You'll claim this order, track shipping details, and view your history."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                href={`/claim-order?token=${token}`}
                className="w-full inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary text-sm font-bold text-white shadow-md hover:bg-vl-primary-strong transition-all text-center"
              >
                {hasAccount ? "Sign In & Track Order" : "Create Account & Track Order"}
              </Link>
            </div>
          </div>

          <div className="text-center">
            <Link href="/products" className="text-xs font-semibold text-vl-muted hover:text-vl-primary">
              Continue Shopping →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
