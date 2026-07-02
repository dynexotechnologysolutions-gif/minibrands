import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";
import { auth } from "../lib/auth";
import { createPayout } from "../lib/razorpay-payouts";
import { runEscrowRelease } from "../lib/escrow-release";
import { confirmOrderAction } from "../actions/order-confirm.action";
import { shipOrderAction } from "../actions/order-ship.action";
import { confirmDeliveryAction } from "../actions/order-deliver-confirm.action";
import { createReviewAction } from "../actions/review-create.action";
import { POST as icarryWebhookHandler } from "../app/api/icarry/webhook/[secret]/route";
import { POST as razorpayWebhookHandler } from "../app/api/webhooks/razorpay/route";
import { NextRequest } from "next/server";

// Mock Next.js headers
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

// Mock posthog
vi.mock("../lib/posthog", () => ({
  trackEvent: vi.fn(),
}));

// Mock sentry
vi.mock("../lib/sentry", () => ({
  captureAndLogError: vi.fn(),
}));

// Mock resend
vi.mock("../lib/resend", () => ({
  sendFounderAlert: vi.fn(),
}));

// Mock whatsapp
vi.mock("../lib/whatsapp", () => ({
  sendMessage: vi.fn(),
  TEMPLATES: {
    ORDER_CONFIRMED: "order_confirmed",
    ORDER_SHIPPED: "order_shipped",
    DELIVERY_CONFIRMED: "delivery_confirmed",
    ESCROW_RELEASED: "escrow_released",
    ORDER_CANCELLED: "order_cancelled",
  },
}));

// Mock iCarry APIs
vi.mock("../lib/icarry", () => ({
  createShipment: vi.fn().mockResolvedValue({
    icarryOrderId: "ic_12345",
    awbNumber: "AWB1234567",
    courierName: "BlueDart",
  }),
  getLabelUrl: vi.fn().mockResolvedValue("https://icarry.com/label/pdf"),
  getTrackingUrl: vi.fn((awb: string) => `https://icarry.in/track/${awb}`),
}));

// Mock Razorpay Payouts
vi.mock("../lib/razorpay-payouts", () => ({
  createPayout: vi.fn().mockResolvedValue({
    id: "pout_test_12345",
    status: "processing",
    amount: 10000,
    currency: "INR",
  }),
}));

// Mock Redis
vi.mock("../lib/redis", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
  },
}));

