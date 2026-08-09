import { cookies } from "next/headers";
import crypto from "crypto";

/**
 * Resolves or creates a secure cryptographically random 256-bit guestCartId cookie.
 * Cleans up any potential LocalStorage security dependency.
 */
export async function getOrCreateGuestCartId(): Promise<string> {
  const cookieStore = await cookies();
  let guestCartId = cookieStore.get("mb-guest-cart")?.value;

  if (!guestCartId) {
    guestCartId = crypto.randomBytes(32).toString("hex");
    cookieStore.set("mb-guest-cart", guestCartId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  }

  return guestCartId;
}

/**
 * Returns the active guestCartId from cookie context.
 */
export async function getGuestCartId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("mb-guest-cart")?.value || null;
}

/**
 * Clears the mb-guest-cart cookie.
 */
export async function clearGuestCartId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("mb-guest-cart", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
