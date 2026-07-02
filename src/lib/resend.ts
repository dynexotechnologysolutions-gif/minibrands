/**
 * lib/resend.ts — Resend email wrapper for founder/ops alerts.
 * Used for critical system events (escrow failure, NDR, weight dispute).
 * Never throws — failures are silently logged to Sentry.
 */

import { Resend } from "resend";
import { captureAndLogError } from "@/lib/sentry";

const FOUNDER_EMAIL = process.env.FOUNDER_EMAIL ?? "hello@velvetlane.in";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "alerts@velvetlane.in";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * Sends an operational alert email to the founder.
 * Silently no-ops when RESEND_API_KEY is absent (dev/sandbox mode).
 * Never rethrows.
 *
 * @param subject  Email subject line
 * @param bodyHtml HTML body of the email
 */
export async function sendFounderAlert(
  subject: string,
  bodyHtml: string
): Promise<void> {
  const client = getResendClient();

  if (!client) {
    console.log(`[Resend] RESEND_API_KEY missing. Skipping founder alert: "${subject}"`);
    return;
  }

  try {
    const result = await client.emails.send({
      from: FROM_EMAIL,
      to: FOUNDER_EMAIL,
      subject: `[Velvet Alert] ${subject}`,
      html: bodyHtml,
    });

    if (result.error) {
      console.warn(`[Resend] Founder alert failed: ${result.error.message}`);
      captureAndLogError(
        new Error(result.error.message),
        "resend.sendFounderAlert",
        { subject }
      );
    } else {
      console.log(`[Resend] Founder alert sent: "${subject}" → ${FOUNDER_EMAIL}`);
    }
  } catch (err: any) {
    console.warn(`[Resend] Network error sending alert "${subject}": ${err.message}`);
    captureAndLogError(err, "resend.sendFounderAlert.networkError", { subject });
  }
}
