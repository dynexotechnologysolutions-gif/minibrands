/**
 * Resolves the application base URL dynamically and strips trailing slashes.
 * - In development/testing, resolves to localhost:3000.
 * - In production, resolves to the target Vercel domain 'https://minibrands-fbms.vercel.app'.
 */
export function getAppUrl(): string {
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1");

  let url = "http://localhost:3000";
  if (isProd) {
    url = "https://minibrands-fbms.vercel.app";
  } else {
    url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }

  return url.replace(/\/$/, "");
}
