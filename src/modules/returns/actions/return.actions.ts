"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ReturnRequestStatus, InspectionResult, RefundMethod, ReturnReason, EvidenceType } from "@prisma/client";
import { ReturnPolicyService } from "../services/return-policy";
import { calculateAbuseScore } from "../services/abuse";
import { ReturnStateMachine } from "../state-machine/return-state-machine";
import { RestockService } from "../services/restock";
import { NotificationService } from "../services/notifications";
import { createRazorpayRefund } from "@/lib/razorpay";
import { ActionResponse } from "@/actions/seller-register.action";

export interface SubmitReturnInput {
  orderId: string;
  reason: ReturnReason;
  comment?: string;
  refundMethod: RefundMethod;
  items: { orderItemId: string; quantity: number }[];
  evidence: { url: string; type: EvidenceType; cloudinaryPublicId?: string; mimeType?: string; fileSize?: number }[];
}

/**
 * Server action to submit a return request.
 */
export async function submitReturnRequestAction(
  input: SubmitReturnInput
): Promise<ActionResponse<{ returnRequestId: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in." } };
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "User profile not found." } };
    }

    const { orderId, reason, comment, refundMethod, items, evidence } = input;

    // 1. Policy Eligibility Validation
    const eligibility = await ReturnPolicyService.validateReturnEligibility(orderId);
    if (!eligibility.eligible) {
      return { success: false, error: { code: "INELIGIBLE", message: eligibility.reason || "Return policy validation failed." } };
    }

    // 2. Fetch Order and items to verify details and calculate total return value
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return { success: false, error: { code: "NOT_FOUND", message: "Order not found." } };
    }

    if (order.buyerId !== userProfile.id) {
      return { success: false, error: { code: "FORBIDDEN", message: "You do not own this order." } };
    }

    // Calculate total refund amount from selected items
    let refundAmount = 0;
    const returnItemsData: { orderItemId: string; quantity: number }[] = [];

    for (const itemInput of items) {
      const orderItem = order.items.find((i) => i.id === itemInput.orderItemId);
      if (!orderItem) {
        return { success: false, error: { code: "INVALID_ITEM", message: `Item ${itemInput.orderItemId} is not in this order.` } };
      }
      if (itemInput.quantity <= 0 || itemInput.quantity > orderItem.quantity) {
        return { success: false, error: { code: "INVALID_QUANTITY", message: `Invalid return quantity for item ${orderItem.id}.` } };
      }
      refundAmount += orderItem.unitPrice * itemInput.quantity;
      returnItemsData.push({
        orderItemId: itemInput.orderItemId,
        quantity: itemInput.quantity,
      });
    }

    if (refundAmount === 0) {
      return { success: false, error: { code: "INVALID_REFUND", message: "Refund amount cannot be zero." } };
    }

    // 3. Dynamic Abuse Score Calculation
    const abuseScore = await calculateAbuseScore(userProfile.id);

    // 4. Submit return request in transaction
    const returnRequest = await prisma.$transaction(async (tx) => {
      // Create return request
      const request = await tx.returnRequest.create({
        data: {
          orderId,
          buyerId: userProfile.id,
          status: ReturnRequestStatus.RETURN_REQUESTED,
          reason,
          comment,
          refundMethod,
          refundAmount,
          policyVersion: eligibility.policyVersion,
          policyEligibleUntil: eligibility.eligibleUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          items: {
            create: returnItemsData,
          },
          evidence: {
            create: evidence.map((e) => ({
              url: e.url,
              type: e.type,
              cloudinaryPublicId: e.cloudinaryPublicId,
              mimeType: e.mimeType,
              fileSize: e.fileSize,
            })),
          },
          statusHistory: {
            create: {
              previousStatus: ReturnRequestStatus.RETURN_REQUESTED,
              newStatus: ReturnRequestStatus.RETURN_REQUESTED,
              actorId: userProfile.id,
              actorRole: "BUYER",
              comment: comment || "Return requested by buyer",
            },
          },
        },
      });

      // Update buyer statistics
      await tx.userProfile.update({
        where: { id: userProfile.id },
        data: {
          returnCount: { increment: 1 },
          abuseScore, // Sync calculated score
        },
      });

      return request;
    });

    // 5. Async notifications
    await NotificationService.notifyBuyer(returnRequest.id, "submitted");
    await NotificationService.notifySeller(returnRequest.id, "submitted");

    return {
      success: true,
      data: { returnRequestId: returnRequest.id },
    };
  } catch (err: any) {
    console.error("[submitReturnRequestAction error]:", err);
    return { success: false, error: { code: "INTERNAL_ERROR", message: err.message || "Failed to submit return request." } };
  }
}

