import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tryReserveStock, checkRateLimit, redis } from "../lib/redis";
import { verifyWebhookSignature } from "../lib/razorpay";
import { reserveCartItem } from "../actions/cart-reserve.action";
import { createOrder } from "../actions/order-create.action";
import { POST as razorpayWebhookHandler } from "../app/api/webhooks/razorpay/route";
import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";
import crypto from "crypto";

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
      update: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
    },
    productVariant: {
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

describe("Epic 3 Verification Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Upstash Redis Concurrency Test
  describe("1. Upstash Redis Concurrency", () => {
    const testKeys: string[] = [];

    afterEach(async () => {
      // Clean up keys created during the test
      if (testKeys.length > 0) {
        const pipeline = redis.pipeline();
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
      expect(failures[0].error).toBe("INSUFFICIENT_STOCK");
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

      // Setup Order mocks for first (created) run
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
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

      // Run webhook first time
      const req1 = createWebhookRequest(payload, signature);
      const res1 = await razorpayWebhookHandler(req1);
      expect(res1.status).toBe(200);

      const json1 = await res1.json();
      expect(json1.received).toBe(true);

      // Verify transaction triggered update and stock decrement
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

      // Setup mock for second (already paid) run
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
        id: "order-123",
        buyerId: "buyer-123",
        status: "paid", // Already marked paid
        totalAmount: 5000,
        commissionAmount: 400,
        sellerId: "seller-123",
        razorpayPaymentId: "pay_xyz123",
        buyer: { userId: "user-buyer" },
        items: [{ variantId: "variant-123", productId: "product-123", quantity: 1 }],
      } as any);

      // Reset transaction mocks to assert no second execution
      vi.mocked(prisma.$transaction).mockClear();
      vi.mocked(prisma.order.update).mockClear();
      vi.mocked(prisma.productVariant.update).mockClear();

      // Run webhook second time (duplicate payload)
      const req2 = createWebhookRequest(payload, signature);
      const res2 = await razorpayWebhookHandler(req2);
      expect(res2.status).toBe(200);

      const json2 = await res2.json();
      expect(json2.received).toBe(true);

      // Verify transaction and updates were skipped on second run
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(prisma.productVariant.update).not.toHaveBeenCalled();
    });
  });

  // 3. Redis Rate Limiter Test
  describe("3. Redis Rate Limiter", () => {
    const rateLimitKey = `rate-limit:cart-reserve:test_rate_limiter_user`;

    beforeEach(async () => {
      await redis.del(rateLimitKey);
    });

    afterEach(async () => {
      await redis.del(rateLimitKey);
    });

    it("should allow 20 attempts and block the 21st attempt", async () => {
      const userProfileId = "test_rate_limiter_user";

      // Make 20 valid attempts in parallel to avoid network timeout
      const attempts = Array.from({ length: 20 }).map(() => checkRateLimit(userProfileId));
      const results = await Promise.all(attempts);
      results.forEach((allowed) => expect(allowed).toBe(true));

      // 21st attempt must be blocked
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

      // 1. Test manual_review kycStatus
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: mockProductId,
        isPublished: true,
        isDeleted: false,
        price: 5000,
        sellerId: "seller-123",
        seller: {
          verification: {
            kycStatus: "manual_review", // not auto_approved/approved
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

      // 2. Test pending kycStatus
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

      // Write real Redis reservation key to prevent ESM mock spying issues
      const reservationKey = `reservation:${mockReservationId}`;
      await redis.set(reservationKey, JSON.stringify({
        userProfileId: "buyer-profile-123",
        productId: mockProductId,
        variantId: mockVariantId,
        quantity: 1,
        createdAt: new Date().toISOString(),
      }), { ex: 60 });

      // Mock address
      vi.mocked(prisma.address.findUnique).mockResolvedValue({
        id: mockAddressId,
        userProfileId: "buyer-profile-123",
      } as any);

      // Mock product with seller in manual_review
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
        // Clean up real Redis reservation
        await redis.del(reservationKey);
      }
    }, 20000);
  });
});
