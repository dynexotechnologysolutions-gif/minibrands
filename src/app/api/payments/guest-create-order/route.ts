import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder } from "@/lib/razorpay";

/**
 * POST /api/payments/guest-create-order
 *
 * Creates a Razorpay order for a guest checkout session.
 *
 * Security rules:
 * 1. All prices are fetched from the database — never from the client request.
 * 2. Seller verification is validated server-side.
 * 3. Stock is validated server-side.
 * 4. The pending order payload stored in Redis does NOT include raw items with client-supplied prices.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { guestInfo, products } = body;

    const cookieStore = await cookies();
    const guestCartId = cookieStore.get("mb-guest-cart")?.value;

    if (!guestInfo) {
      return NextResponse.json({ error: "Customer details are required" }, { status: 400 });
    }

    const { name, email, phone, address } = guestInfo;

    // Server-side validation of guest info
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Full Name is required" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!phone || phone.length < 8) {
      return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 });
    }
    if (!address || !address.line1 || !address.city || !address.postalCode) {
      return NextResponse.json({ error: "Delivery address is incomplete" }, { status: 400 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "No products in checkout" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate products, stock, and seller status — fetch all from DB
    let sellerId = "";
    const validatedProducts: { productId: string; variantId: string; quantity: number; price: number }[] = [];

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

      // Use server-side price from DB — never from client request body
      validatedProducts.push({
        productId: dbProduct.id,
        variantId: variant.id,
        quantity: p.quantity,
        price: dbProduct.price, // authoritative paise price from DB
      });
    }

    // Authoritative server-side amount calculation
    const itemsTotal = validatedProducts.reduce((acc, p) => acc + p.price * p.quantity, 0); // in paise
    const platformFee = itemsTotal > 10000 ? 1000 : 0;
    const packagingFee = itemsTotal > 10000 ? 5900 : 0;

    const orderSubtotal = itemsTotal - platformFee - packagingFee;
    const orderShipping = 0;
    const orderTax = platformFee + packagingFee;
    const orderTotalAmount = itemsTotal; // final payable amount in paise

    // Create Razorpay Order
    const receiptId = `receipt_guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const rzpOrder = await createRazorpayOrder(orderTotalAmount, receiptId);

    // Cache authoritative pending guest order state in Redis with 15-minute TTL
    const pendingOrderPayload = {
      isGuest: true,
      guestCartId: guestCartId || null,
      guestEmail: normalizedEmail,
      guestPhone: phone,
      guestName: name,
      guestShippingAddress: {
        name,
        phone,
        line1: address.line1,
        line2: address.line2 || "",
        city: address.city,
        state: address.state || "",
        postalCode: address.postalCode,
        country: "IN",
      },
      // Use validated DB-sourced products — not client payload
      products: validatedProducts,
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
    console.error("[Create Guest Order API Error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
