"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionResponse } from "./seller-register.action";

export interface DefaultAddressData {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  pincode: string;
  isDefault: boolean;
}

export async function getDefaultAddress(): Promise<ActionResponse<DefaultAddressData | null>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: true,
        data: null,
      };
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return {
        success: true,
        data: null,
      };
    }

    const defaultAddress = await prisma.address.findFirst({
      where: {
        userProfileId: userProfile.id,
        isDefault: true,
        isDeleted: false,
      },
    });

    if (!defaultAddress) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: {
        id: defaultAddress.id,
        fullName: defaultAddress.fullName,
        phone: defaultAddress.phone,
        line1: defaultAddress.line1,
        line2: defaultAddress.line2,
        city: defaultAddress.city,
        pincode: defaultAddress.pincode,
        isDefault: defaultAddress.isDefault,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred.",
      },
    };
  }
}
