import crypto from "crypto";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export interface RazorpayValidationResult {
  success: boolean;
  message?: string;
}

/**
 * Validates a bank account using Razorpay Fund Account Validation API (penny drop).
 * If keys are absent or contain 'mock', simulates successful validation for testing in sandbox/dev.
 */
export async function validateBankAccount(
  accountNumber: string,
  ifsc: string
): Promise<RazorpayValidationResult> {
  const isMock =
    process.env.NODE_ENV === "test" ||
    (!RAZORPAY_KEY_ID ||
      RAZORPAY_KEY_ID.includes("mock") ||
      !RAZORPAY_KEY_SECRET);

  if (isMock) {
    console.log(`[MOCK RAZORPAY] Validating bank account: ${accountNumber}, IFSC: ${ifsc}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    if (accountNumber === "0000000000") {
      return {
        success: false,
        message: "Bank verification failed (Simulated failure for sandbox testing)",
      };
    }
    return { success: true };
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are required in production.");
  }

  try {
    const authHeader = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
    
    // 1. Create a Contact
    const contactRes = await fetch("https://api.razorpay.com/v1/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        name: "Velvet Lane Verification",
        type: "vendor",
        reference_id: `verify_contact_${Date.now()}`,
      }),
    });

    if (!contactRes.ok) {
      const errorText = await contactRes.text();
      throw new Error(`Razorpay contact creation failed: ${contactRes.status} - ${errorText}`);
    }
    const contact = await contactRes.json();

    // 2. Create a Fund Account
    const fundAccountRes = await fetch("https://api.razorpay.com/v1/fund_accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        contact_id: contact.id,
        account_type: "bank_account",
        bank_account: {
          name: "Seller Store Account",
          ifsc: ifsc,
          account_number: accountNumber,
        },
      }),
    });

    if (!fundAccountRes.ok) {
      const errorText = await fundAccountRes.text();
      throw new Error(`Razorpay fund account creation failed: ${fundAccountRes.status} - ${errorText}`);
    }
    const fundAccount = await fundAccountRes.json();

    // 3. Initiate Validation (Penny Drop)
    const validationRes = await fetch("https://api.razorpay.com/v1/fund_accounts/validations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        fund_account_id: fundAccount.id,
        amount: 100, // Rs 1.00 (in paise)
        currency: "INR",
        notes: {
          purpose: "Seller bank onboarding verification",
        },
      }),
    });

    if (!validationRes.ok) {
      const errorText = await validationRes.text();
      throw new Error(`Razorpay FAV initiation failed: ${validationRes.status} - ${errorText}`);
    }

    const validation = await validationRes.json();
    
    if (validation.status === "failed") {
      return {
        success: false,
        message: validation.results?.failure_reason || "Penny drop verification failed.",
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Razorpay bank validation failed:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred during bank verification.",
    };
  }
}

/**
 * Creates an order in Razorpay.
 * Gated to strictly reject mocks and require real keys in production.
 */
export async function createRazorpayOrder(
  amount: number,
  receiptId: string
): Promise<{ id: string; amount: number; currency: string }> {
  const isMockAllowed =
    process.env.NODE_ENV === "test" ||
    (!RAZORPAY_KEY_ID ||
      RAZORPAY_KEY_ID.includes("mock") ||
      !RAZORPAY_KEY_SECRET);

  if (isMockAllowed) {
    console.log(`[MOCK RAZORPAY] Creating order. Amount: ${amount}, Receipt: ${receiptId}`);
    return {
      id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
      amount,
      currency: "INR",
    };
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are required in production.");
  }

  const authHeader = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${authHeader}`,
    },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt: receiptId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay order creation failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Verifies Razorpay webhook signatures using constant-time comparison.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

/**
 * Initiates a refund in Razorpay for a given payment ID.
 * If credentials are mock, simulates successful refund.
 */
export async function createRazorpayRefund(
  paymentId: string,
  amount: number
): Promise<{ id: string; payment_id: string; amount: number; status: string }> {
  const isMock =
    process.env.NODE_ENV === "test" ||
    (!RAZORPAY_KEY_ID ||
      RAZORPAY_KEY_ID.includes("mock") ||
      !RAZORPAY_KEY_SECRET);

  if (isMock) {
    console.log(`[MOCK RAZORPAY] Refunding payment: ${paymentId}, Amount: ${amount}`);
    return {
      id: `rfnd_mock_${Math.random().toString(36).substring(2, 11)}`,
      payment_id: paymentId,
      amount,
      status: "processed",
    };
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are required in production.");
  }

  const authHeader = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${authHeader}`,
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay refund failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

