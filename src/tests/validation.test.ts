import { describe, it, expect } from "vitest";
import { RegisterSellerSchema, BankVerifySchema } from "../schemas/seller.schema";
import { z } from "zod";

const emailSchema = z.string().email();

describe("Zod Validation Schemas", () => {
  describe("Email Validation", () => {
    it("should accept valid email addresses", () => {
      expect(emailSchema.safeParse("test@example.com").success).toBe(true);
      expect(emailSchema.safeParse("seller.chennai@velvet.in").success).toBe(true);
    });

    it("should reject malformed email addresses", () => {
      expect(emailSchema.safeParse("malformed-email").success).toBe(false);
      expect(emailSchema.safeParse("test@example").success).toBe(false);
      expect(emailSchema.safeParse("@example.com").success).toBe(false);
    });
  });

  describe("RegisterSellerSchema", () => {
    const validData = {
      businessName: "Kavitha's Boutiques",
      storeName: "Kavitha's Boutique Store",
      category: "Women's Ethnic Wear",
      city: "Chennai",
    };

    it("should accept valid seller data", () => {
      expect(RegisterSellerSchema.safeParse(validData).success).toBe(true);
    });

    it("should reject businessName under 3 characters", () => {
      const invalidData = { ...validData, businessName: "ab" };
      const res = RegisterSellerSchema.safeParse(invalidData);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("must be at least 3 characters");
      }
    });

    it("should reject businessName with script tags", () => {
      const invalidData = { ...validData, businessName: "<script>alert(1)</script>" };
      const res = RegisterSellerSchema.safeParse(invalidData);
      expect(res.success).toBe(false);
    });

    it("should reject city values outside the allowlist", () => {
      const invalidData = { ...validData, city: "Bangalore" };
      const res = RegisterSellerSchema.safeParse(invalidData);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("Only Chennai is supported");
      }
    });

    it("should reject invalid category values", () => {
      const invalidData = { ...validData, category: "Grooming" };
      const res = RegisterSellerSchema.safeParse(invalidData);
      expect(res.success).toBe(false);
    });
  });

  describe("BankVerifySchema", () => {
    const validBankData = {
      accountNumber: "123456789012",
      ifsc: "HDFC0001234",
    };

    it("should accept valid bank details", () => {
      expect(BankVerifySchema.safeParse(validBankData).success).toBe(true);
    });

    it("should reject account number under 9 digits", () => {
      const invalid = { ...validBankData, accountNumber: "1234567" };
      expect(BankVerifySchema.safeParse(invalid).success).toBe(false);
    });

    it("should reject non-numeric account number", () => {
      const invalid = { ...validBankData, accountNumber: "12345678abc" };
      expect(BankVerifySchema.safeParse(invalid).success).toBe(false);
    });

    it("should reject invalid IFSC format", () => {
      // 5th character not 0
      const invalidIfsc1 = { ...validBankData, ifsc: "HDFC1001234" };
      // Not 11 chars
      const invalidIfsc2 = { ...validBankData, ifsc: "HDFC000123" };
      expect(BankVerifySchema.safeParse(invalidIfsc1).success).toBe(false);
      expect(BankVerifySchema.safeParse(invalidIfsc2).success).toBe(false);
    });
  });
});
