import { describe, it, expect, vi, beforeEach } from "vitest";
import ProfilePage from "../app/account/profile/page";
import LegacyProfilePage from "../app/profile/page";
import LegacyOrdersPage from "../app/orders/page";
import LegacyAddressesPage from "../app/addresses/page";
import LegacyWishlistPage from "../app/wishlist/page";
import { switchActiveRole } from "../actions/switch-role.action";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";
import { auth } from "../lib/auth";
import { cookies } from "next/headers";

// Mock next/headers
vi.mock("next/headers", () => {
  const mockSet = vi.fn();
  const mockGet = vi.fn();
  return {
    headers: vi.fn(async () => {
      const h = new Headers();
      h.set("cookie", "mock-session-cookie");
      return h;
    }),
    cookies: vi.fn(async () => ({
      set: mockSet,
      get: mockGet,
    })),
  };
});

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT_TO: ${url}`);
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

// Mock redis
vi.mock("../lib/redis", () => ({
  redis: {
    smembers: vi.fn(async () => []),
  },
  getUserReservations: vi.fn(async () => []),
}));

// Mock prisma
vi.mock("../lib/prisma", () => ({
  prisma: {
    userProfile: {
      findUnique: vi.fn(),
    },
    order: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
    seller: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock ProfileClient component
vi.mock("../app/profile/ProfileClient", () => ({
  default: vi.fn(() => null),
}));

describe("Legacy Routes Redirections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect /profile to /account/profile", async () => {
    expect(() => LegacyProfilePage()).toThrow("REDIRECT_TO: /account/profile");
  });

  it("should redirect /orders to /account/orders", async () => {
    expect(() => LegacyOrdersPage()).toThrow("REDIRECT_TO: /account/orders");
  });

  it("should redirect /wishlist to /account/wishlist", async () => {
    expect(() => LegacyWishlistPage()).toThrow("REDIRECT_TO: /account/wishlist");
  });

  it("should redirect /addresses to /account/addresses preserving query params", async () => {
    const searchParams = Promise.resolve({ redirectTo: "/checkout", sessionId: "sess-123" });
    await expect(LegacyAddressesPage({ searchParams })).rejects.toThrow(
      "REDIRECT_TO: /account/addresses?redirectTo=%2Fcheckout&sessionId=sess-123"
    );
  });
});

describe("Account Profile Page Server Component Loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to login if unauthenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    await expect(ProfilePage()).rejects.toThrow("REDIRECT_TO: /login?redirectTo=/account/profile");
  });

  it("should redirect to login if userProfile is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any);
    vi.mocked(prisma.userProfile.findUnique).mockResolvedValue(null);

    await expect(ProfilePage()).rejects.toThrow("REDIRECT_TO: /login?redirectTo=/account/profile");
  });

  it("should successfully fetch orders, wishlist, default address and return client payload", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any);

    const mockProfile = {
      id: "profile-123",
      userId: "user-123",
      role: "BUYER",
      user: { name: "Test User", email: "test@example.com", image: "avatar.png", createdAt: new Date() },
      seller: null,
      addresses: [
        { id: "addr-1", isDefault: true, fullName: "Test Recipient", phone: "12345" },
      ],
    };
    vi.mocked(prisma.userProfile.findUnique).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.order.count).mockResolvedValue(5);
    vi.mocked(redis.smembers).mockResolvedValue(["prod-1", "prod-2"]);

    const mockOrders = [
      {
        id: "order-1",
        status: "delivered",
        orderStatus: "delivered",
        totalAmount: 5000,
        createdAt: new Date(),
        items: [
          { product: { name: "Test Product", images: [{ url: "product.png" }] } },
        ],
      },
    ];
    vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);

    const mockProducts = [
      { id: "prod-1", name: "Wishlist 1", price: 1000, images: [{ url: "w1.png" }], variants: [{ id: "v-1" }] },
      { id: "prod-2", name: "Wishlist 2", price: 2000, images: [{ url: "w2.png" }], variants: [{ id: "v-2" }] },
    ];
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

    const res = await ProfilePage();
    expect(res).toBeDefined();
    expect(prisma.order.count).toHaveBeenCalledWith({ where: { buyerId: "profile-123" } });
    expect(redis.smembers).toHaveBeenCalledWith("wishlist:profile-123");
  });
});

describe("switchActiveRole Server Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return success when switching to BUYER", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any);

    const res = await switchActiveRole("BUYER");
    expect(res.success).toBe(true);
    expect(res.data?.mode).toBe("BUYER");

    const cookieStore = await cookies();
    expect(cookieStore.set).toHaveBeenCalledWith("active_role_mode", "BUYER", expect.any(Object));
  });

  it("should fail to switch to SELLER if user profile has no seller relationship", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any);

    vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
      id: "profile-123",
      userId: "user-123",
      role: "BUYER",
      seller: null,
    } as any);

    const res = await switchActiveRole("SELLER");
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("FORBIDDEN");
  });

  it("should succeed to switch to SELLER if user profile has active seller relationship", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any);

    vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
      id: "profile-123",
      userId: "user-123",
      role: "SELLER",
      seller: { id: "seller-123", businessName: "My Boutique" },
    } as any);

    const res = await switchActiveRole("SELLER");
    expect(res.success).toBe(true);
    expect(res.data?.mode).toBe("SELLER");

    const cookieStore = await cookies();
    expect(cookieStore.set).toHaveBeenCalledWith("active_role_mode", "SELLER", expect.any(Object));
  });
});
