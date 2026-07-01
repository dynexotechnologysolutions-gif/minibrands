import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getProductDiscountAndMrp,
  getProductRatingAndReviews,
  getProductBadge,
  enrichProductWithComputedFields,
} from "../features/catalog/utils/deterministic";
import { GET as getCategories } from "../app/api/categories/route";
import { GET as getProducts } from "../app/api/products/route";
import { GET as getWishlist, POST as postWishlist } from "../app/api/wishlist/route";
import { DELETE as deleteWishlist } from "../app/api/wishlist/[productId]/route";
import { prisma } from "../lib/prisma";
import * as wishlistActions from "../actions/wishlist.action";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => {
    const h = new Headers();
    h.set("cookie", "mock-session-cookie");
    return h;
  }),
}));

// Mock auth
vi.mock("../lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => null),
    },
  },
}));

// Mock redis
vi.mock("../lib/redis", () => ({
  redis: {
    smembers: vi.fn(async () => []),
  },
}));

// Mock prisma client
vi.mock("../lib/prisma", () => ({
  prisma: {
    userProfile: {
      findUnique: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
  },
}));

// Mock wishlist actions
vi.mock("../actions/wishlist.action", () => ({
  getWishlistAction: vi.fn(),
  addToWishlistAction: vi.fn(),
  removeFromWishlistAction: vi.fn(),
}));

describe("Catalog Feature Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Deterministic Calculation Utilities", () => {
    const testId = "prod-abc-123";

    it("should calculate stable MRP and discount", () => {
      const price = 500000; // ₹5,000
      const res1 = getProductDiscountAndMrp(price, testId);
      const res2 = getProductDiscountAndMrp(price, testId);

      expect(res1.discountPercent).toBe(res2.discountPercent);
      expect(res1.mrpInPaise).toBe(res2.mrpInPaise);
      expect(res1.mrpInPaise).toBeGreaterThan(price);
    });

    it("should calculate stable rating and review counts", () => {
      const res1 = getProductRatingAndReviews(testId);
      const res2 = getProductRatingAndReviews(testId);

      expect(res1.rating).toBe(res2.rating);
      expect(res1.rating).toBeGreaterThanOrEqual(4.0);
      expect(res1.rating).toBeLessThanOrEqual(4.9);
      expect(res1.reviewCount).toBe(res2.reviewCount);
    });

    it("should calculate stable badge based on product ID and rating", () => {
      const badge1 = getProductBadge(testId, 4.8);
      const badge2 = getProductBadge(testId, 4.8);
      expect(badge1).toBe(badge2);
    });

    it("should enrich product objects with all computed fields", () => {
      const baseProduct = {
        id: testId,
        name: "Premium Linen Kurti",
        price: 150000,
        category: "Ethnic Wear",
      };

      const enriched = enrichProductWithComputedFields(baseProduct, [testId]);
      expect(enriched.mrp).toBeDefined();
      expect(enriched.discountPercent).toBeDefined();
      expect(enriched.rating).toBeDefined();
      expect(enriched.reviewCount).toBeDefined();
      expect(enriched.formattedReviews).toBeDefined();
      expect(enriched.isWishlisted).toBe(true);
    });
  });

  describe("API Route Handlers", () => {
    describe("GET /api/categories", () => {
      it("should return dynamic categories from database", async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([
          { category: "Custom Handloom" },
        ] as any);

        const response = await getCategories();
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toContain("Custom Handloom");
        expect(data).not.toContain("Beauty");
        expect(data).not.toContain("Accessories");
      });
    });

    describe("GET /api/products (Consolidated)", () => {
      it("should retrieve, enrich, filter, and paginate products", async () => {
        const mockProducts = [
          {
            id: "p1",
            name: "Summer Silk Shirt",
            price: 200000,
            category: "Fashion",
            createdAt: new Date(),
            images: [],
            variants: [],
            seller: { storeName: "Boutique A", businessName: "Boutique A" },
          },
          {
            id: "p2",
            name: "Golden Handloom Saree",
            price: 500000,
            category: "Accessories",
            createdAt: new Date(),
            images: [],
            variants: [],
            seller: { storeName: "Boutique B", businessName: "Boutique B" },
          },
        ];

        vi.mocked(prisma.product.findMany).mockImplementation(((args: any) => {
          const categoryFilter = args?.where?.category;
          if (categoryFilter && categoryFilter !== "All") {
            return Promise.resolve(mockProducts.filter((p) => p.category === categoryFilter)) as any;
          }
          return Promise.resolve(mockProducts) as any;
        }) as any);

        // Fetch without filters
        const req = new Request("http://localhost/api/products?page=1&limit=10");
        const res = await getProducts(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.products).toHaveLength(2);
        expect(data.pagination.totalItems).toBe(2);

        // Fetch with category filter
        const reqCat = new Request("http://localhost/api/products?category=Fashion");
        const resCat = await getProducts(reqCat);
        const dataCat = await resCat.json();
        expect(dataCat.products).toHaveLength(1);
        expect(dataCat.products[0].id).toBe("p1");
      });
    });

    describe("GET /api/wishlist", () => {
      it("should retrieve and enrich user wishlist items", async () => {
        vi.mocked(wishlistActions.getWishlistAction).mockResolvedValue({
          success: true,
          products: [
            { id: "p1", name: "Product 1", price: 1000, images: [], variants: [] },
          ] as any,
        });

        const response = await getWishlist();
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.products[0].isWishlisted).toBe(true);
        expect(data.products[0].mrp).toBeDefined();
      });
    });

    describe("POST /api/wishlist", () => {
      it("should return 400 if productId is missing", async () => {
        const req = new Request("http://localhost/api/wishlist", {
          method: "POST",
          body: JSON.stringify({}),
        });

        const response = await postWishlist(req);
        expect(response.status).toBe(400);
      });

      it("should successfully trigger wishlist action", async () => {
        vi.mocked(wishlistActions.addToWishlistAction).mockResolvedValue({ success: true });

        const req = new Request("http://localhost/api/wishlist", {
          method: "POST",
          body: JSON.stringify({ productId: "p123" }),
        });

        const response = await postWishlist(req);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(wishlistActions.addToWishlistAction).toHaveBeenCalledWith("p123");
      });
    });

    describe("DELETE /api/wishlist/[productId]", () => {
      it("should call remove action with the dynamic productId", async () => {
        vi.mocked(wishlistActions.removeFromWishlistAction).mockResolvedValue({ success: true });

        const response = await deleteWishlist({} as any, {
          params: Promise.resolve({ productId: "p456" }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(wishlistActions.removeFromWishlistAction).toHaveBeenCalledWith("p456");
      });
    });
  });
});
