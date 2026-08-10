import { describe, it, expect, vi, beforeEach } from "vitest";
import { GuestOrderService } from "@/lib/guest-order.service";
import { mergeGuestCart } from "@/lib/cart-merge.service";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

// Mock prisma client
vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    order: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    userProfile: {
      findUnique: vi.fn(),
    },
    productVariant: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

// Mock redis
vi.mock("@/lib/redis", () => {
  const store: Record<string, string> = {};
  const hstores: Record<string, Record<string, string>> = {};
  return {
    redis: {
      get: vi.fn(async (key: string) => store[key] || null),
      set: vi.fn(async (key: string, val: string) => {
        store[key] = val;
        return "OK";
      }),
      expire: vi.fn(async () => 1),
      del: vi.fn(async (key: string) => {
        delete store[key];
        return 1;
      }),
      hgetall: vi.fn(async (key: string) => hstores[key] || null),
      keys: vi.fn(async (pattern: string) => {
        const prefix = pattern.replace("*", "");
        return Object.keys(store).filter((k) => k.startsWith(prefix));
      }),
      pipeline: vi.fn(() => ({
        get: vi.fn(),
        del: vi.fn(),
        exec: vi.fn(async () => []),
      })),
    },
    deleteMatchingReservation: vi.fn(async () => {}),
  };
});

describe("Guest Checkout Support & Security Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GuestOrderService Token Management", () => {
    it("should generate unique cryptographically secure 32-byte hex guest tokens", () => {
      const token1 = GuestOrderService.generateGuestToken();
      const token2 = GuestOrderService.generateGuestToken();
      expect(token1).toHaveLength(64); // 32 bytes in hex = 64 characters
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    it("should hash raw tokens consistently using SHA-256", () => {
      const rawToken = "super-secret-random-token-value";
      const hash1 = GuestOrderService.hashGuestToken(rawToken);
      const hash2 = GuestOrderService.hashGuestToken(rawToken);
      expect(hash1).toBe(hash2);
      expect(hash1).toBe("f5ce814b58d5f6f08c9f49354b838fd2726eb2dce2729bbd9a9f02273326cced");
    });
  });

  describe("GuestOrderService Claim Order Transaction", () => {
    it("should claim eligible guest orders and assign buyer ID", async () => {
      const mockExpiry = new Date(Date.now() + 100000);
      vi.mocked(prisma.order.findMany).mockResolvedValueOnce([
        {
          id: "guest-order-1",
          guestEmail: "buyer@example.com",
          buyerId: null,
          guestTokenExpiresAt: mockExpiry,
        },
      ] as any);

      const result = await GuestOrderService.claimGuestOrders("buyer@example.com", "profile-123");
      expect(result.success).toBe(true);
      expect(result.claimedCount).toBe(1);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "guest-order-1" },
        data: {
          buyerId: "profile-123",
          guestClaimedAt: expect.any(Date),
        },
      });
    });

    it("should return early with 0 claimed if no matching guest orders exist", async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValueOnce([]);

      const result = await GuestOrderService.claimGuestOrders("none@example.com", "profile-123");
      expect(result.success).toBe(true);
      expect(result.claimedCount).toBe(0);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });

  describe("CartMergeService", () => {
    it("should merge guest Redis cart keys into authenticated user cart session", async () => {
      const guestCartId = "guest-cart-123";
      const authUserId = "user-auth-123";

      // Mock redis guest cart hash
      vi.mocked(redis.hgetall).mockResolvedValueOnce({
        "variant-999": JSON.stringify({
          productId: "product-999",
          quantity: 2,
        }),
      });

      // Mock prisma product variant lookup
      vi.mocked(prisma.productVariant.findUnique).mockResolvedValueOnce({
        id: "variant-999",
        stockCount: 10,
        product: {
          price: 1500,
          isPublished: true,
          isDeleted: false,
          seller: {
            verification: {
              kycStatus: "approved",
              bankVerified: true,
            },
          },
        },
      } as any);

      const result = await mergeGuestCart(guestCartId, authUserId);
      expect(result.success).toBe(true);
      expect(result.mergedCount).toBe(1);
      expect(redis.set).toHaveBeenCalledWith(
        "reservation:user-auth-123:variant-999",
        expect.stringContaining('"quantity":2')
      );
    });
  });
});
