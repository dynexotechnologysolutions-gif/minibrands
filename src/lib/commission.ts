/**
 * Calculates the marketplace commission fee for Velvet Lane.
 * Uses a flat rate of 8% of the total amount.
 * Returns the commission in paise (INR smallest unit), rounded to the nearest integer.
 */
export function calculateCommission(totalAmount: number): number {
  if (totalAmount <= 0) return 0;
  const COMMISSION_RATE = 0.08; // 8% flat rate
  return Math.round(totalAmount * COMMISSION_RATE);
}