export interface UpdateReturnStatusInput {
  returnRequestId: string;
  status: ReturnRequestStatus;
  comment?: string;
  pickupCourier?: string;
  pickupTrackingId?: string;
  pickupDate?: Date;
  inspectionNotes?: string;
  inspectionResult?: InspectionResult;
  restockDecision?: boolean;
}

/**
 * Server action to update a return request status through the state machine.
 */
export async function updateReturnRequestStatusAction(
  input: UpdateReturnStatusInput
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in." } };
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: { seller: true },
    });

    if (!userProfile) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "User profile not found." } };
    }

    const { returnRequestId, status, comment, pickupCourier, pickupTrackingId, pickupDate, inspectionNotes, inspectionResult, restockDecision } = input;

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: { order: true },
    });

    if (!returnRequest) {
      return { success: false, error: { code: "NOT_FOUND", message: "Return request not found." } };
    }

    const currentStatus = returnRequest.status;

    // 1. Role Authorization and State Transitions Guard
    ReturnStateMachine.validateTransition(currentStatus, status);

    const isSeller = userProfile.role === "SELLER" && userProfile.seller?.id === returnRequest.order.sellerId;
    const isAdmin = userProfile.role === "ADMIN";
    const isBuyer = userProfile.id === returnRequest.buyerId;

    if (!isSeller && !isAdmin && !isBuyer) {
      return { success: false, error: { code: "FORBIDDEN", message: "You are not authorized to update this return." } };
    }

    // Role-specific constraints
    if (status === ReturnRequestStatus.APPROVED || status === ReturnRequestStatus.REJECTED) {
      if (!isSeller && !isAdmin) {
        return { success: false, error: { code: "FORBIDDEN", message: "Only sellers or administrators can approve/reject return requests." } };
      }
    }

    if (status === ReturnRequestStatus.CANCELLED) {
      if (!isBuyer && !isAdmin) {
        return { success: false, error: { code: "FORBIDDEN", message: "Only buyers or administrators can cancel return requests." } };
      }
    }

    // 2. Perform DB Updates
    await prisma.$transaction(async (tx) => {
      // Build data updates payload
      const updateData: any = {
        status,
      };

      if (pickupCourier) updateData.pickupCourier = pickupCourier;
      if (pickupTrackingId) updateData.pickupTrackingId = pickupTrackingId;
      if (pickupDate) updateData.pickupDate = pickupDate;
      if (inspectionNotes) updateData.inspectionNotes = inspectionNotes;
      if (inspectionResult) updateData.inspectionResult = inspectionResult;
      if (restockDecision !== undefined) updateData.restockDecision = restockDecision;

      // Update ReturnRequest
      await tx.returnRequest.update({
        where: { id: returnRequestId },
        data: updateData,
      });

      // Log status history
      await tx.returnStatusHistory.create({
        data: {
          returnRequestId,
          previousStatus: currentStatus,
          newStatus: status,
          actorId: userProfile.id,
          actorRole: userProfile.role,
          comment: comment || `Status transitioned to ${status}`,
        },
      });

      // Update counters based on final transitions
      if (status === ReturnRequestStatus.REJECTED) {
        await tx.userProfile.update({
          where: { id: returnRequest.buyerId },
          data: {
            disputeCount: { increment: 1 }, // Rejected returns raise dispute count
          },
        });
      }
    });

    // 3. Post-Transition Operations
    // A. Restock decision execution
    if (status === ReturnRequestStatus.REFUND_APPROVED) {
      if (restockDecision) {
        await RestockService.processRestocking(returnRequestId);
      }
      
      // B. Razorpay Refund processing trigger
      await triggerRefundExecution(returnRequestId, userProfile.id);
    }

    // C. Dynamic notifications
    await NotificationService.notifyBuyer(returnRequestId, status.toLowerCase());
    if (status === ReturnRequestStatus.DELIVERED_TO_SELLER) {
      await NotificationService.notifySeller(returnRequestId, "received");
    }

    return {
      success: true,
      data: { success: true },
    };
  } catch (err: any) {
    console.error("[updateReturnRequestStatusAction error]:", err);
    return { success: false, error: { code: "INTERNAL_ERROR", message: err.message || "Failed to update return status." } };
  }
}

