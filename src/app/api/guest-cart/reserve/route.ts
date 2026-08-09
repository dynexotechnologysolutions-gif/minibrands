import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { productId, variantId, quantity } = await req.json();

    if (!productId || !variantId || !quantity) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const cookieStore = await cookies();
    let guestCartId = cookieStore.get("mb-guest-cart")?.value;

    if (!guestCartId) {
      guestCartId = crypto.randomUUID();
      // Set 24 hour session cookie for guest cart identifier
      cookieStore.set("mb-guest-cart", guestCartId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60, // 24 hours
        path: "/",
      });
    }

    // Load product and check database stock
    const product = await prisma.product.findUnique({
      where: { id: productId, isDeleted: false },
      include: {
        variants: { where: { id: variantId } },
      },
    });

    const variant = product?.variants[0];
    if (!product || !variant || !product.isPublished) {
      return NextResponse.json({ error: "Product variant not found" }, { status: 404 });
    }

    const reservationKey = `guest-reservation:${guestCartId}:${variantId}`;

    // Get current reservations sum for this variant to check overall availability
    // Authenticated reservations
    let totalReserved = 0;
    const authKeys = await redis.keys("reservation:*");
    if (authKeys.length > 0) {
      const pipeline = redis.pipeline();
      authKeys.forEach((key) => pipeline.get(key));
      const results = await pipeline.exec();
      results.forEach((val: any) => {
        if (val) {
          const data = typeof val === "string" ? JSON.parse(val) : val;
          if (data && data.variantId === variantId) {
            totalReserved += Number(data.quantity) || 0;
          }
        }
      });
    }

    // Guest reservations
    const guestKeys = await redis.keys("guest-reservation:*:*");
    if (guestKeys.length > 0) {
      const pipeline = redis.pipeline();
      guestKeys.forEach((key) => pipeline.get(key));
      const results = await pipeline.exec();
      results.forEach((val: any, idx) => {
        const key = guestKeys[idx];
        // Exclude our own active reservation if we're updating it
        if (key !== reservationKey && val) {
          const data = typeof val === "string" ? JSON.parse(val) : val;
          if (data && data.variantId === variantId) {
            totalReserved += Number(data.quantity) || 0;
          }
        }
      });
    }

    const availableStock = variant.stockCount - totalReserved;
    if (availableStock < quantity) {
      return NextResponse.json({ error: "Insufficient stock available" }, { status: 400 });
    }

    // Store reservation in Redis (15-min TTL)
    const reservationPayload = {
      guestCartId,
      productId,
      variantId,
      quantity,
      price: product.price, // paise
      createdAt: new Date().toISOString(),
    };

    await redis.set(reservationKey, JSON.stringify(reservationPayload), { ex: 900 });

    return NextResponse.json({ success: true, guestCartId });
  } catch (error: any) {
    console.error("[Guest Cart Reserve Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const guestCartId = cookieStore.get("mb-guest-cart")?.value;

    if (guestCartId) {
      const keys = await redis.keys(`guest-reservation:${guestCartId}:*`);
      if (keys.length > 0) {
        const pipeline = redis.pipeline();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
