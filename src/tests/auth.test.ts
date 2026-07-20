import { describe, it, expect } from "vitest";
import { validatePassword } from "@/lib/password-policy";
import {
  getVerificationEmailHtml,
  getPasswordResetEmailHtml,
  getWelcomeEmailHtml,
  getAccountLockoutEmailHtml,
} from "@/lib/email-templates";

describe("Production Authentication Architecture Tests", () => {
  describe("Password Policy & Strength Analyzer", () => {
    it("rejects weak passwords missing required character types", () => {
      const result = validatePassword("simple");
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(100);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("rejects passwords under 8 characters even if complex", () => {
      const result = validatePassword("A1#b2");
      expect(result.isValid).toBe(false);
      expect(result.checks.minLength).toBe(false);
    });

    it("accepts valid strong passwords satisfying all 5 security criteria", () => {
      const result = validatePassword("VelvetLane#2026");
      expect(result.isValid).toBe(true);
      expect(result.checks.minLength).toBe(true);
      expect(result.checks.hasUppercase).toBe(true);
      expect(result.checks.hasLowercase).toBe(true);
      expect(result.checks.hasNumber).toBe(true);
      expect(result.checks.hasSpecialChar).toBe(true);
      expect(result.score).toBe(100);
    });
  });

  describe("Branded Email Template Generation", () => {
    it("generates valid HTML for verification emails containing OTP code", () => {
      const html = getVerificationEmailHtml({
        name: "Ananya",
        code: "987654",
        expiresInMinutes: 5,
      });
      expect(html).toContain("MINIBRANDS");
      expect(html).toContain("987654");
      expect(html).toContain("Verify Your Email Address");
    });

    it("generates valid HTML for password reset emails", () => {
      const html = getPasswordResetEmailHtml({
        name: "Rahul",
        code: "123456",
        resetUrl: "http://localhost:3000/reset-password?token=123456",
      });
      expect(html).toContain("Password Reset Request");
      expect(html).toContain("123456");
      expect(html).toContain("Reset Password");
    });

    it("generates valid HTML for seller welcome emails", () => {
      const html = getWelcomeEmailHtml({
        name: "Velvet Couture Store",
        role: "SELLER",
        dashboardUrl: "http://localhost:3000/seller/dashboard",
      });
      expect(html).toContain("MINIBRANDS");
      expect(html).toContain("Velvet Couture Store");
      expect(html).toContain("Seller Boutique Account");
    });
  });
});
