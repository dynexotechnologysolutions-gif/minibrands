import { Product } from "../types/Product";

export async function fetchWishlist(): Promise<Product[]> {
  const res = await fetch("/api/wishlist");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch wishlist");
  }
  const data = await res.json();
  return data.products || [];
}

export async function addToWishlist(productId: string): Promise<void> {
  const res = await fetch("/api/wishlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to add to wishlist");
  }
}

export async function removeFromWishlist(productId: string): Promise<void> {
  const res = await fetch(`/api/wishlist/${productId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to remove from wishlist");
  }
}
