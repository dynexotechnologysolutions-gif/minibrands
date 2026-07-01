"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { captureAndLogError } from "@/lib/sentry";
import { ActionResponse } from "./seller-register.action";
import * as z from "zod";

const SetDefaultSchema = z.object({
  addressId: z.string().uuid("Invalid address ID"),
});

export async function setAddressDefault(
  input: z.infer<typeof SetDefaultSchema>
): Promise<ActionResponse<{ addressId: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "You must be logged in to manage addresses." },
      };
    }

    // Verify input
    const validation = SetDefaultSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Invalid address ID",
        },
      };
    }

    const { addressId } = validation.data;

    // Fetch userProfile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "User profile not found." },
      };
    }

    // Verify address ownership
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.isDeleted) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Address not found." },
      };
    }

    if (address.userProfileId !== userProfile.id) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You do not own this address." },
      };
    }

    // Set default in transaction
    await prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userProfileId: userProfile.id, isDefault: true },
        data: { isDefault: false },
      });

      await tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });

    return {
      success: true,
      data: { addressId },
    };
  } catch (error: any) {
    captureAndLogError(error, "setAddressDefault", { input });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred.",
      },
    };
  }
}
