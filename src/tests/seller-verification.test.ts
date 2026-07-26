import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";
import { createProduct } from "../actions/product-create.action";
import { PATCH as approveSellerHandler } from "../app/api/admin/sellers/[id]/approve/route";

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

// Mock admin auth
vi.mock("../lib/admin-auth", () => ({
  verifyAdminSession: vi.fn().mockResolvedValue({
    user: { id: "admin-1", email: "admin@velvetlane.in" },
    profile: { role: "ADMIN" },
  }),
}));

// Mock posthog
vi.mock("../lib/posthog", () => ({
  trackEvent: vi.fn(),
}));

// Mock sentry
vi.mock("../lib/sentry", () => ({
  captureAndLogError: vi.fn(),
}));

// Mock audit logger
vi.mock("../lib/audit-logger", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ id: "log-1" }),
}));

// Mock Prisma
vi.mock("../lib/prisma", () => ({
  prisma: {
    userProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    seller: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    sellerVerification: {
      upsert: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    orderItem: {
      count: vi.fn().mockResolvedValue(0),
    },
    productVariant: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    productImage: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(prisma)),
  },
}));

describe("Seller Verification Pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Always mock a default valid user session
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: {
        id: "user-1",
        email: "seller@test.com",
        name: "Seller",
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
      },
      session: { id: "sess-1", expiresAt: new Date(), token: "t", createdAt: new Date(), updatedAt: new Date(), userId: "user-1" },
    });
  });

  describe("Product Creation and Editing Constraints", () => {
    it("should block product creation if the seller status is DRAFT", async () => {
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-1",
        userId: "user-1",
        role: "SELLER",
        isSuspended: false,
        suspendedReason: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        seller: {
          id: "seller-1",
          businessName: "Test Store",
          status: "DRAFT",
          userProfileId: "profile-1",
          storeName: "test",
          category: "Accessories",
          city: "Chennai",
          createdAt: new Date(),
        },
      } as any);

      const res = await createProduct({
        name: "New Product",
        shortDescription: "desc",
        fullDescription: "this is a very long full description of the product",
        category: "Accessories",
        price: 15000,
        tags: [],
        images: [],
        variants: [],
        aiGenerated: false,
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("SELLER_NOT_ONBOARDED");
    });

    it("should block product creation if the seller status is SUSPENDED", async () => {
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-1",
        userId: "user-1",
        role: "SELLER",
        seller: {
          id: "seller-1",
          businessName: "Test Store",
          status: "SUSPENDED",
        },
      } as any);

      const res = await createProduct({
        name: "New Product",
        shortDescription: "desc",
        fullDescription: "this is a very long full description of the product",
        category: "Accessories",
        price: 15000,
        tags: [],
        images: [],
        variants: [],
        aiGenerated: false,
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("SELLER_SUSPENDED");
    });

    it("should allow product creation as DRAFT if the seller status is PENDING_VERIFICATION", async () => {
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-1",
        userId: "user-1",
        role: "SELLER",
        seller: {
          id: "seller-1",
          businessName: "Test Store",
          status: "PENDING_VERIFICATION",
        },
      } as any);

      vi.mocked(prisma.product.create).mockResolvedValue({
        id: "product-1",
      } as any);

      const res = await createProduct({
        name: "New Product",
        shortDescription: "desc",
        fullDescription: "this is a very long full description of the product",
        category: "Accessories",
        price: 15000,
        tags: [],
        images: [],
        variants: [],
        aiGenerated: false,
      });

      expect(res.success).toBe(true);
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "DRAFT",
            isPublished: false,
          }),
        })
      );
    });
  });

  describe("Admin Seller Approvals", () => {
    it("should set status to APPROVED and auto-publish draft products", async () => {
      vi.mocked(prisma.seller.findUnique).mockResolvedValue({
        id: "seller-1",
        businessName: "Test Store",
        status: "PENDING_VERIFICATION",
      } as any);

      const request = new Request("http://localhost/api/admin/sellers/seller-1/approve", {
        method: "PATCH",
      });

      const res = await approveSellerHandler(request, {
        params: Promise.resolve({ id: "seller-1" }),
      });

      expect(res.status).toBe(200);
      expect(prisma.seller.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "seller-1" },
          data: expect.objectContaining({
            status: "APPROVED",
          }),
        })
      );
      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: {
          sellerId: "seller-1",
          isDeleted: false,
          status: "DRAFT",
        },
        data: expect.objectContaining({
          status: "PUBLISHED",
          isPublished: true,
        }),
      });
    });
  });
});
