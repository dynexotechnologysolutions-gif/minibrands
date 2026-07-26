"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CookieService } from "@/lib/auth-services/cookie.service";

/**
 * Performs an atomic, server-side logout that deletes Better Auth session,
 * clears local cookies, purges cache, and redirects cleanly.
 */
export async function atomicLogout() {
  try {
    const reqHeaders = await headers();
    // 1. Terminate session in Better Auth backend (Neon database)
    await auth.api.signOut({
      headers: reqHeaders,
    });
  } catch (error) {
    console.error("atomicLogout: database signout failed, proceeding with cookie deletion:", error);
  }

  // 2. Delete session cookies from response headers
  await CookieService.clearSessionCookies();

  // 3. Revalidate all application paths to invalidate RSC cache
  revalidatePath("/", "layout");

  // 4. Clean redirect to homepage
  redirect("/");
}
