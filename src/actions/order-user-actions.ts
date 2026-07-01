"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ActionResponse } from "./seller-register.action";

export async function cancelOrderAction(
  orderId: string
): Promise<ActionResponse<{ success: boolean }>> {
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

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User profile not found." },
      };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Order not found." },
      };
    }

    if (order.buyerId !== userProfile.id) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You do not own this order." },
      };
    }

    // Check if the order can be cancelled: only if not already cancelled, delivered, completed, or disputed
    const nonCancellable = ["cancelled", "delivered", "completed", "disputed"].includes(order.status);
    if (nonCancellable) {
      return {
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: `Cannot cancel an order that is already ${order.status}.`,
        },
      };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "cancelled",
        orderStatus: "cancelled",
      },
    });

    return {
      success: true,
      data: { success: true },
    };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: error.message || "Failed to cancel order." },
    };
  }
}

export async function returnOrderAction(
  orderId: string
): Promise<ActionResponse<{ success: boolean }>> {
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

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User profile not found." },
      };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Order not found." },
      };
    }

    if (order.buyerId !== userProfile.id) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You do not own this order." },
      };
    }

    // Verify status is delivered / completed
    if (order.status !== "delivered" && order.status !== "completed" && order.orderStatus !== "delivered") {
      return {
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: "Only delivered orders can be returned.",
        },
      };
    }

    // Verify within 7 days
    const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
    const limitMs = 7 * 24 * 60 * 60 * 1000;
    if (elapsedMs > limitMs) {
      return {
        success: false,
        error: {
          code: "RETURN_EXPIRED",
          message: "The 7-day return window for this order has expired.",
        },
      };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "disputed",
        orderStatus: "returned",
      },
    });

    return {
      success: true,
      data: { success: true },
    };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: error.message || "Failed to return order." },
    };
  }
}
