import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import HomeHeader from "@/components/home/HomeHeader";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserReservations, redis } from "@/lib/redis";
import Recommendations from "./Recommendations";
import {
  CheckCircle2,
  ShieldCheck,
  Truck,
  Download,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmed | MINIBRANDS",
  robots: {
    index: false,
    follow: false,
  },
};

// Fallback high-fidelity mock products matching the original HTML design
const mockProducts = [
  {
    id: "mock-1",
    name: "Architectural LED Desk Lamp",
    price: 189900, // in paise
    originalPrice: 249900,
    seller: { businessName: "LUMINA" },
    images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuARCDv9RPhjnOJiaYGT1BfjDvzG_7x8GywcCEgFLl8Rz0PXoCqdOBFvmvqT4LGKFVeuiKiVfeyfiNjIdp-7NaRlWCEFr78NhF-y66aadP0X2YUTogsZ95JL3SGbBRZgcg4Cqg6LMzpymDVyeFxroHrfYbDhAl0ewLRWXNBfKVSnbg4R23BuvftFZxjq13_xmW3HliReW-7UdKj4Z-1fhFfYkDfZVu8ujDj0s48BN-9Wt60Vadrj-GO7jcWlBdlpk_UesI_TRiKAtJ6i" }],
    verified: false,
    tag: null
  },
  {
    id: "mock-2",
    name: "Full Grain Leather Laptop Sleeve",
    price: 220000, // in paise
    originalPrice: null,
    seller: { businessName: "LEATHER CO." },
    images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCF3DCGyqTnsqQfkeVWKUC5wJqIbYVgr31AQhTrqySdeevnRjQflEGUzERUNv6Ng83qnDlSX1FI_igvnJLVR3B5BnLdPrAYnL1frKxRmEMSsAmgB9sXztddOUbhOTQY9MUWe6XeNmk1nyQM_jSKg8xIsKReCaYhyWs2Z9brCVM6kJBIVc-GCQqmh_D4EndFn9XS_gdl-3v-5y7t8Cek8wWMXDUTAAvrCCaMc-CnQ6eqZyZI8kQTD8YAykaa5EF6WTWX9Qg38WrdSNVT" }],
    verified: true,
    tag: "Verified"
  },
  {
    id: "mock-3",
    name: "Double-Wall Insulated Bottle",
    price: 149900, // in paise
    originalPrice: 199900,
    seller: { businessName: "HYDRO FLASK" },
    images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0cux6OVOsnf6OpNRif1A1-GimBXuL_JDpFFisghaRNCJO_ui0pZyyhO0011ISLWLEdjgRh4FNi6j6uGz7fW7yWAu96_snqV4jPggqMMeMTBK9XWoRVxibqcSoqG__QRaKln9RmiKanAZRlBUlmW5v1QGVCNli3gBHGItHqw7zHp6gOAGTczXeJCQq922gSOaxTGrT8Z5f3JkQ96cVsZ4Vw3fueGqoXfmo6X-wUN5qp8lVBNKVJOAnSmNYDdF-Q7j9BZg3tf0Mj_1j" }],
    verified: false,
    tag: null
  },
  {
    id: "mock-4",
    name: "Travel Tech Organizer Pouch",
    price: 99900, // in paise
    originalPrice: null,
    seller: { businessName: "CABLE CORE" },
    images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuALC_BDBD0f30OrGOahUWv9Dt-t1WWAbVk38OYwJZzfc32JlA-pzqa3EHAM96JAREjz2ddyUdpawVS1xtWYLgUqIVjqhlAneP6E3-9GOSujsD1sLPODygAiN7ixdFQ45fiHZvXPbCE12dGZKtp-_EICOKd8Sm3kyl39HbC1FpPwB35uy39S-VvYwkRtLO7opyXYjQzuMG4Nwsa3ZPCg5JQ1u5beGpYB0ui8zkQYPqLAx7dqLD3i45GTkM8Y0ZqaV1NqMcBp4fag9Lrj" }],
    verified: false,
    tag: "Sale"
  }
];

