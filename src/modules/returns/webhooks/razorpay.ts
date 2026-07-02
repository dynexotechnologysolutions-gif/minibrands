import { prisma } from "@/lib/prisma";
import { ReturnRequestStatus } from "@prisma/client";
import { NotificationService } from "../services/notifications";

/**
 * Handles incoming Razorpay refund webhook events.
 */
export async function handleRefundWebhook(
  eventType: "refund.processed" | "refund.failed",
  payload: any
): Promise<void> {
  const refundEntity = payload?.entity;
  if (!refundEntity) {
    console.warn("[Razorpay Refund Webhook] Missing entity in webhook payload.");
    return;
  }

  const razorpayRefundId = refundEntity.id;
  const paymentId = refundEntity.payment_id;

  // Find associated Refund record
  const refund = await prisma.refund.findUnique({
    where: { razorpayRefundId },
    include: {
      returnRequest: true,
    },
  });

  if (!refund) {
    console.warn(`[Razorpay Refund Webhook] No ledger record found for refund ID: ${razorpayRefundId}`);
    return;
  }

  const returnRequestId = refund.returnRequestId;

  if (eventType === "refund.processed") {
    console.log(`[Razorpay Refund Webhook] Processing refund.processed for return request: ${returnRequestId}`);

    await prisma.$transaction(async (tx) => {
      // 1. Update Refund Ledger
      await tx.refund.update({
        where: { id: refund.id },
        status: "processed",
        processedAt: new Date(),
        webhookReceivedAt: new Date(),
      });

      // 2. Update Return Request Status to RETURN_COMPLETED
      await tx.returnRequest.update({
        where: { id: returnRequestId },
        data: {
          status: ReturnRequestStatus.RETURN_COMPLETED,
        },
      });

      // 3. Log Status History
      await tx.returnStatusHistory.create({
        data: {
          returnRequestId,
          previousStatus: refund.returnRequest.status,
          newStatus: ReturnRequestStatus.RETURN_COMPLETED,
          actorId: "RAZORPAY_WEBHOOK",
          actorRole: "SYSTEM",
          comment: "Refund completed successfully via Razorpay webhook.",
        },
      });

      // 4. Update Order Status to completed (releasing escrow / closing order)
      await tx.order.update({
        where: { id: refund.returnRequest.orderId },
        data: {
          status: "cancelled", // escrow released / completed refund state
        },
      });

      // 5. Increment user refund stats
      await tx.userProfile.update({
        where: { id: refund.returnRequest.buyerId },
        data: {
          refundCount: { increment: 1 },
        },
      });
    });

    await NotificationService.notifyBuyer(returnRequestId, "refunded");
    console.log(`[NOTIFICATION_EVENT] RETURN_REFUNDED: {"returnRequestId": "${returnRequestId}", "refundId": "${razorpayRefundId}"}`);
  } else if (eventType === "refund.failed") {
    const failureReason = refundEntity.failure_reason || "Unknown Razorpay error";
    console.warn(`[Razorpay Refund Webhook] Refund failed for return request: ${returnRequestId}. Reason: ${failureReason}`);

    await prisma.$transaction(async (tx) => {
      // 1. Update Refund Ledger
      await tx.refund.update({
        where: { id: refund.id },
        status: "failed",
        failedAt: new Date(),
        webhookReceivedAt: new Date(),
        failureReason,
      });

      // 2. Transition Return Request to ESCALATED
      await tx.returnRequest.update({
        where: { id: returnRequestId },
        data: {
          status: ReturnRequestStatus.ESCALATED,
        },
      });

      // 3. Log History
      await tx.returnStatusHistory.create({
        data: {
          returnRequestId,
          previousStatus: refund.returnRequest.status,
          newStatus: ReturnRequestStatus.ESCALATED,
          actorId: "RAZORPAY_WEBHOOK",
          actorRole: "SYSTEM",
          comment: `Refund failed via Razorpay webhook: ${failureReason}`,
        },
      });
    });

    await NotificationService.notifyAdmin(returnRequestId, `Razorpay refund failed: ${failureReason}`);
  }
}
