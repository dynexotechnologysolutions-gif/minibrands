/**
 * lib/escrow-release.ts — Authoritative escrow release engine.
 * Called by Vercel Cron at /api/cron/escrow-release.
 * Processes all delivered orders whose return window has passed.
 *
 * Flow:
 *  1. Query delivered candidate orders.
 *  2. Check server-side payout eligibility (deliveredAt, return active, bank verified, etc).
 *  3. In atomic DB transaction (race protection):
 *     - Re-check return request status.
 *     - Create or fetch Payout record in status PENDING -> PROCESSING with deterministic idempotencyKey = "payout_{orderId}".
 *  4. Call RazorpayX Payouts API with X-Payout-Idempotency header matching idempotencyKey.
 *  5. Normalize RazorpayX response status via PayoutStateMachine:
 *     - SUCCESS: Payout.status = SUCCESS, Order.status = completed, Order.razorpayPayoutId = payoutId.
 *     - PROCESSING: Payout.status = PROCESSING. Order stays delivered (wait for webhook reconciliation).
 *     - FAILED: Payout.status = FAILED, increment retryCount, failureReason logged. Order stays delivered for retry.
 */

import { prisma } from "@/lib/prisma";
import { createPayout } from "@/lib/razorpay-payouts";
import { checkPayoutEligibility } from "@/lib/payout-eligibility";
import { normalizeRazorpayXStatus, validatePayoutTransition } from "@/lib/payout-state-machine";
import { captureAndLogError } from "@/lib/sentry";
import { EmailService } from "@/lib/email.service";
import { sendMessage, TEMPLATES } from "@/lib/whatsapp";
import { PayoutStatus, ReturnRequestStatus } from "@prisma/client";

export interface EscrowReleaseResult {
  processed: number;
  succeeded: number;
  processing: number;
  failed: number;
  skippedIneligible: number;
}

const ACTIVE_RETURN_STATUSES: ReturnRequestStatus[] = [
  ReturnRequestStatus.RETURN_REQUESTED,
  ReturnRequestStatus.SELLER_REVIEW,
  ReturnRequestStatus.APPROVED,
  ReturnRequestStatus.PICKUP_SCHEDULED,
  ReturnRequestStatus.PICKED_UP,
  ReturnRequestStatus.IN_TRANSIT,
  ReturnRequestStatus.DELIVERED_TO_SELLER,
  ReturnRequestStatus.UNDER_INSPECTION,
  ReturnRequestStatus.REFUND_APPROVED,
  ReturnRequestStatus.REFUND_PROCESSING,
  ReturnRequestStatus.REFUNDED,
  ReturnRequestStatus.RETURN_COMPLETED,
  ReturnRequestStatus.ESCALATED,
  ReturnRequestStatus.DISPUTED,
];