interface SuccessPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderSuccessPage({ params }: SuccessPageProps) {
  const { orderId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect(`/login?redirectTo=/order/success/${orderId}`);
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      seller: { include: { verification: true } },
    },
  });

  if (!userProfile) {
    redirect("/login");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      address: true,
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" } },
              seller: true,
            }
          },
          variant: true,
        }
      }
    }
  });

  if (!order || order.buyerId !== userProfile.id) {
    redirect("/products");
  }

  // Fetch active reservations for cart count in header
  const allReservations = await getUserReservations(userProfile.id);
  const cartCount = allReservations.reduce((acc, curr) => acc + curr.quantity, 0);

  let wishlistIds: string[] = [];
  const key = `wishlist:${userProfile.id}`;
  wishlistIds = (await redis.smembers(key)) || [];

  let sellerHref = "/login?role=seller";
  if (userProfile.role === "SELLER") {
    const ver = userProfile.seller?.verification;
    const isVerified =
      ver &&
      (ver.kycStatus === "auto_approved" || ver.kycStatus === "approved") &&
      ver.bankVerified;
    sellerHref = isVerified ? "/seller/dashboard" : "/seller/onboarding";
  }

  // Fetch recommended products from database to show live recommendations
  const dbProducts = await prisma.product.findMany({
    where: {
      isDeleted: false,
      isPublished: true,
      seller: {
        verification: {
          kycStatus: { in: ["auto_approved", "approved"] },
          bankVerified: true,
        },
      },
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      seller: { include: { verification: true } },
    },
    take: 4,
  });

  // Pad recommendations with mock products if there are fewer than 4 active database products
  const finalRecommended = [...dbProducts];
  if (finalRecommended.length < 4) {
    const needed = 4 - finalRecommended.length;
    for (let i = 0; i < needed; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      finalRecommended.push(mockProducts[i] as any);
    }
  }

  const formatPrice = (amt: number) => {
    return (amt / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  // Compute expected delivery date (order date + 2 days)
  const expectedDate = new Date(order.createdAt);
  expectedDate.setDate(expectedDate.getDate() + 2);
  
  const diffDays = Math.round((expectedDate.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  let deliveryDayStr = expectedDate.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
  if (diffDays === 1) {
    deliveryDayStr = `Tomorrow, ${deliveryDayStr}`;
  } else {
    deliveryDayStr = expectedDate.toLocaleDateString("en-IN", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }

  const totalItemsCount = order.items.reduce((acc, curr) => acc + curr.quantity, 0);
  const isLoggedIn = !!session.user;
  const isFallbackId = (id: string) => id.startsWith("mock-");

  return (
    <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink selection:bg-vl-primary/20">
      <HomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      <main className="vl-section-shell flex w-full flex-grow flex-col pt-20 py-6 sm:py-8 lg:py-10">
        
        {/* Celebration Header Section */}
        <section className="w-full max-w-2xl mx-auto px-6 py-10 sm:py-12 mt-12 bg-gradient-to-br from-vl-primary/5 via-vl-card to-vl-card rounded-vl-card border border-vl-border text-center mb-8 shadow-vl-soft flex flex-col items-center">
          {/* Animated success icon */}
          <div className="w-20 h-20 bg-vl-success/10 rounded-full flex items-center justify-center mb-6 animate-bounce shrink-0">
            <CheckCircle2 className="text-vl-success h-10 w-10" strokeWidth={2} />
          </div>

          {/* Heading */}
          <h1 className="font-vl-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-vl-ink mb-3 text-center">
            Order Confirmed!
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-vl-muted max-w-[520px] mx-auto leading-[1.6] text-center mb-8">
            Thank you for shopping with us. A confirmation email has been sent. Great style is already on its way!
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-[480px] mx-auto">
            <Link
              href={`/orders/${order.id}`}
              className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center rounded-vl-control bg-vl-primary px-8 text-sm font-bold text-white shadow-sm transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-95"
            >
              Track Order
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center rounded-vl-control border border-vl-border bg-vl-card px-8 text-sm font-semibold text-vl-ink transition-all duration-vl-fast hover:border-vl-primary hover:text-vl-primary active:scale-95"
            >
              Continue Shopping
            </Link>
          </div>
        </section>

        {/* Bento Grid Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-stretch">
          
          {/* Order Metadata (Order ID, Payment status, Timeline) */}
          <div className="lg:col-span-4 bg-vl-card p-6 rounded-vl-card border border-vl-border shadow-vl-soft flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-vl-muted uppercase tracking-[0.08em] mb-1">Order ID</p>
                <p className="font-vl-heading text-base font-extrabold text-vl-ink break-all">{order.id}</p>
              </div>

              <div className="pt-3 border-t border-vl-border">
                <p className="text-[10px] font-bold text-vl-muted uppercase tracking-[0.08em] mb-1">Order Date</p>
                <p className="text-sm font-bold text-vl-ink">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="pt-3 border-t border-vl-border">
                <p className="text-[10px] font-bold text-vl-muted uppercase tracking-[0.08em] mb-1">Payment ID</p>
                <p className="text-sm font-semibold text-vl-ink break-all">
                  {order.razorpayPaymentId || "Mock Sandbox Payment"}
                </p>
              </div>

              <div className="pt-3 border-t border-vl-border">
                <p className="text-[10px] font-bold text-vl-muted uppercase tracking-[0.08em] mb-1">Payment Status</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      order.paymentStatus.toLowerCase() === "paid" || order.paymentStatus.toLowerCase() === "success"
                        ? "bg-vl-success"
                        : order.paymentStatus.toLowerCase() === "pending"
                        ? "bg-vl-warning"
                        : "bg-vl-danger"
                    }`}
                  />
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${
                      order.paymentStatus.toLowerCase() === "paid" || order.paymentStatus.toLowerCase() === "success"
                        ? "text-vl-success"
                        : order.paymentStatus.toLowerCase() === "pending"
                        ? "text-vl-warning"
                        : "text-vl-danger"
                    }`}
                  >
                    {order.paymentStatus}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-vl-border flex justify-between items-center">
              <span className="text-xs text-vl-muted">Download Invoice</span>
              <a
                href={`/api/orders/${order.id}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-vl-border bg-vl-card text-vl-ink hover:text-vl-primary hover:border-vl-primary transition-all active:scale-95 cursor-pointer"
                title="Download invoice receipt"
              >
                <Download aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Delivery & Shipping Info Card */}
          <div className="lg:col-span-8 bg-vl-card p-6 rounded-vl-card border border-vl-border shadow-vl-soft flex flex-col sm:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <p className="text-[10px] font-bold text-vl-muted uppercase tracking-[0.08em]">Delivery Address</p>
              {order.address ? (
                <>
                  <p className="font-bold text-vl-ink text-base">{order.address.fullName}</p>
                  <div className="text-sm text-vl-muted leading-relaxed">
                    <p>{order.address.line1}</p>
                    {order.address.line2 && <p>{order.address.line2}</p>}
                    <p>{order.address.city} - {order.address.pincode}</p>
                    <p className="mt-2.5"><span className="font-bold text-vl-ink">Phone:</span> {order.address.phone}</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-bold text-vl-ink text-base">{(order.guestShippingAddress as any)?.name || order.guestName}</p>
                  <div className="text-sm text-vl-muted leading-relaxed">
                    <p>{(order.guestShippingAddress as any)?.line1}</p>
                    {(order.guestShippingAddress as any)?.line2 && <p>{(order.guestShippingAddress as any)?.line2}</p>}
                    <p>{(order.guestShippingAddress as any)?.city} - {(order.guestShippingAddress as any)?.postalCode}</p>
                    <p className="mt-2.5"><span className="font-bold text-vl-ink">Phone:</span> {(order.guestShippingAddress as any)?.phone || order.guestPhone}</p>
                  </div>
                </>
              )}
            </div>

            <div className="hidden sm:block w-px bg-vl-border shrink-0 self-stretch" />

            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-vl-muted uppercase tracking-[0.08em]">Expected Delivery</p>
                <div className="flex items-center gap-2 text-vl-ink">
                  <Truck aria-hidden="true" className="text-vl-primary h-5 w-5 shrink-0" />
                  <p className="font-vl-heading text-lg font-extrabold">{deliveryDayStr}</p>
                </div>
                <p className="text-xs text-vl-muted leading-relaxed mt-1">
                  Your package will be delivered securely by tomorrow. Track updates on your dashboard.
                </p>
              </div>

              {/* Secure strip protection details */}
              <div className="pt-4 border-t border-vl-border mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-vl-success">
                <ShieldCheck aria-hidden="true" className="h-4.5 w-4.5" />
                <span>MiniBrands Escrow Covered</span>
              </div>
            </div>
          </div>

          {/* Product Items Breakdown summary */}
          <div className="lg:col-span-12 bg-vl-card p-6 rounded-vl-card border border-vl-border shadow-vl-soft">
            <h3 className="font-vl-heading text-lg font-bold text-vl-ink mb-4">
              Items Purchased ({totalItemsCount})
            </h3>
            
            <div className="divide-y divide-vl-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="w-16 h-20 bg-vl-surface border border-vl-border rounded-vl-control overflow-hidden relative shrink-0">
                    <Image
                      fill
                      className="object-cover"
                      src={item.product.images[0]?.url || "/placeholder.jpg"}
                      alt={item.product.name}
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-vl-muted uppercase tracking-[0.08em] mb-0.5">
                      {item.product.seller?.businessName || "MINIBRANDS"}
                    </p>
                    <h4 className="font-bold text-vl-ink text-sm truncate">{item.product.name}</h4>
                    <p className="text-xs text-vl-muted">
                      Size: {item.variant.size} | Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-vl-heading font-extrabold text-vl-ink text-base">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="mt-5 pt-5 border-t border-vl-border flex justify-end">
              <div className="w-full sm:w-72 space-y-3 text-sm">
                <div className="flex justify-between text-vl-muted">
                  <span>Subtotal</span>
                  <span className="font-semibold text-vl-ink">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-vl-muted">
                  <span>Shipping Charges</span>
                  {order.shipping === 0 ? (
                    <span className="text-vl-success font-bold uppercase text-xs">FREE</span>
                  ) : (
                    <span className="font-semibold text-vl-ink">{formatPrice(order.shipping)}</span>
                  )}
                </div>
                <div className="flex justify-between text-base font-bold text-vl-ink pt-3 border-t border-vl-border">
                  <span className="font-vl-heading text-sm uppercase tracking-wider">Total Amount</span>
                  <span className="font-vl-heading text-lg font-extrabold text-vl-primary">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Products Carousel section */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-vl-heading text-xl sm:text-2xl font-extrabold tracking-[-0.03em] text-vl-ink">
              Recommended for You
            </h2>
            <Link className="text-vl-primary font-bold text-sm hover:underline" href="/products">
              View All
            </Link>
          </div>

          <Recommendations
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            products={finalRecommended.map((prod: any) => {
              const isMock = isFallbackId(prod.id);
              const sellerName = prod.seller?.businessName || "MINIBRANDS";
              
              return {
                id: prod.id,
                sellerId: isMock ? "" : prod.id,
                name: prod.name,
                shortDescription: "",
                fullDescription: "",
                category: prod.category || "Decor",
                subcategory: null,
                tags: [],
                price: prod.price,
                isPublished: true,
                isDeleted: false,
                createdAt: "",
                updatedAt: "",
                isWishlisted: wishlistIds.includes(prod.id),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                images: prod.images?.map((img: any, i: number) => ({
                  id: String(i),
                  productId: prod.id,
                  url: img.url,
                  sortOrder: i,
                })) || [],
                variants: [],
                seller: {
                  id: "",
                  businessName: sellerName,
                  storeName: sellerName,
                  storeLogo: null,
                },
                mrp: prod.price * 1.4,
                discountPercent: 28,
                rating: 4.5,
                reviewCount: 12,
                formattedReviews: "12",
                badge: null,
              };
            })}
            isLoggedIn={isLoggedIn}
          />
        </section>
      </main>
    </div>
  );
}
