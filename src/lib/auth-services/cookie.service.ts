import { cookies } from "next/headers";

export class CookieService {
  static async hasSessionCookie(): Promise<boolean> {
    try {
      const cookieStore = await cookies();
      return (
        cookieStore.has("better-auth.session_token") ||
        cookieStore.has("__Secure-better-auth.session_token")
      );
    } catch (error) {
      console.error("CookieService.hasSessionCookie error:", error);
      return false;
    }
  }

  static async clearSessionCookies(): Promise<void> {
    try {
      const cookieStore = await cookies();
      // Only delete if they exist to prevent unnecessary headers mutation
      if (cookieStore.has("better-auth.session_token")) {
        cookieStore.delete("better-auth.session_token");
      }
      if (cookieStore.has("__Secure-better-auth.session_token")) {
        cookieStore.delete("__Secure-better-auth.session_token");
      }
    } catch (error) {
      // Catch error silently since Next.js throws inside Server Component render
      console.warn("CookieService.clearSessionCookies: Called in render context, skipping cookie deletion.");
    }
  }
}
