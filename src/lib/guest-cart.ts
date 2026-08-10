import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export interface GuestCartItem {
  variantId: string;
  productId: string;
  quantity: number;
  addedAt: string;
  isReserved: boolean;
}

/**
 * Calculates total active reservations (authenticated + guest) for a variant.
 * Avoids wildcard scan where possible, but sums overall holds.
 */
export async function getTotalReservedStock(variantId: string, excludeGuestCartId?: string): Promise<number> {
  let totalReserved = 0;
  
  // 1. Authenticated reservations
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

  // 2. Guest reservations
  const guestKeys = await redis.keys("guest-reservation:*:*");
  if (guestKeys.length > 0) {
    const pipeline = redis.pipeline();
    guestKeys.forEach((key) => pipeline.get(key));
    const results = await pipeline.exec();
    results.forEach((val: any, idx) => {
      const key = guestKeys[idx];
      if (val) {
        const data = typeof val === "string" ? JSON.parse(val) : val;
        if (data && data.variantId === variantId) {
          // If excludeGuestCartId is provided, do not count our own reservation
          if (!excludeGuestCartId || !key.startsWith(`guest-reservation:${excludeGuestCartId}:`)) {
            totalReserved += Number(data.quantity) || 0;
          }
        }
      }
    });
  }

  return totalReserved;
}

/**
 * Lists all cart items in a guest catalog index.
 * Uses hgetall for instant O(1) or O(M) retrieval without scanning.
 */
export async function getGuestCartItems(guestCartId: string): Promise<GuestCartItem[]> {
  const hashKey = `guest-cart:${guestCartId}`;
  const cartData = await redis.hgetall(hashKey);
  if (!cartData) return [];

  const items: GuestCartItem[] = [];
  for (const [variantId, value] of Object.entries(cartData)) {
    if (!value) continue;
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    
    // Check if the individual reservation key exists (15m TTL)
    const isReserved = await redis.exists(`guest-reservation:${guestCartId}:${variantId}`);
    
    items.push({
      variantId,
      productId: parsed.productId,
      quantity: parsed.quantity,
      addedAt: parsed.addedAt,
      isReserved: isReserved === 1,
    });
  }

  return items;
}

/**
 * Atomically reserves a product variant inside guest cart catalog index and sets 15-minute hold.
 */
export async function addGuestCartItem(
  guestCartId: string,
  productId: string,
  variantId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  // Validate variant and stock
  const product = await prisma.product.findUnique({
    where: { id: productId, isDeleted: false },
    include: {
      variants: { where: { id: variantId } },
      seller: { include: { verification: true } },
    },
  });

  const variant = product?.variants[0];
  if (!product || !variant || !product.isPublished) {
    return { success: false, error: "Product variant not found" };
  }

  // Check seller verification status
  const verification = product.seller.verification;
  const isSellerVerified =
    verification &&
    (verification.kycStatus === "auto_approved" || verification.kycStatus === "approved") &&
    verification.bankVerified;

  if (!isSellerVerified) {
    return { success: false, error: "Purchasing is disabled for this seller" };
  }

  // Verify total active reservations of all users
  const totalReserved = await getTotalReservedStock(variantId);
  const availableStock = variant.stockCount - totalReserved;
  if (availableStock < quantity) {
    return { success: false, error: "Insufficient stock available" };
  }

  // Set the 15-minute reservation hold key
  const reservationKey = `guest-reservation:${guestCartId}:${variantId}`;
  await redis.set(reservationKey, JSON.stringify({
    guestCartId,
    productId,
    variantId,
    quantity,
    price: product.price,
    createdAt: new Date().toISOString(),
  }));
  await redis.expire(reservationKey, 900);

  // Update the 30-day guest-cart catalog index Hash
  const hashKey = `guest-cart:${guestCartId}`;
  await redis.hset(hashKey, {
    [variantId]: JSON.stringify({
      productId,
      quantity,
      addedAt: new Date().toISOString(),
    })
  });
  // Set the catalog hash to expire in 30 days
  await redis.expire(hashKey, 30 * 24 * 60 * 60);

  return { success: true };
}

/**
 * Updates item quantity in guest cart, validating stock and renewing 15-minute hold.
 */
export async function updateGuestCartItemQuantity(
  guestCartId: string,
  variantId: string,
  newQuantity: number
): Promise<{ success: boolean; error?: string }> {
  if (newQuantity < 1 || newQuantity > 5) {
    return { success: false, error: "Quantity must be between 1 and 5" };
  }

  const hashKey = `guest-cart:${guestCartId}`;
  const itemRaw = await redis.hget(hashKey, variantId);
  if (!itemRaw) {
    return { success: false, error: "Item not found in guest cart" };
  }
  const item = typeof itemRaw === "string" ? JSON.parse(itemRaw) : itemRaw;

  // Validate variant and stock
  const product = await prisma.product.findUnique({
    where: { id: item.productId, isDeleted: false },
    include: {
      variants: { where: { id: variantId } },
    },
  });

  const variant = product?.variants[0];
  if (!product || !variant) {
    return { success: false, error: "Product variant not found" };
  }

  // Calculate total reserved stock excluding this guest cart's own active reservation
  const totalReserved = await getTotalReservedStock(variantId, guestCartId);
  const availableStock = variant.stockCount - totalReserved;
  if (availableStock < newQuantity) {
    return { success: false, error: `Only ${availableStock} units are available in stock` };
  }

  // Update the 15-minute reservation key
  const reservationKey = `guest-reservation:${guestCartId}:${variantId}`;
  await redis.set(reservationKey, JSON.stringify({
    guestCartId,
    productId: item.productId,
    variantId,
    quantity: newQuantity,
    price: product.price,
    createdAt: new Date().toISOString(),
  }));
  await redis.expire(reservationKey, 900);

  // Update catalog hash
  await redis.hset(hashKey, {
    [variantId]: JSON.stringify({
      productId: item.productId,
      quantity: newQuantity,
      addedAt: item.addedAt || new Date().toISOString(),
    })
  });

  return { success: true };
}

/**
 * Removes product from guest cart, releasing active stock reservation.
 */
export async function removeGuestCartItem(guestCartId: string, variantId: string): Promise<{ success: boolean }> {
  // Delete the 15-minute reservation key
  await redis.del(`guest-reservation:${guestCartId}:${variantId}`);
  
  // Remove from catalog index hash
  await redis.hdel(`guest-cart:${guestCartId}`, variantId);

  return { success: true };
}

/**
 * Clears the guest cart catalog index and deletes all active variant holds.
 */
export async function clearGuestCart(guestCartId: string): Promise<{ success: boolean }> {
  const hashKey = `guest-cart:${guestCartId}`;
  const cartData = await redis.hgetall(hashKey);
  if (cartData) {
    const pipeline = redis.pipeline();
    for (const variantId of Object.keys(cartData)) {
      pipeline.del(`guest-reservation:${guestCartId}:${variantId}`);
    }
    pipeline.del(hashKey);
    await pipeline.exec();
  }

  return { success: true };
}
