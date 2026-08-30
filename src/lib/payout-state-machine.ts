import { PayoutStatus } from "@prisma/client";

/**
 * Normalizes raw RazorpayX Payout API / Webhook status strings into internal PayoutStatus enum.
 */
export function normalizeRazorpayXStatus(rawStatus: string | null | undefined): PayoutStatus {
  if (!rawStatus) return PayoutStatus.PROCESSING;
  const s = rawStatus.trim().toLowerCase();

  switch (s) {
    case "processed":
      return PayoutStatus.SUCCESS;
    case "queued":
    case "pending":
    case "processing":
    case "initiated":
      return PayoutStatus.PROCESSING;
    case "rejected":
    case "failed":
    case "cancelled":
      return PayoutStatus.FAILED;
    case "reversed":
      return PayoutStatus.REVERSED;
    default:
      return PayoutStatus.PROCESSING;
  }
}

const ALLOWED_TRANSITIONS: Record<PayoutStatus, PayoutStatus[]> = {
  PENDING: [PayoutStatus.PENDING, PayoutStatus.PROCESSING, PayoutStatus.FAILED],
  PROCESSING: [PayoutStatus.PROCESSING, PayoutStatus.SUCCESS, PayoutStatus.FAILED, PayoutStatus.REVERSED],
  SUCCESS: [PayoutStatus.SUCCESS, PayoutStatus.REVERSED],
  FAILED: [PayoutStatus.FAILED, PayoutStatus.PROCESSING], // Controlled retry
  REVERSED: [PayoutStatus.REVERSED],
};

/**
 * Validates whether a transition from currentStatus to targetStatus is allowed.
 * Throws an Error if the transition is invalid.
 */
export function validatePayoutTransition(currentStatus: PayoutStatus, targetStatus: PayoutStatus): boolean {
  if (currentStatus === targetStatus) return true;

  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw new Error(
      `Invalid Payout State Transition: Cannot move from '${currentStatus}' to '${targetStatus}'.`
    );
  }
  return true;
}
