import { prisma } from "./prisma";
import crypto from "crypto";

export class GuestOrderService {
  /**
   * Generates a 32-byte cryptographically secure random token (hex string).
   */
  static generateGuestToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Hashes a raw token with SHA-256 for secure database matching.
   */
  static hashGuestToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  /**
   * Transactionally claims eligible guest orders matching a verified email.
   * Expiry check is verified server-side (30 days from creation).
   * Idempotency is enforced: if an order is already claimed by the user, it skips or succeeds.
   * If a different user attempts to claim, it blocks.
   */
  static async claimGuestOrders(
    verifiedEmail: string,
    userProfileId: string
  ): Promise<{ success: boolean; claimedCount: number; error?: string }> {
    const normalizedEmail = verifiedEmail.toLowerCase().trim();

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Fetch eligible guest orders
        const eligibleOrders = await tx.order.findMany({
          where: {
            guestEmail: normalizedEmail,
            buyerId: null,
            guestTokenExpiresAt: {
              gt: new Date(),
            },
          },
        });

        if (eligibleOrders.length === 0) {
          return { success: true, claimedCount: 0 };
        }

        // 2. Associate each order
        for (const order of eligibleOrders) {
          await tx.order.update({
            where: { id: order.id },
            data: {
              buyerId: userProfileId,
              guestClaimedAt: new Date(),
            },
          });
        }

        return { success: true, claimedCount: eligibleOrders.length };
      }, {
        maxWait: 10000,
        timeout: 20000,
      });

      return result;
    } catch (error: any) {
      console.error("[GuestOrderService.claimGuestOrders ERROR]", error);
      return { success: false, claimedCount: 0, error: error.message || "Failed to claim orders." };
    }
  }
}
