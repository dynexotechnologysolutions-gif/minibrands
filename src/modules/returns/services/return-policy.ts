import { prisma } from "@/lib/prisma";

export interface ReturnPolicyResult {
  eligible: boolean;
  reason?: string;
  eligibleUntil?: Date;
  policyVersion: string;
}

export class ReturnPolicyService {
  static POLICY_VERSION = "2026-RMA-v1";
  static RETURN_WINDOW_DAYS = 7;

  /**
   * Validates if a delivered order is eligible for returns under current platform rules.
   */
  static async validateReturnEligibility(orderId: string): Promise<ReturnPolicyResult> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        returnRequest: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return { eligible: false, reason: "Order not found.", policyVersion: this.POLICY_VERSION };
    }

    // 1. Check existing returns
    if (order.returnRequest) {
      return { eligible: false, reason: "A return request has already been submitted for this order.", policyVersion: this.POLICY_VERSION };
    }

    // 2. Check Order Status is delivered or completed (or disputed from legacy flow)
    const validStatuses = ["delivered", "completed", "disputed"];
    if (!validStatuses.includes(order.status)) {
      return { eligible: false, reason: `Only delivered or completed orders can be returned. Current status: ${order.status}`, policyVersion: this.POLICY_VERSION };
    }

    // 3. Check Return Window (7 days from Order creation as a safe approximation or from escrow release)
    const orderDate = new Date(order.createdAt).getTime();
    const elapsedMs = Date.now() - orderDate;
    const limitMs = this.RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const eligibleUntil = new Date(orderDate + limitMs);

    if (elapsedMs > limitMs) {
      return { eligible: false, reason: "The 7-day return window for this order has expired.", policyVersion: this.POLICY_VERSION };
    }

    // 4. Check category/product exclusions
    for (const item of order.items) {
      const category = item.product.category.toLowerCase();
      // Final sale / hygiene item category checks
      if (["hygiene", "final_sale", "digital"].includes(category)) {
        return {
          eligible: false,
          reason: `Item "${item.product.name}" belongs to category "${item.product.category}" which is non-returnable.`,
          policyVersion: this.POLICY_VERSION,
        };
      }
    }

    return {
      eligible: true,
      eligibleUntil,
      policyVersion: this.POLICY_VERSION,
    };
  }
}
