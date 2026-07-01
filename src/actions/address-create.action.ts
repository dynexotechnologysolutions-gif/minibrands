"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddressCreateSchema, AddressCreateInput } from "@/schemas/address.schema";
import { captureAndLogError } from "@/lib/sentry";
import { ActionResponse } from "./seller-register.action";

export async function createAddress(
  input: AddressCreateInput
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
    const validation = AddressCreateSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Invalid address data",
        },
      };
    }

    const data = validation.data;

    // Save Address in Transaction
    const address = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        // Unset any default addresses
        await tx.address.updateMany({
          where: { userProfileId: userProfile.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      // Check if user has no other addresses. If so, make this default anyway.
      const existingCount = await tx.address.count({
        where: { userProfileId: userProfile.id, isDeleted: false },
      });

      const isDefaultAddress = existingCount === 0 ? true : data.isDefault;

      return await tx.address.create({
        data: {
          userProfileId: userProfile.id,
          fullName: data.fullName,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2,
          city: data.city,
          pincode: data.pincode,
          isDefault: isDefaultAddress,
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
    captureAndLogError(error, "createAddress", { input });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred while saving address.",
      },
    };
  }
}
