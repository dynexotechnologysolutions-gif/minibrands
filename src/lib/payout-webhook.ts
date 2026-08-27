import { prisma } from "@/lib/prisma";
import { normalizeRazorpayXStatus, validatePayoutTransition } from "@/lib/payout-state-machine";
import { PayoutStatus } from "@prisma/client";
import { EmailService } from "@/lib/email.service";

/**
 * Handles incoming RazorpayX payout webhook events:
 * - payout.processed
 * - payout.failed
 * - payout.reversed
 * - payout.updated
 */
export async function handlePayoutWebhook(eventType: string, payload: any): Promise<void> {
  const payoutEntity = payload?.entity;
  if (!payoutEntity) {
    console.warn("[RazorpayX Webhook] Missing payout entity in webhook payload.");
    return;
  }

  const razorpayPayoutId = payoutEntity.id;
  const referenceId = payoutEntity.reference_id;
  const utr = payoutEntity.utr || null;
  const rawStatus = payoutEntity.status;

  // Find Payout record by razorpayPayoutId or idempotencyKey reference_id
  const payout = await prisma.payout.findFirst({
    where: {
      OR: [
        { razorpayPayoutId: razorpayPayoutId },
        { idempotencyKey: referenceId },
      ],
    },
    include: { order: true, seller: true },
  });

  if (!payout) {
    console.warn(`[RazorpayX Webhook] No Payout record found for payout ID '${razorpayPayoutId}' or ref '${referenceId}'.`);
    return;
  }

  const targetStatus = normalizeRazorpayXStatus(rawStatus || eventType);

  // Validate state transition
  try {
    validatePayoutTransition(payout.status, targetStatus);
  } catch (transitionErr: any) {
    console.warn(`[RazorpayX Webhook] ${transitionErr.message} Ignoring duplicate/out-of-order event.`);
    return;
  }

  if (targetStatus === PayoutStatus.SUCCESS) {
    console.log(`[RazorpayX Webhook] Reconciling payout SUCCESS for Payout ${payout.id}, Order ${payout.orderId}`);

    await prisma.$transaction(async (tx) => {
      await tx.payout.update({
        where: { id: payout.id },
        data: {
          status: PayoutStatus.SUCCESS,
          razorpayPayoutId,
          utr,
          processedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: payout.orderId },
        data: {
          status: "completed",
          orderStatus: "completed",
          razorpayPayoutId,
        },
      });
    });
  } else if (targetStatus === PayoutStatus.FAILED) {
    const failureReason = payoutEntity.failure_reason || "Payout failed in RazorpayX";
    console.warn(`[RazorpayX Webhook] Reconciling payout FAILED for Payout ${payout.id}. Reason: ${failureReason}`);

    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: PayoutStatus.FAILED,
        razorpayPayoutId,
        failureReason,
        failedAt: new Date(),
      },
    });

    await EmailService.sendAlert(
      `RazorpayX Webhook: Payout FAILED for Order ${payout.orderId.slice(0, 8)}`,
      `<p><strong>Order ID:</strong> ${payout.orderId}</p>
       <p><strong>Seller:</strong> ${payout.seller.businessName}</p>
       <p><strong>Reason:</strong> ${failureReason}</p>
       <p>Order remains in <code>delivered</code> status for controlled retry.</p>`
    );
  } else if (targetStatus === PayoutStatus.REVERSED) {
    const failureReason = payoutEntity.failure_reason || "Payout reversed by beneficiary bank";
    console.warn(`[RazorpayX Webhook] Reconciling payout REVERSED for Payout ${payout.id}. Reason: ${failureReason}`);

    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: PayoutStatus.REVERSED,
        razorpayPayoutId,
        failureReason,
        reversedAt: new Date(),
      },
    });

    await EmailService.sendAlert(
      `CRITICAL: RazorpayX Payout REVERSED for Order ${payout.orderId.slice(0, 8)}`,
      `<p><strong>Order ID:</strong> ${payout.orderId}</p>
       <p><strong>Seller:</strong> ${payout.seller.businessName}</p>
       <p><strong>Reason:</strong> ${failureReason}</p>
       <p style="color:red;"><strong>Manual investigation required.</strong></p>`
    );
  } else {
    // Status is PROCESSING
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        razorpayPayoutId,
        utr: utr || payout.utr,
      },
    });
  }
}
