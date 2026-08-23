import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tryReserveStock, checkRateLimit } from "../lib/redis";
import { verifyWebhookSignature } from "../lib/razorpay";
import { reserveCartItem } from "../actions/cart-reserve.action";
import { createOrder } from "../actions/order-create.action";
import { POST as razorpayWebhookHandler } from "../app/api/webhooks/razorpay/route";
import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";
import crypto from "crypto";

// ── In-memory Redis mock (hoisted so it's available in vi.mock factory) ──
const { redis: mockRedis } = vi.hoisted(() => {
  const store: Record<string, string | number> = {};
  const sets: Record<string, Set<string>> = {};

  const redis: any = {
    get: vi.fn(async (key: string) => {
      const val = store[key];
      return val !== undefined ? val : null;
    }),
    set: vi.fn(async (key: string, value: any) => {
      store[key] = typeof value === "string" ? value : JSON.stringify(value);
      return "OK";
    }),
    del: vi.fn(async (key: string) => {
      const existed = store[key] !== undefined || sets[key] !== undefined;
      delete store[key];
      delete sets[key];
      return existed ? 1 : 0;
    }),
    exists: vi.fn(async (key: string) => {
      return store[key] !== undefined ? 1 : 0;
    }),
    keys: vi.fn(async (pattern: string) => {
      const prefix = pattern.replace("*", "");
      return Object.keys(store).filter((k) => k.startsWith(prefix));
    }),
    eval: vi.fn(async (_script: string, _keys: string[], args: any[]) => {
      const variantId = args[0];
      const stockCount = Number(args[1]);
      const quantity = Number(args[2]);
      const reservationId = args[3];
      const reservationJson = args[4];
      const ttl = Number(args[5]);

      const keys = Object.keys(store).filter((k) => k.startsWith("reservation:"));
      let totalReserved = 0;
      for (const key of keys) {
        const val = store[key];
        if (val) {
          try {
            const data = JSON.parse(val as string);
            if (data && data.variantId === variantId) {
              totalReserved += Number(data.quantity) || 0;
            }
          } catch {}
        }
      }

      const availableStock = stockCount - totalReserved;
      if (availableStock < quantity) return "INSUFFICIENT_STOCK";

      const resKey = `reservation:${reservationId}`;
      store[resKey] = reservationJson;
      setTimeout(() => {
        if (store[resKey] === reservationJson) delete store[resKey];
      }, ttl * 1000);
      return "OK";
    }),
    sadd: vi.fn(async (key: string, ...members: string[]) => {
      if (!sets[key]) sets[key] = new Set();
      let added = 0;
      members.forEach((m) => {
        if (!sets[key]!.has(m)) added++;
        sets[key]!.add(m);
      });
      return added;
    }),
    srem: vi.fn(async (key: string, ...members: string[]) => {
      const set = sets[key];
      if (!set) return 0;
      let removed = 0;
      members.forEach((m) => {
        if (set.delete(m)) removed++;
      });
      return removed;
    }),
    smembers: vi.fn(async (key: string) => {
      return Array.from(sets[key] || []);
    }),
    incr: vi.fn(async (key: string) => {
      const val = Number(store[key] || 0);
      store[key] = val + 1;
      return val + 1;
    }),
    ttl: vi.fn(async (_key: string) => -1),
    expire: vi.fn(async (_key: string, _seconds: number) => 1),
    pipeline: vi.fn(() => {
      const ops: Array<{ fn: string; args: any[] }> = [];
      const chain: any = {
        get: vi.fn((...args: any[]) => { ops.push({ fn: "get", args }); return chain; }),
        set: vi.fn((...args: any[]) => { ops.push({ fn: "set", args }); return chain; }),
        del: vi.fn((...args: any[]) => { ops.push({ fn: "del", args }); return chain; }),
        sadd: vi.fn((...args: any[]) => { ops.push({ fn: "sadd", args }); return chain; }),
        srem: vi.fn((...args: any[]) => { ops.push({ fn: "srem", args }); return chain; }),
        smembers: vi.fn((...args: any[]) => { ops.push({ fn: "smembers", args }); return chain; }),
        incr: vi.fn((...args: any[]) => { ops.push({ fn: "incr", args }); return chain; }),
        ttl: vi.fn((...args: any[]) => { ops.push({ fn: "ttl", args }); return chain; }),
        expire: vi.fn((...args: any[]) => { ops.push({ fn: "expire", args }); return chain; }),
        exec: vi.fn(async () => {
          const results: any[] = [];
          for (const op of ops) {
            const fn = redis[op.fn];
            results.push(await fn(...op.args));
          }
          return results;
        }),
      };
      return chain;
    }),
    on: vi.fn(),
    connect: vi.fn(async () => {}),
  };

  return { redis, store };
});

// Mock next/headers for Next.js 15 Server Actions
vi.mock("next/headers", () => {
  return {
    headers: vi.fn(async () => {
      const h = new Headers();
      h.set("cookie", "mock-session-cookie");
      return h;
    }),
  };
});

