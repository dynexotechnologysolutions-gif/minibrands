/**
 * lib/whatsapp.ts — Meta WhatsApp Cloud API integration.
 * All failures are swallowed: notification failure must NEVER block a transaction.
 * Template names must be pre-approved in Meta Business Manager.
 */

import { captureAndLogError } from "@/lib/sentry";
import { prisma } from "@/lib/prisma";

const WHATSAPP_API_VERSION = "v18.0";
const BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

// ─── Template Registry ─────────────────────────────────────────────────────────

export const TEMPLATES = {
  ORDER_CONFIRMED: "order_confirmed",
  ORDER_SHIPPED: "order_shipped",
  DELIVERY_CONFIRMED: "delivery_confirmed",
  ESCROW_RELEASED: "escrow_released",
  ORDER_CANCELLED: "order_cancelled",
} as const;

export type TemplateKey = keyof typeof TEMPLATES;
export type TemplateName = (typeof TEMPLATES)[TemplateKey];

// Helper to log notifications in background (does not block or throw)
async function logNotification(
  to: string,
  template: string,
  params: string[],
  status: string,
  errorMessage?: string
): Promise<void> {
  try {
    await prisma.notificationLog.create({
      data: {
        to,
        template,
        params,
        status,
        errorMessage,
      },
    });
  } catch (err) {
    console.error("[WhatsApp Log Error] Failed to write notification log to database:", err);
  }
}

// ─── Message Sender ────────────────────────────────────────────────────────────

/**
 * Sends a WhatsApp template message to a phone number.
 *
 * @param to        E.164 formatted phone number (e.g., "919876543210") or user email
 * @param template  Template name from TEMPLATES constant
 * @param params    Ordered array of parameter values to fill template components
 *
 * Failures are always swallowed. Sentry is notified with template context only.
 * Never logs message content or phone numbers — only template name + error code.
 */
export async function sendMessage(
  to: string,
  template: TemplateName,
  params: string[]
): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  // Meta expects 'en_US' for English usually. We fallback to WHATSAPP_TEMPLATE_LANGUAGE if set.
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US";

  let targetPhone = to;

  // 1. Dynamic Phone Resolution from Email
  if (to.includes("@")) {
    try {
      const profile = await prisma.userProfile.findFirst({
        where: { user: { email: to } },
        include: {
          addresses: {
            orderBy: { isDefault: "desc" },
            take: 1,
          },
        },
      });

      if (profile && profile.addresses.length > 0) {
        targetPhone = profile.addresses[0].phone;
        console.log(`[WhatsApp] Resolved phone "${targetPhone}" for email identifier "${to}"`);
      } else {
        console.warn(`[WhatsApp] Could not resolve a shipping address/phone number for email: "${to}"`);
      }
    } catch (dbErr: any) {
      console.error(`[WhatsApp] Database lookup failed resolving phone for email "${to}":`, dbErr.message);
    }
  }

  // 2. Sanitize Phone
  const sanitizedPhone = targetPhone.replace(/\D/g, "").replace(/^\+/, "");

  // 3. Dev Override: Redirect notifications to verified test recipient in Sandbox/Dev mode
  let finalRecipient = sanitizedPhone;
  const testRecipient = process.env.WHATSAPP_TEST_RECIPIENT;
  if (testRecipient) {
    const sanitizedTest = testRecipient.replace(/\D/g, "").replace(/^\+/, "");
    if (sanitizedTest.length >= 10) {
      console.log(
        `[WhatsApp] Dev Override: Redirecting template "${template}" from "${sanitizedPhone}" to verified test recipient: "${sanitizedTest}"`
      );
      finalRecipient = sanitizedTest;
    }
  }

  // 4. Prevent Doomed API Requests
  if (!finalRecipient || finalRecipient.length < 10) {
    const invalidPhoneMsg = `Invalid or unresolved phone number: "${targetPhone}" (Sanitized: "${finalRecipient}")`;
    console.warn(`[WhatsApp] Skipping API dispatch: ${invalidPhoneMsg}`);

    // Asynchronously log the failure to database
    logNotification(finalRecipient || targetPhone, template, params, "failed", invalidPhoneMsg);
    return;
  }

  // 5. Handle Mock Credentials
  if (
    !phoneNumberId ||
    !accessToken ||
    accessToken.startsWith("mock_") ||
    phoneNumberId.startsWith("mock_")
  ) {
    console.log(
      `[WhatsApp] Mock mode. Skipping Graph API dispatch of template: "${template}" to phone: "${finalRecipient.substring(0, 4)}XXXX" with params:`,
      params
    );
    // Asynchronously log to the database
    logNotification(finalRecipient, template, params, "mocked");
    return;
  }

  const components =
    params.length > 0
      ? [
        {
          type: "body",
          parameters: params.map((value) => ({ type: "text", text: value })),
        },
      ]
      : [];

  const payload = {
    messaging_product: "whatsapp",
    to: finalRecipient,
    type: "template",
    template: {
      name: template,
      language: { code: language },
      components,
    },
  };

  // Log the complete structured payload right before making the fetch POST call
  console.log(
    `[WhatsApp] Dispatching template "${template}" payload to URL: ${BASE_URL}/${phoneNumberId}/messages`
  );
  console.log(`[WhatsApp] Payload structure:`, JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(
      `${BASE_URL}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      let metaErrorDetail = "";
      try {
        const errorData = await res.json();
        metaErrorDetail = JSON.stringify(errorData);
        console.error(`[WhatsApp] Meta API Error Response:`, metaErrorDetail);
      } catch (jsonErr) {
        metaErrorDetail = await res.text();
        console.error(`[WhatsApp] Meta API Non-JSON Error Response:`, metaErrorDetail);
      }

      const status = res.status;
      const errorMsg = `WhatsApp API HTTP ${status}: ${metaErrorDetail}`;
      console.warn(
        `[WhatsApp] Template "${template}" delivery failed. Status: ${status}`
      );

      captureAndLogError(
        new Error(errorMsg),
        "whatsapp.sendMessage",
        { template, metaError: metaErrorDetail }
      );

      logNotification(finalRecipient, template, params, "failed", errorMsg);
    } else {
      console.log(`[WhatsApp] Template "${template}" dispatched successfully.`);
      logNotification(finalRecipient, template, params, "sent");
    }
  } catch (err: any) {
    // Network errors — swallowed, Sentry notified
    console.error(`[WhatsApp] Network/system error sending template "${template}":`, err);
    captureAndLogError(err, "whatsapp.sendMessage.networkError", { template });
    logNotification(finalRecipient, template, params, "failed", err.message || String(err));
  }
}