export async function runEscrowRelease(): Promise<EscrowReleaseResult> {
  const now = new Date();
  const result: EscrowReleaseResult = {
    processed: 0,
    succeeded: 0,
    processing: 0,
    failed: 0,
    skippedIneligible: 0,
  };

  // Find candidate delivered orders
  const candidateOrders = await prisma.order.findMany({
    where: {
      status: "delivered",
      escrowReleaseAt: {
        lte: now,
        not: null,
      },
    },
    include: {
      seller: {
        include: {
          userProfile: { include: { user: true } },
        },
      },
      buyer: { include: { user: true } },
      payout: true,
      returnRequest: true,
    },
  });

  console.log(`[EscrowRelease] Found ${candidateOrders.length} candidate delivered orders at ${now.toISOString()}`);

  for (const order of candidateOrders) {
    result.processed++;

    // ── 1. Validate Eligibility ────────────────────────────────────────────────
    const eligibility = await checkPayoutEligibility(order.id);
    if (!eligibility.eligible || !eligibility.sellerAmount || !eligibility.fundAccountId) {
      result.skippedIneligible++;
      console.log(`[EscrowRelease] Skipping Order ${order.id}: ${eligibility.reason}`);
      continue;
    }

    const sellerAmount = eligibility.sellerAmount;
    const fundAccountId = eligibility.fundAccountId;
    const idempotencyKey = `payout_${order.id}`;

    // ── 2. Atomic Transaction: Race protection & Payout Ledger Initialization ──
    let payoutRecord: any;
    try {
      payoutRecord = await prisma.$transaction(async (tx) => {
        // Re-query order & return request inside transaction to lock against concurrent return filing
        const freshOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: { returnRequest: true, payout: true },
        });

        if (!freshOrder || freshOrder.status !== "delivered") {
          throw new Error("RACE_CANCELLED: Order status changed.");
        }

        if (freshOrder.returnRequest && ACTIVE_RETURN_STATUSES.includes(freshOrder.returnRequest.status)) {
          throw new Error(`RACE_CANCELLED: Return request '${freshOrder.returnRequest.status}' filed.`);
        }

        let existingPayout = freshOrder.payout;

        if (existingPayout) {
          if (existingPayout.status === PayoutStatus.SUCCESS) {
            throw new Error("RACE_CANCELLED: Payout already succeeded.");
          }
          if (existingPayout.status === PayoutStatus.PROCESSING) {
            throw new Error("RACE_CANCELLED: Payout is currently processing.");
          }

          // If previously FAILED, validate controlled retry transition FAILED -> PROCESSING
          validatePayoutTransition(existingPayout.status, PayoutStatus.PROCESSING);

          return await tx.payout.update({
            where: { id: existingPayout.id },
            data: {
              status: PayoutStatus.PROCESSING,
              initiatedAt: new Date(),
              retryCount: { increment: 1 },
              failureReason: null,
            },
          });
        }

        // Create new Payout record with deterministic idempotencyKey
        return await tx.payout.create({
          data: {
            orderId: order.id,
            sellerId: order.sellerId,
            amount: sellerAmount,
            currency: "INR",
            fundAccountId,
            status: PayoutStatus.PROCESSING,
            idempotencyKey,
            initiatedAt: new Date(),
          },
        });
      });
    } catch (raceErr: any) {
      if (raceErr.message?.startsWith("RACE_CANCELLED")) {
        result.skippedIneligible++;
        console.warn(`[EscrowRelease] ${raceErr.message} for Order ${order.id}`);
        continue;
      }
      result.failed++;
      console.error(`[EscrowRelease] Transaction failed for Order ${order.id}:`, raceErr.message);
      continue;
    }

    // ── 3. Call RazorpayX Payouts API ──────────────────────────────────────────
    try {
      const payoutResult = await createPayout({
        fundAccountId,
        amount: sellerAmount,
        currency: "INR",
        mode: "IMPS",
        purpose: "payout",
        narration: `MiniBrands Order ${order.id.slice(0, 8)}`,
        idempotencyKey,
      });

      const normalizedStatus = normalizeRazorpayXStatus(payoutResult.status);

      if (normalizedStatus === PayoutStatus.SUCCESS) {
        // Payout completed instantly (or in mock mode)
        await prisma.$transaction(async (tx) => {
          await tx.payout.update({
            where: { id: payoutRecord.id },
            data: {
              status: PayoutStatus.SUCCESS,
              razorpayPayoutId: payoutResult.id,
              utr: payoutResult.utr || null,
              processedAt: new Date(),
            },
          });

          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "completed",
              orderStatus: "completed",
              razorpayPayoutId: payoutResult.id,
            },
          });
        });

        result.succeeded++;
        console.log(`[EscrowRelease] Order ${order.id} payout SUCCESS: ${payoutResult.id}`);

        // Notify seller via WhatsApp
        const formattedAmount = `₹${(sellerAmount / 100).toFixed(2)}`;
        void sendMessage(
          order.seller.userProfile.user.email,
          TEMPLATES.ESCROW_RELEASED,
          [order.seller.businessName, formattedAmount, order.id.slice(0, 8)]
        );
      } else {
        // Payout accepted and processing in RazorpayX (queued/pending/processing)
        await prisma.payout.update({
          where: { id: payoutRecord.id },
          data: {
            status: PayoutStatus.PROCESSING,
            razorpayPayoutId: payoutResult.id,
            utr: payoutResult.utr || null,
          },
        });

        result.processing++;
        console.log(`[EscrowRelease] Order ${order.id} payout PROCESSING: ${payoutResult.id}. Waiting for webhook reconciliation.`);
      }
    } catch (payoutErr: any) {
      result.failed++;
      console.error(`[EscrowRelease] Payout API error for Order ${order.id}:`, payoutErr.message);

      // Record failure on Payout ledger
      await prisma.payout.update({
        where: { id: payoutRecord.id },
        data: {
          status: PayoutStatus.FAILED,
          failedAt: new Date(),
          failureReason: payoutErr.message || "RazorpayX API request failed",
        },
      });

      captureAndLogError(payoutErr, "escrowRelease.payoutFailed", {
        orderId: order.id,
        sellerId: order.seller.id,
        idempotencyKey,
      });

      await EmailService.sendAlert(
        `RazorpayX Payout FAILED for Order ${order.id.slice(0, 8)}`,
        `<p><strong>Order ID:</strong> ${order.id}</p>
         <p><strong>Seller:</strong> ${order.seller.businessName}</p>
         <p><strong>Amount:</strong> ₹${(sellerAmount / 100).toFixed(2)}</p>
         <p><strong>Error:</strong> ${payoutErr.message}</p>
         <p>Payout ledger updated to <code>FAILED</code>. Order remains in <code>delivered</code> for controlled retry.</p>`
      );
    }
  }

  console.log(
    `[EscrowRelease] Run complete. Processed: ${result.processed}, Succeeded: ${result.succeeded}, Processing: ${result.processing}, Failed: ${result.failed}, Skipped: ${result.skippedIneligible}`
  );

  return result;
}
