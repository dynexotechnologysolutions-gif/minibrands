import { describe, it, expect, vi, beforeEach } from "vitest";
import { RedirectService } from "@/lib/auth-services/redirect.service";
import { RoleService } from "@/lib/auth-services/role.service";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Mock next/headers
vi.mock("next/headers", () => {
  return {
    cookies: vi.fn(),
    headers: vi.fn().mockResolvedValue(new Map()),
  };
});

// Mock prisma client
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      userProfile: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe("Authentication Redirect Manager & Role Service Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("RedirectService - secureRedirectTo", () => {
    it("allows valid relative internal paths", () => {
      const url = RedirectService.secureRedirectTo("/account/profile", Role.BUYER);
      expect(url).toBe("/account/profile");
    });

    it("prevents absolute external redirect attempts (Open Redirect Protection)", () => {
      const url = RedirectService.secureRedirectTo("https://evil-hacker.com/malicious", Role.BUYER);
      expect(url).toBe("/"); // Falls back to BUYER default
    });

    it("prevents relative-protocol external redirect attempts", () => {
      const url = RedirectService.secureRedirectTo("//evil-hacker.com", Role.BUYER);
      expect(url).toBe("/");
    });

    it("prevents path redirection to unauthorized roles (Role Enforcement)", () => {
      const url1 = RedirectService.secureRedirectTo("/seller/dashboard", Role.BUYER);
      expect(url1).toBe("/");

      const url2 = RedirectService.secureRedirectTo("/admin/returns", Role.SELLER);
      expect(url2).toBe("/seller/dashboard");

      const url3 = RedirectService.secureRedirectTo("/seller/dashboard", Role.ADMIN);
      expect(url3).toBe("/seller/dashboard");
    });

    it("returns correct default fallback paths for various roles", () => {
      expect(RedirectService.getFallbackForRole(Role.BUYER)).toBe("/");
      expect(RedirectService.getFallbackForRole(Role.SELLER)).toBe("/seller/dashboard");
      expect(RedirectService.getFallbackForRole(Role.ADMIN)).toBe("/admin");
    });
  });

  describe("RoleService - verifyRole", () => {
    it("correctly evaluates permissions hierarchy", () => {
      expect(RoleService.verifyRole(Role.BUYER, Role.BUYER)).toBe(true);
      expect(RoleService.verifyRole(Role.SELLER, Role.BUYER)).toBe(true);
      expect(RoleService.verifyRole(Role.ADMIN, Role.BUYER)).toBe(true);
      expect(RoleService.verifyRole(Role.SUPER_ADMIN, Role.BUYER)).toBe(true);

      expect(RoleService.verifyRole(Role.BUYER, Role.SELLER)).toBe(false);
      expect(RoleService.verifyRole(Role.SELLER, Role.SELLER)).toBe(true);
      expect(RoleService.verifyRole(Role.ADMIN, Role.SELLER)).toBe(true);
      expect(RoleService.verifyRole(Role.SUPER_ADMIN, Role.SELLER)).toBe(true);
      
      expect(RoleService.verifyRole(Role.BUYER, Role.ADMIN)).toBe(false);
      expect(RoleService.verifyRole(Role.SELLER, Role.ADMIN)).toBe(false);
      expect(RoleService.verifyRole(Role.ADMIN, Role.ADMIN)).toBe(true);
      expect(RoleService.verifyRole(Role.SUPER_ADMIN, Role.ADMIN)).toBe(true);
    });
  });

  describe("RoleService - Founder Admin Promotion Self-Healing Gate", () => {
    it("automatically promotes sham1309kumar@gmail.com to ADMIN role if they have a non-admin role", async () => {
      const mockProfile = {
        id: "profile-123",
        userId: "user-123",
        role: Role.BUYER,
        user: {
          email: "sham1309kumar@gmail.com",
        },
      };

      const mockUpdatedProfile = {
        ...mockProfile,
        role: Role.ADMIN,
      };

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue(mockProfile as any);
      vi.mocked(prisma.userProfile.update).mockResolvedValue(mockUpdatedProfile as any);

      const result = await RoleService.getUserProfile("user-123");

      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        include: {
          user: true,
          seller: {
            include: {
              verification: true,
            },
          },
        },
      });

      expect(prisma.userProfile.update).toHaveBeenCalledWith({
        where: { id: "profile-123" },
        data: { role: Role.ADMIN },
        include: expect.any(Object),
      });

      expect(result?.role).toBe(Role.ADMIN);
    });

    it("does NOT promote other Google emails to ADMIN role", async () => {
      const mockProfile = {
        id: "profile-456",
        userId: "user-456",
        role: Role.BUYER,
        user: {
          email: "regular-user@gmail.com",
        },
      };

      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue(mockProfile as any);

      const result = await RoleService.getUserProfile("user-456");

      expect(prisma.userProfile.findUnique).toHaveBeenCalled();
      expect(prisma.userProfile.update).not.toHaveBeenCalled();
      expect(result?.role).toBe(Role.BUYER);
    });
  });
});
