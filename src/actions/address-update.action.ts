"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddressCreateSchema } from "@/schemas/address.schema";
import { captureAndLogError } from "@/lib/sentry";
import { ActionResponse } from "./seller-register.action";
import * as z from "zod";

const AddressUpdateSchema = AddressCreateSchema.extend({
  addressId: z.string().uuid("Invalid address ID"),
});

export type AddressUpdateInput = z.infer<typeof AddressUpdateSchema>;

export async function updateAddress(
  input: AddressUpdateInput
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

    // Input validation
    const validation = AddressUpdateSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Invalid address data",
        },
      };
    }

    const { addressId, ...data } = validation.data;

    // Verify ownership
    const existing = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existing || existing.isDeleted || existing.userProfileId !== userProfile.id) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You do not own this address or it has been deleted." },
      };
    }

    // Update Address in Transaction
    const address = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        // Unset any default addresses
        await tx.address.updateMany({
          where: { userProfileId: userProfile.id, isDefault: true, NOT: { id: addressId } },
          data: { isDefault: false },
        });
      }

       return await tx.address.update({
        where: { id: addressId },
        data: {
          fullName: data.fullName,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2,
          city: data.city,
          pincode: data.pincode,
          isDefault: data.isDefault,
          latitude: data.latitude,
          longitude: data.longitude,
        },
      });
    });

    return {
      success: true,
      data: {
        addressId: address.id,
      },
    };
  } catch (error: any) {
    captureAndLogError(error, "updateAddress", { input });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred while saving address.",
      },
    };
  }
}
