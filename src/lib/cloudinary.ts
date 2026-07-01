import crypto from "crypto";

/**
 * Generates a Cloudinary signature for client-side signed uploads.
 * Params must be sorted alphabetically and joined with '&', followed by the API secret.
 */
export function generateCloudinarySignature(
  params: Record<string, any>,
  apiSecret: string
): string {
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(paramString + apiSecret)
    .digest("hex");
}
