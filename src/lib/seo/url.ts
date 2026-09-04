/**
 * SEO & Canonical URL Utilities for MiniBrands
 */

/**
 * Returns the normalized base site URL for MiniBrands.
 * Prefers process.env.NEXT_PUBLIC_APP_URL if defined, falling back to 'https://minibrands.in'.
 * Guarantees 'https://' protocol and strips trailing slashes.
 */
export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  let url = envUrl || "https://minibrands.in";

  // Ensure protocol is present
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  // Strip trailing slash
  return url.replace(/\/$/, "");
}

/**
 * Constructs an absolute canonical URL for a given path.
 * Example: getCanonicalUrl('/products') => 'https://minibrands.in/products'
 */
export function getCanonicalUrl(path: string = ""): string {
  const baseUrl = getSiteUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
