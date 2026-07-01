import { describe, it, expect } from "vitest";
import { calculateTrustScore } from "../lib/trust-score";

describe("calculateTrustScore", () => {
  it("should return 0 when kycStatus is not approved", () => {
    expect(calculateTrustScore({ kycStatus: "pending", bankVerified: true })).toBe(0);
    expect(calculateTrustScore({ kycStatus: "rejected", bankVerified: true })).toBe(0);
    expect(calculateTrustScore({ kycStatus: "manual_review", bankVerified: true })).toBe(0);
  });

  it("should return 0 when bankVerified is false even if kycStatus is approved", () => {
    expect(calculateTrustScore({ kycStatus: "auto_approved", bankVerified: false })).toBe(0);
    expect(calculateTrustScore({ kycStatus: "approved", bankVerified: false })).toBe(0);
  });

  it("should return 50 only when both conditions are true", () => {
    expect(calculateTrustScore({ kycStatus: "auto_approved", bankVerified: true })).toBe(50);
    expect(calculateTrustScore({ kycStatus: "approved", bankVerified: true })).toBe(50);
  });
});
