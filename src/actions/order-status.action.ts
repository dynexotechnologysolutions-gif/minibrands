"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ActionResponse } from "./seller-register.action";

export async function getOrderStatus(
  orderId: string
): Promise<ActionResponse<{ status: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "You must be logged in." },
      };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true },
    });

    if (!order) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Order not found." },
      };
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile || order.buyerId !== userProfile.id) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You do not own this order." },
      };
    }

    return {
      success: true,
      data: { status: order.status },
    };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: error.message || "Failed to fetch order status." },
    };
  }
}
