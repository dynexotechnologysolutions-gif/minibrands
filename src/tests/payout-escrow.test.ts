import { describe, it, expect, vi, beforeEach } from "vitest";
import { PayoutStatus, ReturnRequestStatus } from "@prisma/client";
import { normalizeRazorpayXStatus, validatePayoutTransition } from "../lib/payout-state-machine";
import { checkPayoutEligibility } from "../lib/payout-eligibility";
import { runEscrowRelease } from "../lib/escrow-release";
import { handlePayoutWebhook } from "../lib/payout-webhook";
import { validateBankAccount } from "../lib/razorpay";
import { encryptText, decryptText, maskBankAccountNumber } from "../lib/encryption";
import { prisma } from "../lib/prisma";

// Mock dependencies
vi.mock("../lib/posthog", () => ({ trackEvent: vi.fn() }));
vi.mock("../lib/sentry", () => ({ captureAndLogError: vi.fn() }));
vi.mock("../lib/email.service", () => ({
  EmailService: { sendAlert: vi.fn().mockResolvedValue(true) },
}));
vi.mock("../lib/whatsapp", () => ({
  sendMessage: vi.fn().mockResolvedValue(true),
  TEMPLATES: { ESCROW_RELEASED: "escrow_released" },
}));
vi.mock("../lib/razorpay-payouts", () => ({
  createPayout: vi.fn().mockImplementation(async (params) => {
    if (params.fundAccountId === "fa_fail_test") {
      throw new Error("RazorpayX simulated payout API failure");
    }
    return {
      id: `pout_test_${Math.random().toString(36).substring(2, 8)}`,
      status: params.fundAccountId === "fa_processing_test" ? "processing" : "processed",
      amount: params.amount,
      currency: "INR",
      utr: "UTR123456789",
    };
  }),
}));