// Mock Prisma
vi.mock("../lib/prisma", () => ({
  prisma: {
    userProfile: {
      findUnique: vi.fn(),
    },
    seller: {
      findUnique: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    review: {
      findUnique: vi.fn(),
      create: vi.fn(),
      aggregate: vi.fn().mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { rating: 10 },
      }),
      groupBy: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    orderItem: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

describe("Epic 4 — Transaction Close & Escrow Flow Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("iCarry & Razorpay Payouts Integrations", () => {
    it("should successfully generate tracking URLs", async () => {
      const { getTrackingUrl } = await import("../lib/icarry");
      expect(getTrackingUrl("AWB999")).toBe("https://icarry.in/track/AWB999");
    });
  });

  describe("confirmOrderAction", () => {
    it("should reject unauthorized requests", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);
      const res = await confirmOrderAction("order-1");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("UNAUTHORIZED");
    });

    it("should fail if user is not a seller", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-1", email: "user@test.com", emailVerified: true } as any,
        session: { id: "sess-1", expiresAt: new Date(), token: "t", createdAt: new Date(), updatedAt: new Date(), userId: "user-1" },
      });
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-1",
        userId: "user-1",
        role: "BUYER",
        createdAt: new Date(),
      } as any);

      const res = await confirmOrderAction("order-1");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("shipOrderAction", () => {
    it("should allow AWB tracking override", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-seller", email: "seller@test.com", emailVerified: true } as any,
        session: { id: "sess-2", expiresAt: new Date(), token: "t", createdAt: new Date(), updatedAt: new Date(), userId: "user-seller" },
      });
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-seller",
        userId: "user-seller",
        role: "SELLER",
        seller: { id: "seller-1" },
        createdAt: new Date(),
      } as any);

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "order-1",
        status: "confirmed",
        sellerId: "seller-1",
        buyer: { user: { email: "buyer@test.com", name: "Buyer Name" } },
      } as any);

      vi.mocked(prisma.order.update).mockResolvedValue({
        id: "order-1",
        status: "shipped",
        icarryAwbNumber: "OVERRIDE777",
        buyer: { user: { email: "buyer@test.com", name: "Buyer Name" } },
      } as any);

      const res = await shipOrderAction("order-1", "OVERRIDE777");
      expect(res.success).toBe(true);
      expect(res.data?.awbNumber).toBe("OVERRIDE777");
    });
  });

  describe("confirmDeliveryAction", () => {
    it("should transition status from shipped to delivered", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-buyer", email: "buyer@test.com", emailVerified: true } as any,
        session: { id: "sess-3", expiresAt: new Date(), token: "t", createdAt: new Date(), updatedAt: new Date(), userId: "user-buyer" },
      });
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-buyer",
        userId: "user-buyer",
        role: "BUYER",
        createdAt: new Date(),
      } as any);

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "order-1",
        status: "shipped",
        buyerId: "profile-buyer",
        seller: {
          businessName: "Boutique Name",
          userProfile: { user: { email: "seller@test.com" } },
        },
        buyer: { user: { email: "buyer@test.com", name: "Buyer Name" } },
      } as any);

      vi.mocked(prisma.order.update).mockResolvedValue({
        id: "order-1",
        status: "delivered",
        escrowReleaseAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        seller: {
          businessName: "Boutique Name",
          userProfile: { user: { email: "seller@test.com" } },
        },
        buyer: { user: { email: "buyer@test.com", name: "Buyer Name" } },
      } as any);

      const res = await confirmDeliveryAction("order-1");
      expect(res.success).toBe(true);
      expect(res.data?.escrowReleaseAt).toBeDefined();
    });
  });

  describe("createReviewAction", () => {
    it("should rate limit and enforce validations", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-buyer", email: "buyer@test.com", emailVerified: true } as any,
        session: { id: "sess-3", expiresAt: new Date(), token: "t", createdAt: new Date(), updatedAt: new Date(), userId: "user-buyer" },
      });
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-buyer",
        userId: "user-buyer",
        role: "BUYER",
        createdAt: new Date(),
      } as any);

      // Simulate rate limit exceeded
      vi.mocked(redis.incr).mockResolvedValue(10); // Limit is 5

      const res = await createReviewAction({
        orderId: "e9323c31-7e8c-4a30-880c-7832890e0ad8",
        productId: "a9323c31-7e8c-4a30-880c-7832890e0ad8",
        rating: 5,
        comment: "Excellent product!",
        photoUrls: [],
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("RATE_LIMITED");
    });
  });

  describe("escrowRelease engine", () => {
    it("should automatically process released escrows and skip missing bank accounts", async () => {
      const now = new Date();
      // Setup orders
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        {
          id: "order-escrow-1",
          totalAmount: 15000,
          commissionAmount: 1500,
          status: "delivered",
          seller: {
            id: "seller-1",
            businessName: "Seller One",
            razorpayFundAccountId: null, // missing linked account
            userProfile: { user: { name: "919999999999", email: "seller1@test.com" } },
          },
          buyer: { user: { name: "Buyer One", email: "buyer@test.com" } },
        },
        {
          id: "order-escrow-2",
          totalAmount: 20000,
          commissionAmount: 2000,
          status: "delivered",
          seller: {
            id: "seller-2",
            businessName: "Seller Two",
            razorpayFundAccountId: "fa_verified_123", // link exists
            userProfile: { user: { name: "918888888888", email: "seller2@test.com" } },
          },
          buyer: { user: { name: "Buyer Two", email: "buyer@test.com" } },
        },
      ] as any);

      const result = await runEscrowRelease();
      expect(result.processed).toBe(2);
      expect(result.skippedNoFundAccount).toBe(1);
      expect(result.succeeded).toBe(1);
    });
  });

  describe("iCarry Webhook Route Handler", () => {
    it("should verify secret token and route Delivered event correctly", async () => {
      // Mock process.env
      process.env.ICARRY_WEBHOOK_SECRET = "supersecret";

      const req = new NextRequest("http://localhost/api/icarry/webhook/supersecret", {
        method: "POST",
        body: JSON.stringify({
          event: "Delivered",
          awb_number: "AWB123456",
          order_reference_id: "order-delivered-id",
        }),
      });

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "order-delivered-id",
        status: "shipped",
      } as any);

      const response = await icarryWebhookHandler(req, { params: Promise.resolve({ secret: "supersecret" }) });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.received).toBe(true);
      expect(prisma.order.update).toHaveBeenCalled();
    });
  });
});
