import { getRequestSession, getRequestUserProfile } from "@/lib/request-auth";

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
 */
export async function verifyAdminSession(
  requiredAction?: PermissionAction
): Promise<AdminSession> {
  const session = await getRequestSession();

  if (!session || !session.user) {
    throw new Error("UNAUTHORIZED: Admin session required.");
  }

  // Strict email lock for the founder account
  if (session.user.email !== "sham1309kumar@gmail.com") {
    throw new Error("FORBIDDEN: Admin permissions required.");
  }

  const userProfile = await getRequestUserProfile(session.user.id);

  if (!userProfile) {
    throw new Error("FORBIDDEN: Admin profile not found.");
  }

  if (userProfile.role !== "ADMIN" && userProfile.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN: Admin permissions required.");
  }

  if (userProfile.isSuspended) {
    throw new Error("FORBIDDEN: Account is suspended.");
  }

  const role = (userProfile.role as AdminRole) || "ADMIN";

  if (requiredAction) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    if (!permissions.includes(requiredAction)) {
      throw new Error(`FORBIDDEN: Role '${role}' lacks permission '${requiredAction}'.`);
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
