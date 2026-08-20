import { NextResponse } from "next/server";
import { getGuestCartId } from "@/lib/guest-cookie";
import { getGuestCartItems, updateGuestCartItemQuantity, removeGuestCartItem } from "@/lib/guest-cart";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET: Retrieves guest cart items from catalog hash, details from DB, and checks active stock reservation holds.
 */
export async function GET() {
  try {
    const guestCartId = await getGuestCartId();
    if (!guestCartId) {
      return NextResponse.json({ success: true, items: [] });
    }

    const rawItems = await getGuestCartItems(guestCartId);
    const cartItems = [];

    // Batch fetch products and variants for all guest cart items
    const productIds = [...new Set(rawItems.map((item) => item.productId).filter(Boolean))];
    const variantIds = [...new Set(rawItems.map((item) => item.variantId).filter(Boolean))];

    const [products, variants] = await Promise.all([
      productIds.length > 0
        ? prisma.product.findMany({
            where: {
              id: { in: productIds },
              isDeleted: false,
              isPublished: true,
            },
            include: {
              images: { orderBy: { sortOrder: "asc" } },
              seller: true,
            },
          })
        : [],
      variantIds.length > 0
        ? prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
          })
        : [],
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    for (const item of rawItems) {
      const product = productMap.get(item.productId);
      const variant = variantMap.get(item.variantId);
      if (!product || !variant || !product.isPublished) continue;

      cartItems.push({
        id: `${guestCartId}:${item.variantId}`,
        productId: product.id,
        variantId: variant.id,
        quantity: item.quantity,
        price: product.price,
        createdAt: item.addedAt,
        name: product.name,
        image: product.images[0]?.url || "/placeholder.jpg",
        sellerName: product.seller.businessName,
        sellerId: product.sellerId,
        size: variant.size,
        isReserved: item.isReserved,
      });
    }

    return NextResponse.json({ success: true, items: cartItems });
  } catch (error: any) {
    console.error("[Guest Cart GET Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH: Updates variant quantity in guest cart, validating stock and renewing TTL.
 */
export async function PATCH(req: Request) {
  try {
    const guestCartId = await getGuestCartId();
    if (!guestCartId) {
      return NextResponse.json({ error: "No guest session found" }, { status: 400 });
    }

    const { variantId, quantity } = await req.json();
    if (!variantId || quantity === undefined) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const result = await updateGuestCartItemQuantity(guestCartId, variantId, quantity);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to update item quantity" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Guest Cart PATCH Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE: Removes a single variant from the guest cart.
 */
export async function DELETE(req: Request) {
  try {
    const guestCartId = await getGuestCartId();
    if (!guestCartId) {
      return NextResponse.json({ error: "No guest session found" }, { status: 400 });
    }

    const { variantId } = await req.json();
    if (!variantId) {
      return NextResponse.json({ error: "Missing variantId parameter" }, { status: 400 });
    }

    await removeGuestCartItem(guestCartId, variantId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Guest Cart DELETE Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
