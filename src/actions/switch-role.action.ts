"use server";

import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionResponse } from "./seller-register.action";

export async function switchActiveRole(
  mode: "BUYER" | "SELLER"
): Promise<ActionResponse<{ mode: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "You must be logged in to switch roles." },
      };
    }

    if (mode === "SELLER") {
      // Check if user is actually a seller
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: session.user.id },
        include: { seller: true },
      });

      if (!userProfile || !userProfile.seller) {
        return {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You must be a registered seller to switch to Seller Mode.",
          },
        };
      }
    }

    const cookieStore = await cookies();
    cookieStore.set("active_role_mode", mode, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false, // Make readable by both server & client
      sameSite: "lax",
    });

    return {
      success: true,
      data: { mode },
    };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: error.message || "Failed to switch role." },
    };
  }
}
