export function getProductDiscountAndMrp(priceInPaise: number, productId: string) {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = productId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);
  // Realistic discount options matching design
  const discountOpts = [15, 20, 25, 28, 30, 33, 40, 45, 50];
  const discountPercent = discountOpts[absHash % discountOpts.length];
  
  const priceRupees = priceInPaise / 100;
  const mrpRupees = Math.round(priceRupees / (1 - discountPercent / 100));
  const mrpInPaise = mrpRupees * 100;
  
  return {
    discountPercent,
    mrpInPaise,
  };
}

export function getProductRatingAndReviews(productId: string) {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = productId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);
  
  // Rating between 4.0 and 4.9
  const rating = (4.0 + (absHash % 10) / 10).toFixed(1);
  
  // Review count options
  const reviewsOpts = [45, 92, 120, 240, 312, 540, 856, 1200, 1800, 2100, 5400];
  const reviewCount = reviewsOpts[absHash % reviewsOpts.length];
  const formattedReviews = reviewCount >= 1000 ? `${(reviewCount / 1000).toFixed(1)}k` : `${reviewCount}`;
  
  return {
    rating: parseFloat(rating),
    reviewCount,
    formattedReviews,
  };
}

export function getProductBadge(productId: string, rating: number) {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = productId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);
  
  if (absHash % 7 === 0) return "Best Seller";
  if (absHash % 7 === 1) return "New Arrival";
  if (rating >= 4.7 && absHash % 7 === 2) return "Top Rated";
  return null;
}

export function enrichProductWithComputedFields(product: any, wishlistProductIds: string[] = []): any {
  const { discountPercent, mrpInPaise } = getProductDiscountAndMrp(product.price, product.id);
  const { rating, reviewCount, formattedReviews } = getProductRatingAndReviews(product.id);
  const badge = getProductBadge(product.id, rating);
  const isWishlisted = wishlistProductIds.includes(product.id);

  return {
    ...product,
    mrp: mrpInPaise,
    discountPercent,
    rating,
    reviewCount,
    formattedReviews,
    badge,
    isWishlisted,
  };
}
