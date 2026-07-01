import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProduct } from "../actions/product-create.action";
import { updateProduct } from "../actions/product-update.action";
import { publishProduct } from "../actions/product-publish.action";
import { unpublishProduct } from "../actions/product-unpublish.action";
import { deleteProduct } from "../actions/product-delete.action";
import { isEligibleToPublish } from "../lib/product-validation";
import { ProductCreateSchema, ProductUpdateSchema } from "../schemas/product.schema";
import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";

// 1. Mock Next.js 15 Server Action headers
vi.mock("next/headers", () => {
  return {
    headers: vi.fn(async () => {
      const h = new Headers();
      h.set("cookie", "mock-session-cookie");
      return h;
    }),
  };
});

// 2. Mock Prisma Client
vi.mock("../lib/prisma", () => {
  const mockPrisma = {
    userProfile: {
      findUnique: vi.fn(),
    },
    product: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    productImage: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    productVariant: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

// 3. Mock Better Auth client session
vi.mock("../lib/auth", () => {
  return {
    auth: {
      api: {
        getSession: vi.fn(),
      },
    },
  };
});

// 4. Mock PostHog analytics tracking
vi.mock("../lib/posthog", () => {
  return {
    trackEvent: vi.fn(),
  };
});

// 5. Mock Sentry reporting
vi.mock("../lib/sentry", () => {
  return {
    captureAndLogError: vi.fn(),
  };
});

describe("Product Catalog Unit & Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Publish Eligibility Logic", () => {
    it("should reject product with no images and no stock variants", () => {
      const res = isEligibleToPublish({ images: [], variants: [] });
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("Add at least one product photo and one size with stock");
    });

    it("should reject product with images but no stock variants", () => {
      const res = isEligibleToPublish({
        images: [{ url: "https://res.cloudinary.com/test/img1.jpg" }],
        variants: [{ stockCount: 0 }],
      });
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("Add at least one size with stock");
    });

    it("should reject product with stock variants but no images", () => {
      const res = isEligibleToPublish({
        images: [],
        variants: [{ stockCount: 5 }],
      });
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("Add at least one product photo");
    });

    it("should approve product with both images and stock variants", () => {
      const res = isEligibleToPublish({
        images: [{ url: "https://res.cloudinary.com/test/img1.jpg" }],
        variants: [{ stockCount: 2 }],
      });
      expect(res.eligible).toBe(true);
    });
  });

  describe("Zod Validation Schemas", () => {
    const validPayload = {
      name: "Chanderi Cotton Kurti",
      shortDescription: "Elegant everyday ethic wear",
      fullDescription: "A fine cotton silk weave crafted with block printing.",
      category: "Women's Ethnic Wear",
      price: 150000, // ₹1,500
      images: [{ url: "https://res.cloudinary.com/test/img.jpg", cloudinaryPublicId: "test_id" }],
      variants: [{ size: "M", stockCount: 10 }],
    };

    it("should pass validation for correct details", () => {
      const res = ProductCreateSchema.safeParse(validPayload);
      expect(res.success).toBe(true);
    });

    it("should fail validation if price is less than ₹100", () => {
      const invalid = { ...validPayload, price: 9900 }; // ₹99
      const res = ProductCreateSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it("should fail validation if product name is less than 3 characters", () => {
      const invalid = { ...validPayload, name: "Ch" };
      const res = ProductCreateSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it("should fail validation if short description exceeds 150 characters", () => {
      const invalid = { ...validPayload, shortDescription: "a".repeat(151) };
      const res = ProductCreateSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("Server Actions - createProduct", () => {
    const defaultInput = {
      name: "Chanderi Cotton Kurti",
      shortDescription: "Elegant everyday ethic wear",
      fullDescription: "A fine cotton silk weave crafted with block printing.",
      category: "Women's Ethnic Wear",
      subcategory: "Kurtis",
      tags: ["ethnic", "cotton"],
      price: 150000,
      images: [{ url: "https://res.cloudinary.com/test/img.jpg", cloudinaryPublicId: "test_id" }],
      variants: [{ size: "M", stockCount: 10 }],
      aiGenerated: false,
    };

    it("should reject when session is unauthorized", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const res = await createProduct(defaultInput);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("UNAUTHORIZED");
    });

    it("should reject when seller is not verified or bank is not linked", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-1", email: "test@example.com", emailVerified: true } as any,
        session: { id: "sess-1", expiresAt: new Date(), token: "t", createdAt: new Date(), updatedAt: new Date(), userId: "user-1" },
      });

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-1",
        userId: "user-1",
        role: "SELLER",
        seller: {
          id: "seller-1",
          verification: {
            kycStatus: "pending", // not approved
            bankVerified: false,
          },
        },
      } as any);

      const res = await createProduct(defaultInput);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("SELLER_NOT_VERIFIED");
    });

    it("should successfully create product when seller is verified and bank verified", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-1", email: "test@example.com", emailVerified: true } as any,
        session: { id: "sess-1", expiresAt: new Date(), token: "t", createdAt: new Date(), updatedAt: new Date(), userId: "user-1" },
      });

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-1",
        userId: "user-1",
        role: "SELLER",
        seller: {
          id: "seller-1",
          verification: {
            kycStatus: "auto_approved",
            bankVerified: true,
          },
        },
      } as any);

      vi.mocked(prisma.product.create).mockResolvedValue({
        id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      } as any);

      const res = await createProduct(defaultInput);
      expect(res.success).toBe(true);
      expect(res.data?.productId).toBe("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    });
  });

  describe("Server Actions - updateProduct", () => {
    const updateInput = {
      productId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      name: "Chanderi Cotton Kurti V2",
      shortDescription: "Elegant everyday ethnic wear updated",
      fullDescription: "A fine cotton silk weave crafted with block printing.",
      category: "Women's Ethnic Wear",
      price: 160000,
      images: [{ url: "https://res.cloudinary.com/test/img-v2.jpg", cloudinaryPublicId: "test_id_v2" }],
      variants: [{ size: "M", stockCount: 15 }],
    };

    it("should reject updates from non-owner sellers", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-buyer", email: "test@example.com", emailVerified: true } as any,
        session: { id: "sess-1", expiresAt: new Date(), token: "t", createdAt: new Date(), updatedAt: new Date(), userId: "user-buyer" },
      });

      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        seller: {
          id: "seller-owner",
          userProfileId: "profile-owner", // different profile
          userProfile: {
            userId: "profile-owner",
          },
          verification: {
            kycStatus: "auto_approved",
            bankVerified: true,
          },
        },
      } as any);

      const res = await updateProduct(updateInput);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("FORBIDDEN");
    });

    it("should succeed and call transaction when updating owned product", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-owner", email: "test@example.com", emailVerified: true } as any,
        session: { id: "sess-1", expiresAt: new Date(), token: "t", createdAt: new Date(), updatedAt: new Date(), userId: "user-owner" },
      });

      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        sellerId: "seller-1",
        seller: {
          id: "seller-1",
          userProfileId: "user-owner", // same as session userId
          userProfile: {
            userId: "user-owner",
          },
          verification: {
            kycStatus: "auto_approved",
            bankVerified: true,
          },
        },
      } as any);

      const res = await updateProduct(updateInput);
      expect(res.success).toBe(true);
      expect(res.data?.productId).toBe("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    });
  });

  describe("Server Actions - deleteProduct (Soft-Delete)", () => {
    it("should soft delete product (sets isDeleted=true, isPublished=false)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-owner", email: "test@example.com", emailVerified: true } as any,
        session: { id: "sess-1", expiresAt: new Date(), token: "t", createdAt: new Date(), updatedAt: new Date(), userId: "user-owner" },
      });

      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        sellerId: "seller-1",
        seller: {
          id: "seller-1",
          userProfileId: "user-owner",
          userProfile: {
            userId: "user-owner",
          },
        },
      } as any);

      const res = await deleteProduct({ productId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" });
      expect(res.success).toBe(true);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" },
        data: {
          isPublished: false,
          isDeleted: true,
        },
      });
    });
  });
});
