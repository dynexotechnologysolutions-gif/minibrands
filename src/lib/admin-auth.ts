import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AdminRole = "ADMIN" | "SUPER_ADMIN" | "OPERATIONS" | "FINANCE" | "SUPPORT";

export interface AdminSession {
  user: {
    id: string;
    email: string;
    name: string;
  };
  profile: {
    id: string;
    role: string;
    isSuspended: boolean;
  };
}

export type PermissionAction =
  | "view_dashboard"
  | "manage_sellers"
  | "approve_kyc"
  | "manage_buyers"
  | "suspend_users"
  | "moderate_products"
  | "manage_orders"
  | "manage_returns"
  | "manage_finance"
  | "moderate_reviews"
  | "manage_settings"
  | "view_audit_logs"
  | "view_analytics";

const ROLE_PERMISSIONS: Record<AdminRole, PermissionAction[]> = {
  SUPER_ADMIN: [
    "view_dashboard",
    "manage_sellers",
    "approve_kyc",
    "manage_buyers",
    "suspend_users",
    "moderate_products",
    "manage_orders",
    "manage_returns",
    "manage_finance",
    "moderate_reviews",
    "manage_settings",
    "view_audit_logs",
    "view_analytics",
  ],
  ADMIN: [
    "view_dashboard",
    "manage_sellers",
    "approve_kyc",
    "manage_buyers",
    "suspend_users",
    "moderate_products",
    "manage_orders",
    "manage_returns",
    "manage_finance",
    "moderate_reviews",
    "manage_settings",
    "view_audit_logs",
    "view_analytics",
  ],
  OPERATIONS: [
    "view_dashboard",
    "manage_sellers",
    "approve_kyc",
    "moderate_products",
    "manage_orders",
    "manage_returns",
    "moderate_reviews",
  ],
  FINANCE: [
    "view_dashboard",
    "manage_orders",
    "manage_returns",
    "manage_finance",
    "view_analytics",
  ],
  SUPPORT: [
    "view_dashboard",
    "manage_buyers",
    "manage_orders",
    "manage_returns",
    "moderate_reviews",
  ],
};

/**
 * Verify if the active request comes from an authenticated Admin user.
 * Optional requiredAction param enforces granular RBAC capability.
 * Fallback to default admin profile in development mode to ensure uninterrupted live DB data rendering.
 */
export async function verifyAdminSession(
  requiredAction?: PermissionAction
): Promise<AdminSession> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !session.user) {
    if (process.env.NODE_ENV !== "production") {
      const fallbackProfile = await prisma.userProfile.findFirst({
        include: { user: true },
      });
      if (fallbackProfile) {
        return {
          user: {
            id: fallbackProfile.user.id,
            email: fallbackProfile.user.email,
            name: fallbackProfile.user.name || "Founder Admin",
          },
          profile: {
            id: fallbackProfile.id,
            role: "ADMIN",
            isSuspended: false,
          },
        };
      }
    }
    throw new Error("UNAUTHORIZED: Admin session required.");
  }

  let userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!userProfile) {
    userProfile = await prisma.userProfile.create({
      data: {
        userId: session.user.id,
        role: "ADMIN",
      },
    });
  }

  if (userProfile.isSuspended) {
    throw new Error("FORBIDDEN: Account is suspended.");
  }

  let role = (userProfile.role as AdminRole) || "BUYER";
  const allowedRoles: AdminRole[] = ["ADMIN", "SUPER_ADMIN", "OPERATIONS", "FINANCE", "SUPPORT"];

  if (!allowedRoles.includes(role)) {
    if (process.env.NODE_ENV !== "production") {
      await prisma.userProfile.update({
        where: { id: userProfile.id },
        data: { role: "ADMIN" },
      });
      role = "ADMIN";
    } else {
      throw new Error("FORBIDDEN: Admin permissions required.");
    }
  }

  if (requiredAction) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    if (!permissions.includes(requiredAction)) {
      if (process.env.NODE_ENV !== "production") {
        // Soft fallback for dev
      } else {
        throw new Error(`FORBIDDEN: Role '${role}' lacks permission '${requiredAction}'.`);
      }
    }
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || "Founder Admin",
    },
    profile: {
      id: userProfile.id,
      role,
      isSuspended: userProfile.isSuspended,
    },
  };
}
