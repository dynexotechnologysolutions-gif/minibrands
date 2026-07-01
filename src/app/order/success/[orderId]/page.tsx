import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import HomeHeader from "@/components/home/HomeHeader";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserReservations, redis } from "@/lib/redis";
import WishlistIconButton from "@/components/product/WishlistIconButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmed | MINIBRANDS",
  robots: {
    index: false,
    follow: false,
  },
};

interface SuccessPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

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

  return (
    <div className="bg-surface-bg text-on-surface min-h-screen flex flex-col w-full font-sans">
      {/* Reused Home Header */}
      <HomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      {/* Main Success Content */}
      <main className="max-w-container-max mx-auto px-base pb-xxl pt-lg w-full flex-grow">
        {/* Success Hero */}
        <section className="bg-surface-container-lowest p-xl rounded-lg border border-border-gray text-center mb-xl shadow-sm">
          <div className="w-20 h-20 bg-success-green/10 rounded-full flex items-center justify-center mx-auto mb-base">
            <span
              className="material-symbols-outlined text-success-green text-5xl"
              style={{ fontVariationSettings: "'wght' 700" }}
            >
              check_circle
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary mb-xs">Order Confirmed!</h1>
          <p className="font-body-lg text-body-lg text-secondary">
            Thank you for your purchase. We've sent a confirmation email to you.
          </p>
          <div className="mt-lg flex flex-col md:flex-row gap-base justify-center items-center">
            <Link
              href={`/orders/${order.id}`}
              className="bg-primary text-on-primary px-xl py-3 rounded font-label-bold hover:opacity-90 transition-all active:scale-95 text-center inline-block min-w-[180px] cursor-pointer"
            >
              Track Order
            </Link>
            <Link
              href="/"
              className="bg-surface-container-lowest border border-primary text-primary px-xl py-3 rounded font-label-bold hover:bg-surface-container-low transition-all active:scale-95 text-center inline-block min-w-[180px] cursor-pointer"
            >
              Continue Shopping
            </Link>
          </div>
        </section>

        {/* Bento Grid Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-base mb-xxl">
          {/* Order ID & Status */}
          <div className="md:col-span-4 bg-surface-container-lowest p-lg rounded border border-border-gray flex flex-col justify-between">
            <div className="flex flex-col gap-md">
              <div>
                <p className="font-body-sm text-secondary uppercase tracking-wider mb-xs">Order ID</p>
                <p className="font-headline-sm text-headline-sm text-primary break-all">{order.id}</p>
              </div>

              <div className="pt-base border-t border-border-gray">
                <p className="font-body-sm text-secondary uppercase tracking-wider mb-xs">Order Date</p>
                <p className="font-body-md text-primary font-semibold">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="pt-base border-t border-border-gray">
                <p className="font-body-sm text-secondary uppercase tracking-wider mb-xs">Payment ID</p>
                <p className="font-body-md text-primary font-semibold break-all">
                  {order.razorpayPaymentId || "N/A"}
                </p>
              </div>

              <div className="pt-base border-t border-border-gray">
                <p className="font-body-sm text-secondary uppercase tracking-wider mb-xs">Order Status</p>
                <p className="font-body-md text-primary font-semibold capitalize">
                  {order.orderStatus}
                </p>
              </div>

              <div className="pt-base border-t border-border-gray">
                <p className="font-body-sm text-secondary uppercase tracking-wider mb-xs">Payment Status</p>
                <div className="flex items-center gap-xs">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      order.paymentStatus.toLowerCase() === "paid" || order.paymentStatus.toLowerCase() === "success"
                        ? "bg-success-green"
                        : order.paymentStatus.toLowerCase() === "pending"
                        ? "bg-accent-yellow"
                        : "bg-error-red"
                    }`}
                  ></span>
                  <p
                    className={`font-label-bold capitalize ${
                      order.paymentStatus.toLowerCase() === "paid" || order.paymentStatus.toLowerCase() === "success"
                        ? "text-success-green"
                        : order.paymentStatus.toLowerCase() === "pending"
                        ? "text-accent-yellow"
                        : "text-error-red"
                    }`}
                  >
                    {order.paymentStatus}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="md:col-span-8 bg-surface-container-lowest p-lg rounded border border-border-gray flex flex-col md:flex-row gap-lg">
            <div className="flex-1">
              <p className="font-body-sm text-secondary uppercase tracking-wider mb-xs">Delivery Address</p>
              <p className="font-label-bold text-primary mb-xs">{order.address.fullName}</p>
              <p className="font-body-md text-secondary leading-relaxed">
                {order.address.line1}
                {order.address.line2 && <><br />{order.address.line2}</>}
                <br />
                {order.address.city} - {order.address.pincode}
                <br />
                Phone: {order.address.phone}
              </p>
            </div>
            <div className="md:w-px md:bg-border-gray"></div>
            <div className="flex-1">
              <p className="font-body-sm text-secondary uppercase tracking-wider mb-xs">Expected Delivery</p>
              <div className="flex items-center gap-sm text-primary mb-sm">
                <span className="material-symbols-outlined text-accent-yellow">local_shipping</span>
                <p className="font-headline-sm text-headline-sm">{deliveryDayStr}</p>
              </div>
              <p className="font-body-md text-secondary">
                A shipping update will be shared once the package leaves our warehouse.
              </p>
            </div>
          </div>

          {/* Product Summary */}
          <div className="md:col-span-12 bg-surface-container-lowest p-lg rounded border border-border-gray">
            <h3 className="font-headline-sm text-headline-sm mb-lg">
              Order Summary ({totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"})
            </h3>
            <div className="space-y-base">
              {order.items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-base ${
                    index < order.items.length - 1 ? "pb-base border-b border-border-gray" : ""
                  }`}
                >
                  <div className="w-20 h-20 bg-surface-container-low rounded overflow-hidden flex-shrink-0">
                    <img
                      className="w-full h-full object-cover"
                      src={item.product.images[0]?.url || "/placeholder.jpg"}
                      alt={item.product.name}
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-body-sm text-secondary mb-xs">
                      {item.product.seller?.businessName?.toUpperCase() || "MINIBRANDS"}
                    </p>
                    <p className="font-label-bold text-primary truncate">{item.product.name}</p>
                    <p className="font-body-sm text-secondary">
                      Size: {item.variant.size} | Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-price-lg text-price-lg text-primary">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-lg pt-lg border-t border-border-gray flex justify-end">
              <div className="w-full md:w-64 space-y-sm">
                <div className="flex justify-between text-body-md text-secondary">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-body-md text-secondary">
                  <span>Shipping</span>
                  {order.shipping === 0 ? (
                    <span className="text-success-green">FREE</span>
                  ) : (
                    <span>{formatPrice(order.shipping)}</span>
                  )}
                </div>
                <div className="flex justify-between text-headline-sm text-primary pt-sm border-t border-border-gray">
                  <span>Total</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <section>
          <div className="flex items-center justify-between mb-lg">
            <h2 className="font-headline-sm text-headline-sm text-primary">Recommended for You</h2>
            <Link className="text-primary font-label-bold hover:underline" href="/products">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-base">
            {finalRecommended.map((prod: any) => {
              const isMock = prod.id.startsWith("mock-");
              const priceVal = prod.price;
              const formattedPrice = formatPrice(priceVal);
              const originalPriceVal = isMock ? prod.originalPrice : null;
              const formattedOriginalPrice = originalPriceVal ? formatPrice(originalPriceVal) : null;
              
              const imageUrl = prod.images[0]?.url || "/placeholder.jpg";
              const sellerName = prod.seller?.businessName?.toUpperCase() || "MINIBRANDS";
              const isVerified = prod.verified || (prod.seller?.verification?.kycStatus === "approved" || prod.seller?.verification?.kycStatus === "auto_approved");

              return (
                <Link
                  key={prod.id}
                  href={isMock ? "#" : `/products/${prod.id}`}
                  className="bg-surface-container-lowest border border-border-gray rounded-lg group cursor-pointer hover:shadow-md transition-shadow block overflow-hidden"
                >
                  <div className="aspect-square bg-surface-container-low relative overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      src={imageUrl}
                      alt={prod.name}
                    />
                    <WishlistIconButton
                      productId={prod.id}
                      isLoggedIn={!!session?.user}
                      initialIsWishlisted={wishlistIds.includes(prod.id)}
                    />
                  </div>
                  <div className="p-md">
                    <p className="font-body-sm text-secondary mb-1">{sellerName}</p>
                    <h4 className="font-label-bold text-primary line-clamp-1 mb-2">{prod.name}</h4>
                    <div className="flex items-center gap-sm">
                      <span className="font-price-lg text-price-lg text-primary">{formattedPrice}</span>
                      {formattedOriginalPrice && (
                        <span className="text-body-sm text-secondary line-through">{formattedOriginalPrice}</span>
                      )}
                      {isMock && prod.tag === "Verified" && (
                        <span className="bg-accent-yellow/10 text-accent-yellow px-xs py-[1px] text-[10px] rounded font-bold uppercase tracking-tighter">
                          Verified
                        </span>
                      )}
                      {isMock && prod.tag === "Sale" && (
                        <span className="text-success-green font-label-bold text-[12px]">Sale</span>
                      )}
                      {!isMock && isVerified && (
                        <span className="bg-accent-yellow/10 text-accent-yellow px-xs py-[1px] text-[10px] rounded font-bold uppercase tracking-tighter">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full mt-xxl bg-surface-container-high border-t border-border-gray">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-base px-base py-xl max-w-container-max mx-auto">
          <div>
            <span className="font-headline-sm text-headline-sm font-bold text-primary">MINIBRANDS</span>
            <p className="mt-base text-on-surface-variant font-body-sm">
              The ultimate destination for premium brands in India. Quality curated, delivered to your doorstep.
            </p>
          </div>
          <div>
            <h5 className="font-label-bold text-primary mb-base">Quick Links</h5>
            <ul className="space-y-sm text-on-surface-variant font-body-sm">
              <li><Link className="hover:underline hover:text-primary transition-all duration-200" href="#">About Us</Link></li>
              <li><Link className="hover:underline hover:text-primary transition-all duration-200" href="#">Contact Us</Link></li>
              <li><Link className="hover:underline hover:text-primary transition-all duration-200" href="#">Return Policy</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-label-bold text-primary mb-base">Support</h5>
            <ul className="space-y-sm text-on-surface-variant font-body-sm">
              <li><Link className="hover:underline hover:text-primary transition-all duration-200" href="#">Terms of Service</Link></li>
              <li><Link className="hover:underline hover:text-primary transition-all duration-200" href="#">Privacy Policy</Link></li>
              <li><Link className="hover:underline hover:text-primary transition-all duration-200" href="#">FAQs</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-label-bold text-primary mb-base">Newsletter</h5>
            <p className="font-body-sm text-on-surface-variant mb-base">Get updates on latest drops and exclusive offers.</p>
            <div className="flex">
              <input
                className="bg-surface-container-lowest border border-border-gray p-2 text-sm rounded-l outline-none w-full"
                placeholder="Email address"
                type="email"
              />
              <button className="bg-primary text-white px-base rounded-r hover:opacity-90">Join</button>
            </div>
          </div>
        </div>
        <div className="border-t border-border-gray py-base px-base text-center text-on-surface-variant font-body-sm">
          © 2024 MINIBRANDS India. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