vi.mock("../lib/prisma", () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    seller: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    payout: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

describe("MiniBrands Payout & Escrow System Unit & Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Bank Detail Encryption & Masking", () => {
    it("should encrypt and decrypt sensitive bank details cleanly", () => {
      const plaintextAccount = "12345678901234";
      const encrypted = encryptText(plaintextAccount);
      expect(encrypted).toContain("enc_gcm_v1:");
      const decrypted = decryptText(encrypted);
      expect(decrypted).toBe(plaintextAccount);
    });

    it("should handle legacy unencrypted text gracefully", () => {
      const legacyAccount = "9876543210";
      expect(decryptText(legacyAccount)).toBe("9876543210");
    });

    it("should mask account numbers correctly", () => {
      expect(maskBankAccountNumber("12345678901234")).toBe("XXXX XXXX 1234");
      expect(maskBankAccountNumber(null)).toBe("N/A");
    });
  });

  describe("2. Razorpay Bank Validation", () => {
    it("should generate fundAccountId in test/mock mode", async () => {
      const res = await validateBankAccount("1234567890", "HDFC0001234");
      expect(res.success).toBe(true);
      expect(res.fundAccountId).toBeDefined();
      expect(res.fundAccountId).toMatch(/^fa_mock_/);
    });

    it("should return failure for simulated invalid account number", async () => {
      const res = await validateBankAccount("0000000000", "HDFC0001234");
      expect(res.success).toBe(false);
      expect(res.message).toBeDefined();
    });
  });

  describe("3. Payout State Machine & Status Normalizer", () => {
    it("should normalize RazorpayX raw statuses correctly", () => {
      expect(normalizeRazorpayXStatus("processed")).toBe(PayoutStatus.SUCCESS);
      expect(normalizeRazorpayXStatus("processing")).toBe(PayoutStatus.PROCESSING);
      expect(normalizeRazorpayXStatus("queued")).toBe(PayoutStatus.PROCESSING);
      expect(normalizeRazorpayXStatus("rejected")).toBe(PayoutStatus.FAILED);
      expect(normalizeRazorpayXStatus("reversed")).toBe(PayoutStatus.REVERSED);
    });

    it("should validate allowed payout state transitions", () => {
      expect(validatePayoutTransition(PayoutStatus.PENDING, PayoutStatus.PROCESSING)).toBe(true);
      expect(validatePayoutTransition(PayoutStatus.PROCESSING, PayoutStatus.SUCCESS)).toBe(true);
      expect(validatePayoutTransition(PayoutStatus.FAILED, PayoutStatus.PROCESSING)).toBe(true); // retry
    });

    it("should reject illegal payout state transitions", () => {
      expect(() => validatePayoutTransition(PayoutStatus.SUCCESS, PayoutStatus.PENDING)).toThrow();
    });
  });

  describe("4. Payout Eligibility Validator", () => {
    it("should reject orders that are not delivered", async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "ord-1",
        status: "shipped",
        paymentStatus: "paid",
      } as any);

      const res = await checkPayoutEligibility("ord-1");
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("shipped");
    });

    it("should reject orders whose return window is still active", async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "ord-2",
        status: "delivered",
        paymentStatus: "paid",
        deliveredAt: new Date(),
        escrowReleaseAt: futureDate,
      } as any);

      const res = await checkPayoutEligibility("ord-2");
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("Return period is active");
    });

    it("should reject orders with an active return request", async () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "ord-3",
        status: "delivered",
        paymentStatus: "paid",
        deliveredAt: pastDate,
        escrowReleaseAt: pastDate,
        seller: { verification: { bankVerified: true }, razorpayFundAccountId: "fa_123" },
        returnRequest: { status: ReturnRequestStatus.RETURN_REQUESTED },
      } as any);

      const res = await checkPayoutEligibility("ord-3");
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("active return request");
    });

    it("should approve eligible orders", async () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "ord-4",
        status: "delivered",
        paymentStatus: "paid",
        totalAmount: 10000,
        commissionAmount: 800,
        deliveredAt: pastDate,
        escrowReleaseAt: pastDate,
        seller: { businessName: "Test Store", verification: { bankVerified: true }, razorpayFundAccountId: "fa_valid_999" },
        returnRequest: null,
        payout: null,
      } as any);

      const res = await checkPayoutEligibility("ord-4");
      expect(res.eligible).toBe(true);
      expect(res.sellerAmount).toBe(9200);
      expect(res.fundAccountId).toBe("fa_valid_999");
    });
  });

  describe("5. Escrow Release Engine Integration", () => {
    it("should process eligible orders and create payout records with idempotency keys", async () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const mockOrder = {
        id: "order-escrow-100",
        totalAmount: 20000,
        commissionAmount: 1600,
        status: "delivered",
        paymentStatus: "paid",
        deliveredAt: pastDate,
        escrowReleaseAt: pastDate,
        sellerId: "seller-100",
        seller: {
          id: "seller-100",
          businessName: "Boutique 100",
          razorpayFundAccountId: "fa_valid_100",
          verification: { bankVerified: true },
          userProfile: { user: { email: "seller100@test.com" } },
        },
        returnRequest: null,
        payout: null,
      };

      vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder] as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.payout.create).mockResolvedValue({
        id: "payout-db-100",
        orderId: mockOrder.id,
        status: PayoutStatus.PROCESSING,
      } as any);

      const res = await runEscrowRelease();
      expect(res.processed).toBe(1);
      expect(res.succeeded).toBe(1);
      expect(prisma.payout.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: mockOrder.id,
            idempotencyKey: `payout_${mockOrder.id}`,
          }),
        })
      );
    });
  });

  describe("6. RazorpayX Webhook Reconciliation", () => {
    it("should reconcile payout SUCCESS webhook event and complete order", async () => {
      vi.mocked(prisma.payout.findFirst).mockResolvedValue({
        id: "payout-ledger-1",
        orderId: "order-webhook-1",
        status: PayoutStatus.PROCESSING,
        seller: { businessName: "Store 1" },
      } as any);

      await handlePayoutWebhook("payout.processed", {
        entity: {
          id: "pout_rzp_999",
          reference_id: "payout_order-webhook-1",
          status: "processed",
          utr: "UTR999888777",
        },
      });

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-webhook-1" },
        data: expect.objectContaining({
          status: "completed",
          razorpayPayoutId: "pout_rzp_999",
        }),
      });
    });
  });
});