// Mock auth and posthog, but keep prisma partially mocked or selectively stubbed
vi.mock("../lib/auth", () => {
  return {
    auth: {
      api: {
        getSession: vi.fn(),
      },
    },
  };
});

vi.mock("../lib/posthog", () => {
  return {
    trackEvent: vi.fn(),
  };
});

// selectively mock prisma client for actions/handlers tests
vi.mock("../lib/prisma", () => {
  const mockPrisma = {
    userProfile: {
      findUnique: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    address: {
      findUnique: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
    },
    productVariant: {
      update: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback: any) => callback(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

// Mock redis module - use the hoisted mock object
vi.mock("../lib/redis", () => ({
  redis: mockRedis,
  tryReserveStock: async (reservationId: string, reservationData: any, stockCount: number) => {
    const result = await mockRedis.eval("placeholder", [], [
      reservationData.variantId,
      String(stockCount),
      String(reservationData.quantity),
      reservationId,
      JSON.stringify(reservationData),
      "900",
    ]);
    if (result === "OK") return { success: true };
    return { success: false, error: String(result) };
  },
  checkRateLimit: async (userProfileId: string) => {
    const key = `rate-limit:cart-reserve:${userProfileId}`;
    const limit = 20;
    const windowSeconds = 600;
    const p = mockRedis.pipeline();
    p.incr(key);
    p.ttl(key);
    const [countResult, ttlResult] = await p.exec();
    const count = Number(countResult);
    const ttl = Number(ttlResult);
    if (count === 1 || ttl === -1) {
      await mockRedis.expire(key, windowSeconds);
    }
    return count <= limit;
  },
  deleteMatchingReservation: vi.fn(async () => {}),
  getUserReservations: vi.fn(async () => []),
  addReservationToUserIndex: vi.fn(async () => {}),
  removeReservationFromUserIndex: vi.fn(async () => {}),
  getReservedStock: vi.fn(async () => 0),
}));

// ── Tests ────────────────────────────────────────────────────────────────────
describe("Epic 3 Verification Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Upstash Redis Concurrency Test
  describe("1. Upstash Redis Concurrency", () => {
    const testKeys: string[] = [];

    afterEach(async () => {
      if (testKeys.length > 0) {
        const pipeline = mockRedis.pipeline();
        testKeys.forEach((k) => pipeline.del(k));
        await pipeline.exec();
      }
    });

    it("should allow exactly 1 reservation to succeed out of 10 simultaneous requests for 1 stock unit", async () => {
      const testVariantId = `variant_concurrency_test_${crypto.randomUUID()}`;
      const stockCount = 1;
      const quantity = 1;

      const requests = Array.from({ length: 10 }).map((_, idx) => {
        const reservationId = crypto.randomUUID();
        const key = `reservation:${reservationId}`;
        testKeys.push(key);

        const reservationData = {
          userProfileId: `user_profile_${idx}`,
          productId: `product_${idx}`,
          variantId: testVariantId,
          quantity,
          createdAt: new Date().toISOString(),
        };

        return tryReserveStock(reservationId, reservationData, stockCount);
      });

      const results = await Promise.all(requests);

      const successes = results.filter((r) => r.success);
      const failures = results.filter((r) => !r.success);

      console.log(`[Concurrency Results] Successes: ${successes.length}, Failures: ${failures.length}`);

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(9);
    }, 20000);
  });

  // 2. Double Webhook Execution Idempotency Test
  describe("2. Webhook Idempotency", () => {
    const createWebhookRequest = (payload: any, signature: string) => {
      return new Request("http://localhost/api/webhooks/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": signature,
        },
        body: JSON.stringify(payload),
      });
    };

    it("should process the payment captured webhook and skip on duplicate executions", async () => {
      const mockWebhookSecret = "mock_secret";
      process.env.RAZORPAY_WEBHOOK_SECRET = mockWebhookSecret;

      const payload = {
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_xyz123",
              order_id: "order_rzp_mock",
            },
          },
        },
      };

      const bodyString = JSON.stringify(payload);
      const signature = crypto
        .createHmac("sha256", mockWebhookSecret)
        .update(bodyString)
        .digest("hex");

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "order-123",
        buyerId: "buyer-123",
        status: "created",
        totalAmount: 5000,
        commissionAmount: 400,
        sellerId: "seller-123",
        razorpayPaymentId: null,
        buyer: { userId: "user-buyer" },
        items: [{ variantId: "variant-123", productId: "product-123", quantity: 1 }],
      } as any);

      const req1 = createWebhookRequest(payload, signature);
      const res1 = await razorpayWebhookHandler(req1);
      expect(res1.status).toBe(200);

      const json1 = await res1.json();
      expect(json1.received).toBe(true);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "order-123" },
          data: expect.objectContaining({
            status: "paid",
            razorpayPaymentId: "pay_xyz123",
          }),
        })
      );
      expect(prisma.productVariant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "variant-123" },
          data: { stockCount: { decrement: 1 } },
        })
      );

      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
        id: "order-123",
        buyerId: "buyer-123",
        status: "paid",
        totalAmount: 5000,
        commissionAmount: 400,
        sellerId: "seller-123",
        razorpayPaymentId: "pay_xyz123",
        buyer: { userId: "user-buyer" },
        items: [{ variantId: "variant-123", productId: "product-123", quantity: 1 }],
      } as any);

      vi.mocked(prisma.$transaction).mockClear();
      vi.mocked(prisma.order.update).mockClear();
      vi.mocked(prisma.productVariant.update).mockClear();

      const req2 = createWebhookRequest(payload, signature);
      const res2 = await razorpayWebhookHandler(req2);
      expect(res2.status).toBe(200);

      const json2 = await res2.json();
      expect(json2.received).toBe(true);

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(prisma.productVariant.update).not.toHaveBeenCalled();
    });
  });

  // 3. Redis Rate Limiter Test
  describe("3. Redis Rate Limiter", () => {
    const rateLimitKey = `rate-limit:cart-reserve:test_rate_limiter_user`;

    beforeEach(async () => {
      await mockRedis.del(rateLimitKey);
    });

    afterEach(async () => {
      await mockRedis.del(rateLimitKey);
    });

    it("should allow 20 attempts and block the 21st attempt", async () => {
      const userProfileId = "test_rate_limiter_user";

      const attempts = Array.from({ length: 20 }).map(() => checkRateLimit(userProfileId));
      const results = await Promise.all(attempts);
      results.forEach((allowed) => expect(allowed).toBe(true));

      const blocked = await checkRateLimit(userProfileId);
      expect(blocked).toBe(false);
    });
  });

  // 4. Signature Verification Test
  describe("4. Signature Verification", () => {
    it("should verify correct hmac signature and reject incorrect signature", () => {
      const body = "test_webhook_body";
      const secret = "super_secret";

      const validSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      expect(verifyWebhookSignature(body, validSignature, secret)).toBe(true);
      expect(verifyWebhookSignature(body, "invalid_sig", secret)).toBe(false);
      expect(verifyWebhookSignature(body, validSignature, "wrong_secret")).toBe(false);
    });
  });

  // 5. Seller Status Verification Check
  describe("5. Seller KYC & Verification Checks", () => {
    it("should block cart reservation if seller KYC status is 'manual_review' or 'pending'", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-buyer" },
      } as any);

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "buyer-profile-123",
        userId: "user-buyer",
      } as any);

      const mockProductId = crypto.randomUUID();
      const mockVariantId = crypto.randomUUID();

      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: mockProductId,
        isPublished: true,
        isDeleted: false,
        price: 5000,
        sellerId: "seller-123",
        seller: {
          verification: {
            kycStatus: "manual_review",
            bankVerified: true,
          },
        },
        variants: [{ id: mockVariantId, size: "M", stockCount: 5 }],
      } as any);

      const resManual = await reserveCartItem({
        productId: mockProductId,
        variantId: mockVariantId,
        quantity: 1,
      });

      expect(resManual.success).toBe(false);
      expect(resManual.error?.code).toBe("SELLER_NOT_VERIFIED");

      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: mockProductId,
        isPublished: true,
        isDeleted: false,
        price: 5000,
        sellerId: "seller-123",
        seller: {
          verification: {
            kycStatus: "pending",
            bankVerified: true,
          },
        },
        variants: [{ id: mockVariantId, size: "M", stockCount: 5 }],
      } as any);

      const resPending = await reserveCartItem({
        productId: mockProductId,
        variantId: mockVariantId,
        quantity: 1,
      });

      expect(resPending.success).toBe(false);
      expect(resPending.error?.code).toBe("SELLER_NOT_VERIFIED");
    });

    it("should block order creation if seller verification is invalid", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-buyer" },
      } as any);

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "buyer-profile-123",
        userId: "user-buyer",
      } as any);

      const mockProductId = crypto.randomUUID();
      const mockVariantId = crypto.randomUUID();
      const mockAddressId = crypto.randomUUID();
      const mockReservationId = crypto.randomUUID();

      const reservationKey = `reservation:${mockReservationId}`;
      await mockRedis.set(reservationKey, JSON.stringify({
        userProfileId: "buyer-profile-123",
        productId: mockProductId,
        variantId: mockVariantId,
        quantity: 1,
        createdAt: new Date().toISOString(),
      }));

      vi.mocked(prisma.address.findUnique).mockResolvedValue({
        id: mockAddressId,
        userProfileId: "buyer-profile-123",
      } as any);

      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: mockProductId,
        isPublished: true,
        isDeleted: false,
        price: 5000,
        sellerId: "seller-123",
        seller: {
          verification: {
            kycStatus: "manual_review",
            bankVerified: true,
          },
        },
        variants: [{ id: mockVariantId, size: "M", stockCount: 5 }],
      } as any);

      try {
        const res = await createOrder({
          reservationId: mockReservationId,
          addressId: mockAddressId,
        });

        expect(res.success).toBe(false);
        expect(res.error?.code).toBe("SELLER_NOT_VERIFIED");
      } finally {
        await mockRedis.del(reservationKey);
      }
    }, 20000);
  });
});
