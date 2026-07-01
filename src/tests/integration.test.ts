import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerSeller } from "../actions/seller-register.action";
import { verifyBank } from "../actions/seller-bank-verify.action";
import { POST as signzyWebhookHandler } from "../app/api/webhooks/signzy/route";
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

// Mock prisma and auth and posthog
vi.mock("../lib/prisma", () => {
  const mockPrisma = {
    userProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    seller: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    sellerVerification: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

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

describe("Integration Flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("seller-register Server Action", () => {
    it("should reject unauthorized users", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const res = await registerSeller({
        businessName: "Test Seller",
        storeName: "Test Store",
        category: "Streetwear",
        city: "Chennai",
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("UNAUTHORIZED");
    });

    it("should reject a second registration if user already has a linked Seller", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-1", email: "test@example.com", emailVerified: true } as any,
        session: { id: "sess-1", expiresAt: new Date(), token: "t", createdAt: new Date(), updatedAt: new Date(), userId: "user-1" },
      });

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-1",
        userId: "user-1",
        role: "BUYER",
        createdAt: new Date(),
        seller: { id: "seller-1" }, // existing seller
      } as any);

      const res = await registerSeller({
        businessName: "Kavitha Ethnic",
        storeName: "Kavitha's Boutique Store",
        category: "Women's Ethnic Wear",
        city: "Chennai",
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("ALREADY_REGISTERED");
    });
  });

  describe("seller-bank-verify Server Action", () => {
    it("should succeed with a Razorpay sandbox account and persist only last 4 digits", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-1", email: "test@example.com", emailVerified: true } as any,
        session: { id: "sess-1", expiresAt: new Date(), token: "t", createdAt: new Date(), updatedAt: new Date(), userId: "user-1" },
      });

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-1",
        userId: "user-1",
        role: "SELLER",
        createdAt: new Date(),
        seller: {
          id: "seller-1",
          verification: { id: "verif-1", kycStatus: "auto_approved" },
        },
      } as any);

      vi.mocked(prisma.sellerVerification.findUnique).mockResolvedValue({
        id: "verif-1",
        sellerId: "seller-1",
        kycStatus: "auto_approved",
        bankVerified: false,
      } as any);

      const res = await verifyBank({
        accountNumber: "50100234567890",
        ifsc: "HDFC0001234",
      });

      expect(res.success).toBe(true);
      expect(res.data?.verified).toBe(true);
      
      // Verify only last 4 digits were persisted
      const updateCall = vi.mocked(prisma.sellerVerification.update);
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "verif-1" },
          data: expect.objectContaining({
            bankAccountLast4: "7890",
            bankVerified: true,
          }),
        })
      );
    });
  });

  describe("Signzy Webhook Route Handler", () => {
    const WEBHOOK_SECRET = process.env.SIGNZY_WEBHOOK_SECRET || "mock_signzy_webhook_secret";

    const createSignedRequest = (payload: any, sign = true) => {
      const bodyString = JSON.stringify(payload);
      let headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sign) {
        const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
        hmac.update(bodyString);
        headers["x-signzy-signature"] = hmac.digest("hex");
      }
      return new Request("http://localhost/api/webhooks/signzy", {
        method: "POST",
        headers,
        body: bodyString,
      });
    };

    it("should reject invalid webhook signature with 400", async () => {
      const req = createSignedRequest({ referenceId: "ref-1", faceMatchScore: 85 }, false);
      const res = await signzyWebhookHandler(req);
      expect(res.status).toBe(400);
      expect(prisma.sellerVerification.update).not.toHaveBeenCalled();
    });

    it("should auto-approve when faceMatchScore is >= 80", async () => {
      const payload = { referenceId: "ref-1", status: "completed", faceMatchScore: 85 };
      const req = createSignedRequest(payload);

      vi.mocked(prisma.sellerVerification.findFirst).mockResolvedValue({
        id: "verif-1",
        sellerId: "seller-1",
        kycStatus: "pending",
        seller: { userProfile: { userId: "user-1" } },
      } as any);

      const res = await signzyWebhookHandler(req);
      expect(res.status).toBe(200);

      const updateCall = vi.mocked(prisma.sellerVerification.update);
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "verif-1" },
          data: expect.objectContaining({
            kycStatus: "auto_approved",
            faceMatchScore: 85,
            rejectionReason: null,
          }),
        })
      );
    });

    it("should set to manual_review when faceMatchScore is 60–79", async () => {
      const payload = { referenceId: "ref-1", status: "completed", faceMatchScore: 70 };
      const req = createSignedRequest(payload);

      vi.mocked(prisma.sellerVerification.findFirst).mockResolvedValue({
        id: "verif-1",
        sellerId: "seller-1",
        kycStatus: "pending",
        seller: { userProfile: { userId: "user-1" } },
      } as any);

      const res = await signzyWebhookHandler(req);
      expect(res.status).toBe(200);

      const updateCall = vi.mocked(prisma.sellerVerification.update);
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "verif-1" },
          data: expect.objectContaining({
            kycStatus: "manual_review",
            faceMatchScore: 70,
          }),
        })
      );
    });

    it("should set to rejected when faceMatchScore is < 60", async () => {
      const payload = { referenceId: "ref-1", status: "completed", faceMatchScore: 45 };
      const req = createSignedRequest(payload);

      vi.mocked(prisma.sellerVerification.findFirst).mockResolvedValue({
        id: "verif-1",
        sellerId: "seller-1",
        kycStatus: "pending",
        seller: { userProfile: { userId: "user-1" } },
      } as any);

      const res = await signzyWebhookHandler(req);
      expect(res.status).toBe(200);

      const updateCall = vi.mocked(prisma.sellerVerification.update);
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "verif-1" },
          data: expect.objectContaining({
            kycStatus: "rejected",
            faceMatchScore: 45,
            rejectionReason: expect.any(String),
          }),
        })
      );
    });
  });
});
