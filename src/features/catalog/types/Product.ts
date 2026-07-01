export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  stockCount: number;
}

export interface SellerVerification {
  kycStatus: string;
  bankVerified: boolean;
  trustScore: number;
}

export interface Seller {
  id: string;
  businessName: string;
  storeName: string;
  storeLogo: string | null;
  verification?: SellerVerification | null;
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  subcategory: string | null;
  tags: string[];
  price: number; // in paise
  isPublished: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
  variants: ProductVariant[];
  seller: Seller;

  // Computed UI fields
  mrp: number; // in paise
  discountPercent: number;
  rating: number;
  reviewCount: number;
  formattedReviews: string;
  badge: "Best Seller" | "New Arrival" | "Top Rated" | null;
  isWishlisted?: boolean;
}
