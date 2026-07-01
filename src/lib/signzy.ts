import crypto from "crypto";

const SIGNZY_API_KEY = process.env.SIGNZY_API_KEY || "mock_signzy_api_key";
const SIGNZY_BASE_URL = process.env.SIGNZY_BASE_URL || "https://preproduction.signzy.tech/api/v2";
const WEBHOOK_SECRET = process.env.SIGNZY_WEBHOOK_SECRET || "mock_signzy_webhook_secret";

export interface KycSessionResult {
  referenceId: string;
  redirectUrl: string;
}

/**
 * Initiates a Signzy hosted KYC session.
 * For sandbox/testing: if configuration is mock, it returns a simulated URL pointing back to our app.
 */
export async function initiateKycSession(sellerId: string): Promise<KycSessionResult> {
  const referenceId = `signzy_ref_${crypto.randomBytes(8).toString("hex")}`;
  
  // Base hosted URL redirect (mocking if not using a real live Signzy endpoint)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const mockRedirectUrl = `${appUrl}/api/webhooks/signzy/mock-redirect?referenceId=${referenceId}&sellerId=${sellerId}`;

  // If real API key is configured, perform actual integration call
  if (process.env.SIGNZY_API_KEY && process.env.SIGNZY_API_KEY !== "mock_signzy_api_key") {
    try {
      const response = await fetch(`${SIGNZY_BASE_URL}/patrons/kyc-sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: SIGNZY_API_KEY,
        },
        body: JSON.stringify({
          callbackUrl: `${appUrl}/api/webhooks/signzy`,
          sellerId,
          referenceId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Signzy API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        referenceId: data.referenceId || referenceId,
        redirectUrl: data.redirectUrl || mockRedirectUrl,
      };
    } catch (error) {
      console.error("Failed to call Signzy API, falling back to mock sandbox:", error);
    }
  }

  // Sandbox fallback simulation
  return {
    referenceId,
    redirectUrl: mockRedirectUrl,
  };
}

/**
 * Verifies the Signzy webhook signature.
 * Uses timing-safe constant-time comparison.
 */
export function verifySignzyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  hmac.update(rawBody);
  const digest = hmac.digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, "utf-8"),
      Buffer.from(signature, "utf-8")
    );
  } catch {
    return false;
  }
}
