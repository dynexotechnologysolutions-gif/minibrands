import { prisma } from "@/lib/prisma";
import { ReturnRequestStatus, PayoutStatus } from "@prisma/client";

export interface PayoutEligibilityResult {
  eligible: boolean;
  reason?: string;
  sellerAmount?: number;
  fundAccountId?: string;
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

/**
 * Authoritative server-side payout eligibility validator.
 * Enforces all business rules before seller payout creation.
 */
export async function checkPayoutEligibility(
  orderId: string
): Promise<PayoutEligibilityResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      seller: {
        include: { verification: true },
      },
      returnRequest: true,
      payout: true,
    },
  });

  if (!order) {
    return { eligible: false, reason: "Order not found." };
  }

  // 1. Order status must be 'delivered'
  if (order.status !== "delivered") {
    return {
      eligible: false,
      reason: `Order status is '${order.status}'. Only 'delivered' orders are eligible for payout release.`,
    };
  }

  // 2. Buyer payment must be paid
  if (order.paymentStatus !== "paid") {
    return { eligible: false, reason: "Order payment has not been captured and verified as paid." };
  }

  // 3. Authoritative return window countdown check (based on deliveredAt or escrowReleaseAt)
  const now = new Date();
  const deliveryTime = order.deliveredAt
    ? new Date(order.deliveredAt).getTime()
    : order.escrowReleaseAt
    ? new Date(order.escrowReleaseAt).getTime() - 7 * 24 * 60 * 60 * 1000
    : null;

  if (!deliveryTime) {
    return { eligible: false, reason: "Delivery date has not been recorded for this order." };
  }

  const escrowReleaseTime = order.escrowReleaseAt
    ? new Date(order.escrowReleaseAt).getTime()
    : deliveryTime + 7 * 24 * 60 * 60 * 1000;

  if (now.getTime() < escrowReleaseTime) {
    return {
      eligible: false,
      reason: `Return period is active until ${new Date(escrowReleaseTime).toISOString()}.`,
    };
  }

  // 4. Seller verification and RazorpayX Fund Account check
  const seller = order.seller;
  if (!seller) {
    return { eligible: false, reason: "Associated seller not found." };
  }

  const bankVerified = seller.verification?.bankVerified === true;
  if (!bankVerified) {
    return { eligible: false, reason: `Seller '${seller.businessName}' has not completed bank verification.` };
  }

  if (!seller.razorpayFundAccountId) {
    return {
      eligible: false,
      reason: `Seller '${seller.businessName}' does not have a verified RazorpayX Fund Account ID.`,
    };
  }

  // 5. Active return/refund check
  if (order.returnRequest && ACTIVE_RETURN_STATUSES.includes(order.returnRequest.status)) {
    return {
      eligible: false,
      reason: `Order has an active return request with status '${order.returnRequest.status}'.`,
    };
  }

  // 6. Existing payout ledger check (Idempotency)
  if (order.payout) {
    if (order.payout.status === PayoutStatus.SUCCESS) {
      return { eligible: false, reason: "Payout for this order has already been successfully completed." };
    }
    if (order.payout.status === PayoutStatus.PROCESSING) {
      return { eligible: false, reason: "Payout for this order is currently processing." };
    }
  }

  // 7. Seller net payable amount calculation
  const sellerAmount = order.totalAmount - order.commissionAmount;
  if (sellerAmount <= 0) {
    return {
      eligible: false,
      reason: `Invalid seller payout amount: ₹${(sellerAmount / 100).toFixed(2)}. Net payable must be positive.`,
    };
  }

  return {
    eligible: true,
    sellerAmount,
    fundAccountId: seller.razorpayFundAccountId,
  };
}