/**
 * Server action for administrative overrides.
 */
export async function adminOverrideReturnRequestAction(
  returnRequestId: string,
  targetStatus: ReturnRequestStatus,
  comment?: string
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in." } };
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile || userProfile.role !== "ADMIN") {
      return { success: false, error: { code: "FORBIDDEN", message: "Access restricted to administrators." } };
    }

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: { order: true },
    });

    if (!returnRequest) {
      return { success: false, error: { code: "NOT_FOUND", message: "Return request not found." } };
    }

    const currentStatus = returnRequest.status;

    await prisma.$transaction(async (tx) => {
      // Force status update in return request
      await tx.returnRequest.update({
        where: { id: returnRequestId },
        data: {
          status: targetStatus,
        },
      });

      // Record administrative audit trail entry
      await tx.returnStatusHistory.create({
        data: {
          returnRequestId,
          previousStatus: currentStatus,
          newStatus: targetStatus,
          actorId: userProfile.id,
          actorRole: "ADMIN",
          comment: comment || `Administrative override to ${targetStatus}`,
        },
      });
    });

    if (targetStatus === ReturnRequestStatus.REFUND_APPROVED) {
      await triggerRefundExecution(returnRequestId, userProfile.id);
    }

    await NotificationService.notifyBuyer(returnRequestId, `admin_${targetStatus.toLowerCase()}`);

    return {
      success: true,
      data: { success: true },
    };
  } catch (err: any) {
    console.error("[adminOverrideReturnRequestAction error]:", err);
    return { success: false, error: { code: "INTERNAL_ERROR", message: err.message || "Failed admin override." } };
  }
}

/**
 * Triggers actual payment refund processing on Razorpay.
 */
async function triggerRefundExecution(returnRequestId: string, actorId: string): Promise<void> {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnRequestId },
    include: { order: true },
  });

  if (!returnRequest || !returnRequest.order.razorpayPaymentId) {
    throw new Error("Cannot trigger payment refund: No razorpayPaymentId found for this order.");
  }

  const order = returnRequest.order;

  try {
    // 1. Create matching Refund ledger entry
    const ledger = await prisma.refund.create({
      data: {
        returnRequestId,
        razorpayPaymentId: order.razorpayPaymentId!,
        amount: returnRequest.refundAmount,
        status: "initiated",
        reason: returnRequest.reason,
        createdBy: actorId,
      },
    });

    // 2. Invoke Razorpay Refund API
    const response = await createRazorpayRefund(order.razorpayPaymentId!, returnRequest.refundAmount);

    // 3. Update ledger entry and move status to REFUND_PROCESSING
    await prisma.$transaction(async (tx) => {
      await tx.refund.update({
        where: { id: ledger.id },
        data: {
          razorpayRefundId: response.id,
          status: response.status === "processed" ? "processed" : "initiated",
          processedAt: response.status === "processed" ? new Date() : null,
        },
      });

      // Update request status to REFUND_PROCESSING
      await tx.returnRequest.update({
        where: { id: returnRequestId },
        data: {
          status: ReturnRequestStatus.REFUND_PROCESSING,
        },
      });

      // If already processed in Razorpay (e.g. instant refund or mock mode), transition to complete immediately
      if (response.status === "processed") {
        await tx.returnRequest.update({
          where: { id: returnRequestId },
          data: {
            status: ReturnRequestStatus.RETURN_COMPLETED,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "cancelled", // escrow released / completed refund state
          },
        });

        await tx.userProfile.update({
          where: { id: returnRequest.buyerId },
          data: {
            refundCount: { increment: 1 },
          },
        });
      }
    });
  } catch (err: any) {
    console.error("[triggerRefundExecution error]:", err);
    await NotificationService.notifyAdmin(returnRequestId, `Razorpay refund initiation failed: ${err.message}`);
    throw err;
  }
}
