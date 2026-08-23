import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST as createOrderHandler } from "../app/api/payments/create-order/route";
import { POST as verifyHandler } from "../app/api/payments/verify/route";
import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";
import crypto from "crypto";

// ── In-memory Redis mock (hoisted so it's available in vi.mock factory) ──
const { redis: mockRedis } = vi.hoisted(() => {
  const store: Record<string, string | number> = {};

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
      const existed = store[key] !== undefined;
      delete store[key];
      return existed ? 1 : 0;
    }),
    exists: vi.fn(async (key: string) => {
      return store[key] !== undefined ? 1 : 0;
    }),
    keys: vi.fn(async (pattern: string) => {
      const prefix = pattern.replace("*", "");
      return Object.keys(store).filter((k) => k.startsWith(prefix));
    }),
    sadd: vi.fn(async () => 1),
    srem: vi.fn(async () => 1),
    smembers: vi.fn(async () => []),
    incr: vi.fn(async (key: string) => {
      const val = Number(store[key] || 0);
      store[key] = val + 1;
      return val + 1;
    }),
    ttl: vi.fn(async () => -1),
    expire: vi.fn(async () => 1),
    eval: vi.fn(async () => "OK"),
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

// Mock prisma client
vi.mock("../lib/prisma", () => {
  const mockPrisma = {
    userProfile: {
      findUnique: vi.fn(),
    },
    address: {
      findUnique: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    productVariant: {
      update: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback: any) => callback(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

// Mock posthog
vi.mock("../lib/posthog", () => ({
  trackEvent: vi.fn(),
}));

// Mock razorpay
vi.mock("../lib/razorpay", () => ({
  createRazorpayOrder: vi.fn(async (amount, receiptId) => ({
    id: "order_mock_123",
    amount,
    currency: "INR",
  })),
  verifyWebhookSignature: vi.fn(() => true),
}));

// Mock redis module
vi.mock("../lib/redis", () => ({
  redis: mockRedis,
  tryReserveStock: vi.fn(async () => ({ success: true })),
  checkRateLimit: vi.fn(async () => true),
  deleteMatchingReservation: vi.fn(async () => {}),
  getUserReservations: vi.fn(async () => []),
  addReservationToUserIndex: vi.fn(async () => {}),
  removeReservationFromUserIndex: vi.fn(async () => {}),
  getReservedStock: vi.fn(async () => 0),
}));

describe("Payments API Routes Integration Tests", () => {
  const testKeys: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (testKeys.length > 0) {
      const pipeline = mockRedis.pipeline();
      testKeys.forEach((k) => pipeline.del(k));
      await pipeline.exec();
      testKeys.length = 0;
    }
  });

  describe("POST /api/payments/create-order", () => {
    it("should reject unauthorized users with 401", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const req = new Request("http://localhost/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({
          addressId: "addr-123",
          sessionId: "session-123",
        }),
      });

      const res = await createOrderHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should reject requests without addressId or order source with 400", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-123", email: "test@example.com" },
      } as any);

      const req1 = new Request("http://localhost/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({
          sessionId: "session-123",
        }),
      });

      const res1 = await createOrderHandler(req1);
      expect(res1.status).toBe(400);
      const data1 = await res1.json();
      expect(data1.error).toBe("Delivery address is required");
    });

    it("should successfully generate a Razorpay order and cache details", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-123", email: "test@example.com" },
      } as any);

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-123",
        userId: "user-123",
      } as any);

      vi.mocked(prisma.address.findUnique).mockResolvedValue({
        id: "addr-123",
        userProfileId: "profile-123",
      } as any);

      const mockSessionPayload = {
        mode: "CART_CHECKOUT",
        products: [
          {
            productId: "prod-123",
            variantId: "variant-123",
            quantity: 2,
            price: 5000,
            size: "M",
            image: "img.jpg",
            sellerName: "Test Seller",
            sellerId: "seller-123",
            reservationId: "res-123",
          },
        ],
        createdAt: new Date().toISOString(),
      };

      const sessionKey = "checkout-session:session-123";
      await mockRedis.set(sessionKey, JSON.stringify(mockSessionPayload));
      testKeys.push(sessionKey);
      testKeys.push("pending-order:order_mock_123");

      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "prod-123",
        name: "Premium Shirt",
        price: 5000,
        isPublished: true,
        isDeleted: false,
        sellerId: "seller-123",
        seller: {
          businessName: "Test Seller",
          verification: {
            kycStatus: "auto_approved",
            bankVerified: true,
          },
        },
        variants: [
          { id: "variant-123", size: "M", stockCount: 10 },
        ],
      } as any);

      const req = new Request("http://localhost/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({
          addressId: "addr-123",
          sessionId: "session-123",
        }),
      });

      const res = await createOrderHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.razorpayOrderId).toBeDefined();
      expect(data.amount).toBe(10000);
      expect(data.keyId).toBeDefined();
    }, 20000);
  });

  describe("POST /api/payments/verify", () => {
    it("should successfully verify payment signature, create database records and clear cart items", async () => {
      const mockOrderId = "order_mock_123";
      const mockPaymentId = "pay_mock_123";
      const mockSignature = "mock_signature";

      const mockPendingPayload = {
        userId: "profile-123",
        addressId: "addr-123",
        sessionId: "session-123",
        products: [
          {
            productId: "prod-123",
            variantId: "variant-123",
            quantity: 2,
            price: 5000,
            reservationId: "res-123",
          },
        ],
        subtotal: 10000,
        shipping: 0,
        tax: 0,
        totalAmount: 10000,
        sellerId: "seller-123",
      };

      const pendingOrderKey = `pending-order:${mockOrderId}`;
      await mockRedis.set(pendingOrderKey, JSON.stringify(mockPendingPayload));
      testKeys.push(pendingOrderKey);
      testKeys.push("checkout-session:session-123");
      testKeys.push("reservation:res-123");

      await mockRedis.set("checkout-session:session-123", "dummy");
      await mockRedis.set("reservation:res-123", "dummy");

      vi.mocked(prisma.order.create).mockResolvedValue({
        id: "db-order-123",
      } as any);

      const req = new Request("http://localhost/api/payments/verify", {
        method: "POST",
        body: JSON.stringify({
          razorpay_payment_id: mockPaymentId,
          razorpay_order_id: mockOrderId,
          razorpay_signature: mockSignature,
        }),
      });

      const res = await verifyHandler(req);
      if (res.status !== 200) {
        console.log("VERIFY_HANDLER_ERROR_BODY:", await res.json());
      }
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.orderId).toBe("db-order-123");

      expect(prisma.order.create).toHaveBeenCalled();
      expect(prisma.orderItem.create).toHaveBeenCalled();
      expect(prisma.payment.create).toHaveBeenCalled();
      expect(prisma.productVariant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "variant-123" },
          data: { stockCount: { decrement: 2 } },
        })
      );

      const hasSession = await mockRedis.exists("checkout-session:session-123");
      const hasReservation = await mockRedis.exists("reservation:res-123");
      const hasPending = await mockRedis.exists(pendingOrderKey);

      expect(hasSession).toBe(0);
      expect(hasReservation).toBe(0);
      expect(hasPending).toBe(0);
    }, 20000);
  });
});
