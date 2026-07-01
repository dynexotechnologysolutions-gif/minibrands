/**
 * Pure function to check if a product is ready to be published.
 * Requirements:
 * 1. Has at least 1 image.
 * 2. Has at least 1 variant with stockCount > 0.
 */
export function isEligibleToPublish(product: {
  images?: { url: string }[] | null;
  variants?: { stockCount: number }[] | null;
}): { eligible: boolean; reason?: string } {
  const hasImages = Array.isArray(product.images) && product.images.length > 0;
  const hasStock =
    Array.isArray(product.variants) &&
    product.variants.some((v) => v.stockCount > 0);

  if (!hasImages && !hasStock) {
    return {
      eligible: false,
      reason: "Add at least one product photo and one size with stock to publish.",
    };
  }

  if (!hasImages) {
    return {
      eligible: false,
      reason: "Add at least one product photo to publish.",
    };
  }

  if (!hasStock) {
    return {
      eligible: false,
      reason: "Add at least one size with stock to publish.",
    };
  }

  return { eligible: true };
}
