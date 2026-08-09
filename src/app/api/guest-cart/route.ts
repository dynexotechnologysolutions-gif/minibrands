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

    for (const item of rawItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId, isDeleted: false },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          seller: true,
          variants: { where: { id: item.variantId } },
        },
      });

      const variant = product?.variants[0];
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
        isReserved: item.isReserved, // true if stock is locked, false if reservation expired
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
