import { describe, it, expect, vi, beforeEach } from "vitest";
import { cancelOrderAction, returnOrderAction } from "../actions/order-user-actions";
import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";

// Mock next/headers
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

// Mock prisma
vi.mock("../lib/prisma", () => ({
  prisma: {
    userProfile: {
      findUnique: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Orders Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("cancelOrderAction", () => {
    it("should reject unauthorized users", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const res = await cancelOrderAction("order-123");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("UNAUTHORIZED");
    });

    it("should reject non-existent orders", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-123" },
      } as any);

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-123",
      } as any);

      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const res = await cancelOrderAction("order-123");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("NOT_FOUND");
    });

    it("should reject if user does not own the order", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-123" },
      } as any);

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-123",
      } as any);

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "order-123",
        buyerId: "profile-other",
        status: "created",
      } as any);

      const res = await cancelOrderAction("order-123");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("FORBIDDEN");
    });

    it("should successfully cancel order when status is eligible", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-123" },
      } as any);

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-123",
      } as any);

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "order-123",
        buyerId: "profile-123",
        status: "created",
      } as any);

      vi.mocked(prisma.order.update).mockResolvedValue({} as any);

      const res = await cancelOrderAction("order-123");
      expect(res.success).toBe(true);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-123" },
        data: {
          status: "cancelled",
          orderStatus: "cancelled",
        },
      });
    });

    it("should reject cancellation if order is already delivered", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-123" },
      } as any);

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-123",
      } as any);

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "order-123",
        buyerId: "profile-123",
        status: "delivered",
      } as any);

      const res = await cancelOrderAction("order-123");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INVALID_STATUS");
    });
  });

  describe("returnOrderAction", () => {
    it("should successfully request return if delivered within window", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-123" },
      } as any);

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-123",
      } as any);

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "order-123",
        buyerId: "profile-123",
        status: "delivered",
        createdAt: new Date(), // recent order
      } as any);

      const res = await returnOrderAction("order-123");
      expect(res.success).toBe(true);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-123" },
        data: {
          status: "disputed",
          orderStatus: "returned",
        },
      });
    });

    it("should reject return if order is not delivered", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-123" },
      } as any);

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-123",
      } as any);

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "order-123",
        buyerId: "profile-123",
        status: "shipped",
        createdAt: new Date(),
      } as any);

      const res = await returnOrderAction("order-123");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INVALID_STATUS");
    });

    it("should reject return if outside 7-day window", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user-123" },
      } as any);

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: "profile-123",
      } as any);

      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "order-123",
        buyerId: "profile-123",
        status: "delivered",
        createdAt: tenDaysAgo,
      } as any);

      const res = await returnOrderAction("order-123");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("RETURN_EXPIRED");
    });
  });
});
