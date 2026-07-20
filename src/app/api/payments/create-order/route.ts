import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redis, ReservationData } from "@/lib/redis";
import { createRazorpayOrder } from "@/lib/razorpay";
import { CheckoutSessionPayload } from "@/actions/checkout-session.action";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { addressId, sessionId, reservationId } = await req.json();

    if (!addressId) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    }

    if (!sessionId && !reservationId) {
      return NextResponse.json({ error: "Checkout session or reservation is required" }, { status: 400 });
    }

    // Fetch user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Fetch address and verify ownership
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userProfileId !== userProfile.id) {
      return NextResponse.json({ error: "Invalid delivery address" }, { status: 400 });
    }

    let products: { productId: string; variantId: string; quantity: number; price: number }[] = [];

    if (sessionId) {
      const sessionKey = `checkout-session:${sessionId}`;
      const sessionRaw = await redis.get(sessionKey);
      if (!sessionRaw) {
        return NextResponse.json({ error: "Checkout session expired" }, { status: 400 });
      }
      const checkoutSession = (
        typeof sessionRaw === "string" ? JSON.parse(sessionRaw) : sessionRaw
      ) as CheckoutSessionPayload;
      products = checkoutSession.products.map(p => ({
        productId: p.productId,
        variantId: p.variantId,
        quantity: p.quantity,
        price: p.price,
        reservationId: p.reservationId,
      }));
    } else if (reservationId) {
      const reservationKey = `reservation:${reservationId}`;
      const reservationRaw = await redis.get(reservationKey);
      if (!reservationRaw) {
        return NextResponse.json({ error: "Hold reservation expired" }, { status: 400 });
      }
      const reservation = (
        typeof reservationRaw === "string" ? JSON.parse(reservationRaw) : reservationRaw
      ) as ReservationData;

      if (reservation.userProfileId !== userProfile.id) {
        return NextResponse.json({ error: "Unauthorized access to reservation" }, { status: 403 });
      }

      // Load product price
      const dbProd = await prisma.product.findUnique({
        where: { id: reservation.productId },
      });
      if (!dbProd) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      products = [{
        productId: reservation.productId,
        variantId: reservation.variantId,
        quantity: reservation.quantity,
        price: dbProd.price,
      }];
    }

    if (products.length === 0) {
      return NextResponse.json({ error: "No products in checkout" }, { status: 400 });
    }

    // Validate products, stock, and seller verification
    let sellerId = "";
    for (const p of products) {
      const dbProduct = await prisma.product.findUnique({
        where: { id: p.productId, isDeleted: false },
        include: {
          seller: { include: { verification: true } },
          variants: { where: { id: p.variantId } },
        },
      });

      if (!dbProduct || !dbProduct.isPublished) {
        return NextResponse.json({ error: `Product '${p.productId}' is no longer available` }, { status: 404 });
      }

      const variant = dbProduct.variants[0];
      if (!variant || variant.stockCount < p.quantity) {
        return NextResponse.json({ error: `Insufficient stock for product '${dbProduct.name}'` }, { status: 400 });
      }

      const verification = dbProduct.seller.verification;
      const isSellerVerified =
        verification &&
        (verification.kycStatus === "auto_approved" || verification.kycStatus === "approved") &&
        verification.bankVerified;

      if (!isSellerVerified) {
        return NextResponse.json({ error: `Purchasing is disabled for boutique seller '${dbProduct.seller.businessName}'` }, { status: 400 });
      }

      sellerId = dbProduct.sellerId;
    }

    // Calculate final payable amount matching CheckoutClient.tsx
    const itemsTotal = products.reduce((acc, p) => acc + p.price * p.quantity, 0); // in paise
    const platformFee = itemsTotal > 10000 ? 1000 : 0; // ₹10 platform fee if total > ₹100
    const packagingFee = itemsTotal > 10000 ? 5900 : 0; // ₹59 packaging fee if total > ₹100
    
    const orderSubtotal = itemsTotal - platformFee - packagingFee;
    const orderShipping = 0;
    const orderTax = platformFee + packagingFee;
    const orderTotalAmount = itemsTotal; // final payable amount in paise

    // Create Razorpay Order
    const receiptId = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const rzpOrder = await createRazorpayOrder(orderTotalAmount, receiptId);

    // Cache pending order details in Redis with 15-minute TTL (900 seconds)
    const pendingOrderPayload = {
      userId: userProfile.id,
      addressId,
      sessionId,
      reservationId,
      products,
      subtotal: orderSubtotal,
      shipping: orderShipping,
      tax: orderTax,
      totalAmount: orderTotalAmount,
      sellerId,
    };

    await redis.set(`pending-order:${rzpOrder.id}`, JSON.stringify(pendingOrderPayload), { ex: 900 });

    return NextResponse.json({
      razorpayOrderId: rzpOrder.id,
      amount: orderTotalAmount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mockkey",
    });
  } catch (error: any) {
    console.error("[Create Order API Error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
