import { describe, it, expect } from "vitest";
import { ReturnStateMachine } from "../modules/returns/state-machine/return-state-machine";
import { ReturnPolicyService } from "../modules/returns/services/return-policy";
import { createRazorpayRefund } from "../lib/razorpay";
import { ReturnRequestStatus } from "@prisma/client";

describe("Epic X: Return & Refund System Unit Tests", () => {
  describe("ReturnStateMachine", () => {
    it("allows valid transitions (e.g. RETURN_REQUESTED -> APPROVED)", () => {
      expect(() =>
        ReturnStateMachine.validateTransition(
          ReturnRequestStatus.RETURN_REQUESTED,
          ReturnRequestStatus.APPROVED
        )
      ).not.toThrow();
    });

    it("allows valid transit flow (e.g. APPROVED -> PICKUP_SCHEDULED)", () => {
      expect(() =>
        ReturnStateMachine.validateTransition(
          ReturnRequestStatus.APPROVED,
          ReturnRequestStatus.PICKUP_SCHEDULED
        )
      ).not.toThrow();
    });

    it("rejects illegal transitions (e.g. RETURN_REQUESTED -> REFUNDED)", () => {
      expect(() =>
        ReturnStateMachine.validateTransition(
          ReturnRequestStatus.RETURN_REQUESTED,
          ReturnRequestStatus.REFUNDED
        )
      ).toThrow("Invalid RMA transition");
    });

    it("rejects illegal backward transitions (e.g. RETURN_COMPLETED -> RETURN_REQUESTED)", () => {
      expect(() =>
        ReturnStateMachine.validateTransition(
          ReturnRequestStatus.RETURN_COMPLETED,
          ReturnRequestStatus.RETURN_REQUESTED
        )
      ).toThrow("Invalid RMA transition");
    });
  });

  describe("Razorpay Refund Integration", () => {
    it("simulates successful refund in mock environment", async () => {
      const result = await createRazorpayRefund("pay_mock_123456", 50000);
      expect(result.id).toContain("rfnd_mock_");
      expect(result.payment_id).toBe("pay_mock_123456");
      expect(result.amount).toBe(50000);
      expect(result.status).toBe("processed");
    });
  });

  describe("ReturnPolicyService", () => {
    it("returns ineligible for non-existent order", async () => {
      const result = await ReturnPolicyService.validateReturnEligibility("invalid-id");
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe("Order not found.");
      expect(result.policyVersion).toBe("2026-RMA-v1");
    });
  });
});
