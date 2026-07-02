import { prisma } from "@/lib/prisma";

/**
 * Calculates a dynamic abuse score for a buyer based on historical returns, refunds, and rejections.
 * Range: 0.0 (Perfect) to 1.0 (High Risk).
 */
export async function calculateAbuseScore(buyerId: string): Promise<number> {
  const profile = await prisma.userProfile.findUnique({
    where: { id: buyerId },
    include: {
      orders: {
        where: {
          status: { in: ["delivered", "completed", "cancelled"] },
        },
      },
    },
  });

  if (!profile) return 0.0;

  const totalOrders = profile.orders.length;
  if (totalOrders === 0) return 0.0;

  const returns = await prisma.returnRequest.findMany({
    where: { buyerId },
  });

  const totalReturnsCount = returns.length;
  if (totalReturnsCount === 0) return 0.0;

  // Weightings for risk categories
  const rejectedReturns = returns.filter((r) => r.status === "REJECTED").length;
  const disputedReturns = returns.filter((r) => r.status === "DISPUTED" || r.status === "ESCALATED").length;

  const baseReturnRate = totalReturnsCount / totalOrders; // e.g., 2 returns / 5 orders = 0.4
  const rejectionPenalty = (rejectedReturns * 0.15); // penalize rejected fraudulent returns
  const disputePenalty = (disputedReturns * 0.2); // penalize escalated returns

  const score = baseReturnRate + rejectionPenalty + disputePenalty;
  
  // Clamp score between 0.0 and 1.0
  return Math.min(Math.max(score, 0.0), 1.0);
}
