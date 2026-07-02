/**
 * lib/escrow-release.ts — Automated escrow release engine.
 * Called by the Vercel Cron route at /api/cron/escrow-release.
 * Processes all delivered orders with escrowReleaseAt in the past
 * and no existing razorpayPayoutId.
 *
 * Error strategy:
 * - Missing fundAccountId → Sentry + Resend alert, skip order, continue.
 * - Razorpay payout failure → Sentry + Resend alert, order stays in delivered, will retry next run.
 * - DB update failure → Sentry, continue processing remaining orders.
 */

import { prisma } from "@/lib/prisma";
import { createPayout } from "@/lib/razorpay-payouts";
import { captureAndLogError } from "@/lib/sentry";
import { sendFounderAlert } from "@/lib/resend";
import { sendMessage, TEMPLATES } from "@/lib/whatsapp";

export interface EscrowReleaseResult {
  processed: number;
  succeeded: number;
  failed: number;
  skippedNoFundAccount: number;
}

/**
 * Main escrow release runner.
 * Finds all delivered orders whose escrow window has passed and no payout exists.
 * Processes them sequentially to avoid race conditions.
 */
export async function runEscrowRelease(): Promise<EscrowReleaseResult> {
  const now = new Date();
  const result: EscrowReleaseResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skippedNoFundAccount: 0,
  };

  // Find all eligible orders
  const eligibleOrders = await prisma.order.findMany({
    where: {
      status: "delivered",
      razorpayPayoutId: null,
      escrowReleaseAt: {
        lte: now,
        not: null,
      },
    },
    include: {
      seller: {
        include: {
          userProfile: {
            include: { user: true },
          },
        },
      },
      buyer: {
        include: { user: true },
      },
    },
  });

  console.log(`[EscrowRelease] Found ${eligibleOrders.length} eligible orders at ${now.toISOString()}`);

  for (const order of eligibleOrders) {
    result.processed++;

    // ── Guard: Seller fund account must exist ──────────────────────────────────
    if (!order.seller.razorpayFundAccountId) {
      result.skippedNoFundAccount++;
      const msg = `Order ${order.id} skipped: seller ${order.seller.id} has no razorpayFundAccountId`;
      console.warn(`[EscrowRelease] ${msg}`);

      captureAndLogError(
        new Error(msg),
        "escrowRelease.missingFundAccount",
        { orderId: order.id, sellerId: order.seller.id }
      );

      await sendFounderAlert(
        `Escrow blocked — seller fund account missing`,
        `<p><strong>Order ID:</strong> ${order.id}</p>
         <p><strong>Seller ID:</strong> ${order.seller.id}</p>
         <p><strong>Business Name:</strong> ${order.seller.businessName}</p>
         <p><strong>Amount:</strong> ₹${((order.totalAmount - order.commissionAmount) / 100).toFixed(2)}</p>
         <p>The seller has not linked a verified bank account. Please reach out to them immediately.</p>`
      );

      continue;
    }

    // ── Calculate seller payout amount ─────────────────────────────────────────
    const sellerAmount = order.totalAmount - order.commissionAmount;

    if (sellerAmount <= 0) {
      result.failed++;
      const msg = `Order ${order.id} has invalid sellerAmount: ${sellerAmount}. totalAmount=${order.totalAmount}, commission=${order.commissionAmount}`;
      console.error(`[EscrowRelease] ${msg}`);
      captureAndLogError(new Error(msg), "escrowRelease.invalidAmount", { orderId: order.id });
      continue;
    }

    // ── Create Razorpay Payout ─────────────────────────────────────────────────
    let payoutId: string;
    try {
      const payout = await createPayout({
        fundAccountId: order.seller.razorpayFundAccountId,
        amount: sellerAmount,
        currency: "INR",
        mode: "IMPS",
        purpose: "payout",
        narration: `Velvet Lane Order ${order.id.slice(0, 8)}`,
      });

      payoutId = payout.id;
      console.log(`[EscrowRelease] Payout created: ${payoutId} for Order ${order.id}`);
    } catch (payoutErr: any) {
      result.failed++;
      console.error(`[EscrowRelease] Payout failed for Order ${order.id}:`, payoutErr.message);

      captureAndLogError(payoutErr, "escrowRelease.payoutFailed", {
        orderId: order.id,
        sellerId: order.seller.id,
        sellerAmount,
      });

      await sendFounderAlert(
        `Razorpay Payout FAILED for Order ${order.id.slice(0, 8)}`,
        `<p><strong>Order ID:</strong> ${order.id}</p>
         <p><strong>Seller:</strong> ${order.seller.businessName}</p>
         <p><strong>Amount:</strong> ₹${(sellerAmount / 100).toFixed(2)}</p>
         <p><strong>Error:</strong> ${payoutErr.message}</p>
         <p>Order remains in <code>delivered</code> status. Will retry on next cron run.</p>`
      );

      continue; // Do NOT update order — retry next cron run
    }

    // ── Atomic DB Update: delivered → completed + payoutId ────────────────────
    try {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "completed",
            orderStatus: "completed",
            razorpayPayoutId: payoutId,
          },
        });
      });

      result.succeeded++;
      console.log(`[EscrowRelease] Order ${order.id} → completed. Payout: ${payoutId}`);

      // ── WhatsApp notifications — non-blocking ────────────────────────────────
      const sellerPhone = order.seller.userProfile.user.name; // phone stored in user.name fallback
      const buyerName = order.buyer.user.name?.split(" ")[0] ?? "Customer";
      const formattedAmount = `₹${(sellerAmount / 100).toFixed(2)}`;

      // Notify seller
      void sendMessage(
        order.seller.userProfile.user.email, // used as fallback identifier
        TEMPLATES.ESCROW_RELEASED,
        [order.seller.businessName, formattedAmount, order.id.slice(0, 8)]
      );
    } catch (dbErr: any) {
      result.failed++;
      console.error(`[EscrowRelease] DB update failed for Order ${order.id} after payout ${payoutId}:`, dbErr.message);

      captureAndLogError(dbErr, "escrowRelease.dbUpdateFailed.CRITICAL", {
        orderId: order.id,
        payoutId,
        note: "CRITICAL: Payout succeeded but DB not updated. Manual intervention required.",
      });

      await sendFounderAlert(
        `CRITICAL: Payout succeeded but DB update FAILED for Order ${order.id.slice(0, 8)}`,
        `<p><strong>Order ID:</strong> ${order.id}</p>
         <p><strong>Payout ID:</strong> ${payoutId}</p>
         <p><strong>Error:</strong> ${dbErr.message}</p>
         <p style="color:red;"><strong>CRITICAL: Manual database update required immediately.</strong></p>`
      );
    }
  }

  console.log(
    `[EscrowRelease] Run complete. Processed: ${result.processed}, Succeeded: ${result.succeeded}, Failed: ${result.failed}, Skipped (no fund account): ${result.skippedNoFundAccount}`
  );

  return result;
}
