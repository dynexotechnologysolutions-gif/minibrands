"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { captureAndLogError } from "@/lib/sentry";
import { ActionResponse } from "./seller-register.action";
import * as z from "zod";

const DeleteAddressSchema = z.object({
  addressId: z.string().uuid("Invalid address ID"),
});

export async function deleteAddress(
  input: z.infer<typeof DeleteAddressSchema>
): Promise<ActionResponse<{ success: boolean }>> {
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

    const validation = DeleteAddressSchema.safeParse(input);
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

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "User profile not found." },
      };
    }

    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
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

    // Soft delete in transaction to re-assign default if necessary
    await prisma.$transaction(async (tx) => {
      await tx.address.update({
        where: { id: addressId },
        data: {
          isDeleted: true,
          isDefault: false,
        },
      });

      if (address.isDefault) {
        // Find another active address to set as default
        const anotherAddress = await tx.address.findFirst({
          where: {
            userProfileId: userProfile.id,
            isDeleted: false,
          },
        });

        if (anotherAddress) {
          await tx.address.update({
            where: { id: anotherAddress.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return {
      success: true,
      data: { success: true },
    };
  } catch (error: any) {
    captureAndLogError(error, "deleteAddress", { input });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred while deleting address.",
      },
    };
  }
}
