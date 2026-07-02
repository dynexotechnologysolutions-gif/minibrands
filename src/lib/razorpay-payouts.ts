/**
 * lib/razorpay-payouts.ts — Razorpay Payouts API integration.
 * Separate from lib/razorpay.ts (Orders API) — uses different auth scheme.
 * Auth: Basic Auth with account_number:key_secret (X-Razorpay-Account header).
 * Do NOT import from this file in lib/razorpay.ts.
 */

const RAZORPAY_PAYOUTS_API = "https://api.razorpay.com/v1/payouts";

export interface CreatePayoutParams {
  fundAccountId: string;
  amount: number; // in paise
  currency: string;
  mode: "IMPS" | "NEFT" | "RTGS" | "UPI";
  purpose: string;
  narration: string;
}

export interface PayoutResult {
  id: string;
  status: string;
  amount: number;
  currency: string;
}

/**
 * Creates a Razorpay payout to a seller's verified fund account.
 * In test/mock mode, returns a simulated payout response.
 * In production, POST to Razorpay /v1/payouts with Basic Auth.
 */
export async function createPayout(params: CreatePayoutParams): Promise<PayoutResult> {
  const accountNumber = process.env.RAZORPAY_PAYOUT_ACCOUNT_NUMBER;
  const keySecret = process.env.RAZORPAY_PAYOUT_KEY_SECRET;

  const isMock =
    process.env.NODE_ENV === "test" ||
    !accountNumber ||
    accountNumber.includes("mock") ||
    !keySecret;

  if (isMock) {
    console.log(
      `[MOCK RAZORPAY PAYOUTS] Creating payout to fund_account: ${params.fundAccountId}, amount: ${params.amount} paise`
    );
    return {
      id: `pout_mock_${Math.random().toString(36).substring(2, 14)}`,
      status: "processing",
      amount: params.amount,
      currency: params.currency,
    };
  }

  // Razorpay Payouts API uses Basic Auth: key_id:key_secret
  // For Payouts, key_id is the account number (RazorpayX)
  const authHeader = Buffer.from(`${accountNumber}:${keySecret}`).toString("base64");

  const body = {
    account_number: accountNumber,
    fund_account_id: params.fundAccountId,
    amount: params.amount,
    currency: params.currency,
    mode: params.mode,
    purpose: params.purpose,
    queue_if_low_balance: true,
    reference_id: `velvet_payout_${Date.now()}`,
    narration: params.narration,
  };

  const res = await fetch(RAZORPAY_PAYOUTS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${authHeader}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Razorpay Payouts API failed: ${res.status} — ${errorText}`
    );
  }

  const data = await res.json();

  return {
    id: data.id,
    status: data.status,
    amount: data.amount,
    currency: data.currency,
  };
}
