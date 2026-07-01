import { describe, it, expect, vi, beforeEach } from "vitest";
import { addToWishlistAction, removeFromWishlistAction, getWishlistAction } from "../actions/wishlist.action";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";
import { auth } from "../lib/auth";

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
      getSession: vi.fn(),
    },
  },
}));

// Mock redis
vi.mock("../lib/redis", () => {
  const store: Record<string, Set<string>> = {};
  return {
    redis: {
      sadd: vi.fn(async (key: string, value: string) => {
        if (!store[key]) store[key] = new Set();
        store[key].add(value);
        return 1;
      }),
      srem: vi.fn(async (key: string, value: string) => {
        if (!store[key]) return 0;
        const deleted = store[key].delete(value);
        return deleted ? 1 : 0;
      }),
      smembers: vi.fn(async (key: string) => {
        return store[key] ? Array.from(store[key]) : [];
      }),
      sismember: vi.fn(async (key: string, value: string) => {
        return store[key]?.has(value) ? 1 : 0;
      }),
    },
    getUserReservations: vi.fn(async () => []),
  };
});

// Mock prisma
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

describe("Wishlist Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addToWishlistAction", () => {
    it("should reject unauthorized users", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const res = await addToWishlistAction("prod-123");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Unauthorized");
    });

    it("should successfully add a product to the user's wishlist in Redis", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-123", email: "test@example.com" },
      } as any);

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-123",
        userId: "user-123",
      } as any);

      const res = await addToWishlistAction("prod-123");
      expect(res.success).toBe(true);
      expect(redis.sadd).toHaveBeenCalledWith("wishlist:profile-123", "prod-123");
    });
  });

  describe("removeFromWishlistAction", () => {
    it("should successfully remove a product from the user's wishlist in Redis", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-123", email: "test@example.com" },
      } as any);

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-123",
        userId: "user-123",
      } as any);

      const res = await removeFromWishlistAction("prod-123");
      expect(res.success).toBe(true);
      expect(redis.srem).toHaveBeenCalledWith("wishlist:profile-123", "prod-123");
    });
  });

  describe("getWishlistAction", () => {
    it("should retrieve product details for items in the user's wishlist", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-123", email: "test@example.com" },
      } as any);

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-123",
        userId: "user-123",
      } as any);

      vi.mocked(redis.smembers).mockResolvedValue(["prod-1", "prod-2"]);

      const mockDbProducts = [
        { id: "prod-1", name: "Product One", price: 1000 },
        { id: "prod-2", name: "Product Two", price: 2000 },
      ];
      vi.mocked(prisma.product.findMany).mockResolvedValue(mockDbProducts as any);

      const res = await getWishlistAction();
      expect(res.success).toBe(true);
      expect(res.products).toBeDefined();
      expect(res.products?.length).toBe(2);
      expect(res.products?.[0]?.id).toBe("prod-1");
      expect(res.products?.[1]?.id).toBe("prod-2");
    });

    it("should return empty list if wishlist has no items in Redis", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-123", email: "test@example.com" },
      } as any);

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-123",
        userId: "user-123",
      } as any);

      vi.mocked(redis.smembers).mockResolvedValue([]);

      const res = await getWishlistAction();
      expect(res.success).toBe(true);
      expect(res.products).toEqual([]);
    });
  });
});
