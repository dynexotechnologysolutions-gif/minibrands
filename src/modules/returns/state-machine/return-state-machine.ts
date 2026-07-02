import { ReturnRequestStatus } from "@prisma/client";

// transition map mapping each current state to its allowed list of target states
export const ALLOWED_TRANSITIONS: Record<ReturnRequestStatus, ReturnRequestStatus[]> = {
  RETURN_REQUESTED: ["SELLER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"],
  SELLER_REVIEW: ["APPROVED", "REJECTED", "DISPUTED", "CANCELLED"],
  APPROVED: ["PICKUP_SCHEDULED", "CANCELLED", "DISPUTED"],
  PICKUP_SCHEDULED: ["PICKED_UP", "DISPUTED", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "DISPUTED"],
  IN_TRANSIT: ["DELIVERED_TO_SELLER", "DISPUTED"],
  DELIVERED_TO_SELLER: ["UNDER_INSPECTION", "DISPUTED"],
  UNDER_INSPECTION: ["REFUND_APPROVED", "REJECTED", "DISPUTED"],
  REFUND_APPROVED: ["REFUND_PROCESSING", "REFUNDED", "RETURN_COMPLETED", "ESCALATED"],
  REFUND_PROCESSING: ["REFUNDED", "RETURN_COMPLETED", "ESCALATED"],
  REFUNDED: ["RETURN_COMPLETED"],
  RETURN_COMPLETED: [],
  REJECTED: ["DISPUTED", "CANCELLED"],
  CANCELLED: [],
  DISPUTED: ["ADMIN_REVIEW" as ReturnRequestStatus, "REFUND_APPROVED", "REJECTED", "ESCALATED"],
  ESCALATED: ["REFUND_APPROVED", "REJECTED", "RETURN_COMPLETED"],
};

export class ReturnStateMachine {
  /**
   * Asserts if a transition from previous status to new status is allowed.
   * Throws Error if transition is invalid.
   */
  static validateTransition(
    currentStatus: ReturnRequestStatus,
    newStatus: ReturnRequestStatus
  ): void {
    if (currentStatus === newStatus) return; // No-op for same status

    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    
    // Support custom string casting for ADMIN_REVIEW if needed, otherwise normal enum equality
    const isAllowed = allowed.includes(newStatus) || 
                      (newStatus.toString() === "ADMIN_REVIEW" && allowed.some(a => a.toString() === "ADMIN_REVIEW"));

    if (!isAllowed) {
      throw new Error(`Invalid RMA transition: Cannot move ReturnRequest from ${currentStatus} to ${newStatus}.`);
    }
  }
}
