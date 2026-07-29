import { prisma } from "./prisma";
import { EmailProvider, EmailSendOptions } from "../providers/email/email.provider";
import { SMTPProvider } from "../providers/email/smtp.provider";
import { MockEmailProvider } from "../providers/email/mock.provider";
import { validateEmailConfig } from "../providers/email/config";
import * as Sentry from "@sentry/nextjs";
import crypto from "crypto";

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export class EmailService {
  private static providerInstance: EmailProvider | null = null;

  private static getProvider(): EmailProvider {
    if (!this.providerInstance) {
      validateEmailConfig();

      if (process.env.USE_SMTP_TRANSPORT === "true") {
        console.log("[EmailService] Initializing SMTP Transport Provider.");
        this.providerInstance = new SMTPProvider();
      } else {
        console.log("[EmailService] Initializing Mock Sandbox Email Provider.");
        this.providerInstance = new MockEmailProvider();
      }
    }
    return this.providerInstance;
  }

  static async send(options: EmailSendOptions): Promise<boolean> {
    const provider = this.getProvider();
    const requestId = crypto.randomUUID();
    const correlationId = options.correlationId || crypto.randomUUID();
    options.correlationId = correlationId;

    if (!options.text) {
      options.text = stripHtml(options.html);
    }
    if (!options.replyTo) {
      options.replyTo = "support@minibrands.in";
    }

    const providerName = process.env.USE_SMTP_TRANSPORT === "true" ? "SMTP" : "Mock";
    const transportType = process.env.USE_SMTP_TRANSPORT === "true" ? "smtp" : "console";

    let auditLog;
    try {
      auditLog = await prisma.emailAuditLog.create({
        data: {
          id: requestId,
          recipient: options.to,
          subject: options.subject,
          category: options.category,
          status: "PENDING",
          attempts: 1,
          provider: providerName,
          transport: transportType,
        },
      });
    } catch (dbError) {
      console.error("[EmailService] Failed to create EmailAuditLog entry:", dbError);
      Sentry.captureException(dbError);
    }

    const startTime = performance.now();
    try {
      const result = await provider.send(options);
      const latency = Math.round(performance.now() - startTime);

      const isDelivered = result.accepted.includes(options.to) && !result.rejected.includes(options.to);

      if (auditLog) {
        await prisma.emailAuditLog.update({
          where: { id: auditLog.id },
          data: {
            status: isDelivered ? "SENT" : "FAILED",
            accepted: result.accepted,
            rejected: result.rejected,
            smtpResponse: result.response,
            latency,
            messageId: result.messageId,
            providerResponse: JSON.stringify(result),
          },
        });
      }
      return isDelivered;
    } catch (error: any) {
      const latency = Math.round(performance.now() - startTime);
      console.error(`[EmailService] Failed to send email to ${options.to}:`, error);
      Sentry.captureException(error);

      if (auditLog) {
        try {
          await prisma.emailAuditLog.update({
            where: { id: auditLog.id },
            data: {
              status: "FAILED",
              errorLog: error.message || String(error),
              latency,
            },
          });
        } catch (updateError) {
          console.error("[EmailService] Failed to update failed audit log:", updateError);
        }
      }
      return false;
    }
  }

  static async sendOTP(
    email: string,
    otp: string,
    type: "forget-password" | "sign-in" | "email-verification" | "change-email"
  ): Promise<boolean> {
    const { renderOTPEmail } = await import("../emails/otp/template");
    const { renderPasswordResetEmail } = await import("../emails/password-reset/template");

    const subject = type === "forget-password" ? "Your Password Reset Code" : "Your Verification Code";
    const html = type === "forget-password" 
      ? renderPasswordResetEmail({ code: otp })
      : renderOTPEmail({ code: otp });

    return this.send({
      to: email,
      subject,
      html,
      category: "AUTH",
    });
  }

  static async sendAlert(subject: string, body: string): Promise<boolean> {
    const { renderAdminAlertEmail } = await import("../emails/admin-alert/template");
    const founderEmail = process.env.FOUNDER_EMAIL || "hello@MiniBrands.in";
    const html = renderAdminAlertEmail({ subject, body });

    return this.send({
      to: founderEmail,
      subject: `[Velvet Alert] ${subject}`,
      html,
      category: "SYSTEM",
    });
  }
}
