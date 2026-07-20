"use server";

import { verifyAdminSession } from "@/lib/admin-auth";
import { ActionResponse } from "./seller-register.action";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function approveSellerKycAction(
  sellerId: string
): Promise<ActionResponse<{ message: string }>> {
  try {
    await verifyAdminSession("approve_kyc");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/admin/sellers/${sellerId}/approve-kyc`,
      {
        method: "PATCH",
        headers: await headers(),
      }
    );

    if (!res.ok) {
      const errData = await res.json();
      return { success: false, error: { code: "SERVER_ERROR", message: errData.error || "Failed to approve KYC." } };
    }

    return { success: true, data: { message: "KYC approved successfully." } };
  } catch (err: any) {
    return { success: false, error: { code: "FORBIDDEN", message: err.message || "Unauthorized action." } };
  }
}

export async function rejectSellerKycAction(
  sellerId: string,
  reason: string
): Promise<ActionResponse<{ message: string }>> {
  try {
    await verifyAdminSession("approve_kyc");

    if (!reason.trim()) {
      return { success: false, error: { code: "BAD_REQUEST", message: "A valid rejection reason is required." } };
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/admin/sellers/${sellerId}/reject-kyc`,
      {
        method: "PATCH",
        headers: await headers(),
        body: JSON.stringify({ reason }),
      }
    );

    if (!res.ok) {
      const errData = await res.json();
      return { success: false, error: { code: "SERVER_ERROR", message: errData.error || "Failed to reject KYC." } };
    }

    return { success: true, data: { message: "KYC rejected successfully." } };
  } catch (err: any) {
    return { success: false, error: { code: "FORBIDDEN", message: err.message || "Unauthorized action." } };
  }
}

export async function suspendUserAction(
  userProfileId: string,
  suspend: boolean,
  reason?: string
): Promise<ActionResponse<{ message: string }>> {
  try {
    await verifyAdminSession("suspend_users");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/admin/users/${userProfileId}/suspend`,
      {
        method: "PATCH",
        headers: await headers(),
        body: JSON.stringify({ suspend, reason }),
      }
    );

    if (!res.ok) {
      const errData = await res.json();
      return { success: false, error: { code: "SERVER_ERROR", message: errData.error || "Failed to update user status." } };
    }

    return { success: true, data: { message: `User ${suspend ? "suspended" : "unsuspended"} successfully.` } };
  } catch (err: any) {
    return { success: false, error: { code: "FORBIDDEN", message: err.message || "Unauthorized action." } };
  }
}

export async function updatePlatformSettingAction(
  key: string,
  value: string,
  reason?: string
): Promise<ActionResponse<{ message: string }>> {
  try {
    await verifyAdminSession("manage_settings");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/admin/settings`,
      {
        method: "PATCH",
        headers: await headers(),
        body: JSON.stringify({ key, value, reason }),
      }
    );

    if (!res.ok) {
      const errData = await res.json();
      return { success: false, error: { code: "SERVER_ERROR", message: errData.error || "Failed to update setting." } };
    }

    return { success: true, data: { message: "Setting updated successfully." } };
  } catch (err: any) {
    return { success: false, error: { code: "FORBIDDEN", message: err.message || "Unauthorized action." } };
  }
}
