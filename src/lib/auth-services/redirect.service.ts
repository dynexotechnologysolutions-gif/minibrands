import { Role } from "@prisma/client";

export class RedirectService {
  /**
   * Validates target redirect URL. Returns a safe internal URL.
   */
  static secureRedirectTo(url: string | null | undefined, role?: Role): string {
    if (!url || typeof url !== "string") {
      return this.getFallbackForRole(role);
    }

    try {
      // Decode URL if encoded
      const decodedUrl = decodeURIComponent(url);

      // Prevent Open Redirect attacks: URL must not contain protocol or host
      // If it starts with '//', reject it (relative protocol redirect)
      if (decodedUrl.startsWith("//") || decodedUrl.match(/^[a-zA-Z0-9+-.]+:\/\//)) {
        console.warn(`RedirectService: Blocked external redirect attempt to "${url}"`);
        return this.getFallbackForRole(role);
      }

      // Must be an internal path (starts with '/')
      if (!decodedUrl.startsWith("/")) {
        console.warn(`RedirectService: Blocked malformed redirect attempt to "${url}"`);
        return this.getFallbackForRole(role);
      }

      // Verify the path matches the user's role permission
      if (role) {
        if (decodedUrl.startsWith("/seller") && role !== Role.SELLER && role !== Role.ADMIN && role !== Role.SUPER_ADMIN) {
          return this.getFallbackForRole(role);
        }
        if (decodedUrl.startsWith("/admin") && role !== Role.ADMIN && role !== Role.SUPER_ADMIN) {
          return this.getFallbackForRole(role);
        }
      }

      return decodedUrl;
    } catch (e) {
      console.error("RedirectService.secureRedirectTo error:", e);
      return this.getFallbackForRole(role);
    }
  }

  /**
   * Returns a safe home route for a given user role.
   */
  static getFallbackForRole(role?: Role): string {
    if (!role) return "/";
    if (role === Role.ADMIN || role === Role.SUPER_ADMIN) return "/admin";
    if (role === Role.SELLER) return "/seller/dashboard";
    return "/"; // Default for BUYER or guest
  }

  /**
   * Returns the correct login page path for a role.
   */
  static getLoginForRole(role?: string): string {
    if (role === "admin") return "/admin/login";
    if (role === "seller") return "/seller/login";
    return "/login";
  }
}
