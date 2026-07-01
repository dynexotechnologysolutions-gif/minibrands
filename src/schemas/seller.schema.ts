import { z } from "zod";

export const RegisterSellerSchema = z.object({
  businessName: z
    .string()
    .min(3, "Business name must be at least 3 characters")
    .max(100, "Business name must not exceed 100 characters")
    .trim()
    .refine((val) => !/<script/i.test(val), {
      message: "Script tags are not allowed in business name",
    }),
  storeName: z
    .string()
    .min(3, "Store name must be at least 3 characters")
    .max(100, "Store name must not exceed 100 characters")
    .trim()
    .refine((val) => !/<script/i.test(val), {
      message: "Script tags are not allowed in store name",
    }),
  category: z.enum(["Women's Ethnic Wear", "Streetwear", "Accessories", "Handloom"], {
    message: "Please select a valid category",
  }),
  city: z.enum(["Chennai"], {
    message: "Only Chennai is supported for launch",
  }),
});

export const BankVerifySchema = z.object({
  accountNumber: z
    .string()
    .min(9, "Account number must be at least 9 digits")
    .max(18, "Account number must not exceed 18 digits")
    .regex(/^\d+$/, "Account number must contain only numbers"),
  ifsc: z
    .string()
    .length(11, "IFSC must be exactly 11 characters")
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC format (e.g. HDFC0001234)"),
});

export type RegisterSellerInput = z.infer<typeof RegisterSellerSchema>;
export type BankVerifyInput = z.infer<typeof BankVerifySchema>;
export type KycStatus = "pending" | "auto_approved" | "manual_review" | "rejected" | "approved";

export const UpdateSellerProfileSchema = z.object({
  storeName: z
    .string()
    .min(3, "Store name must be at least 3 characters")
    .max(100, "Store name must not exceed 100 characters")
    .trim()
    .refine((val) => !/<script/i.test(val), {
      message: "Script tags are not allowed in store name",
    }),
  storeDescription: z
    .string()
    .max(500, "Store description must not exceed 500 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  storeLogo: z.string().optional().nullable().or(z.literal("")),
  storeBanner: z.string().optional().nullable().or(z.literal("")),
  category: z.enum(["Women's Ethnic Wear", "Streetwear", "Accessories", "Handloom"], {
    message: "Please select a valid category",
  }),
  city: z.enum(["Chennai"], {
    message: "Only Chennai is supported for launch",
  }),
});

export type UpdateSellerProfileInput = z.infer<typeof UpdateSellerProfileSchema>;

