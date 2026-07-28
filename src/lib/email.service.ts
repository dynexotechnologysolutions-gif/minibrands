import { prisma } from "./prisma";
import { EmailProvider, EmailSendOptions } from "../providers/email/email.provider";
import { SMTPProvider } from "../providers/email/smtp.provider";
import { MockEmailProvider } from "../providers/email/mock.provider";
import { validateEmailConfig } from "../providers/email/config";
import * as Sentry from "@sentry/nextjs";

export class EmailService {
  private static providerInstance: EmailProvider | null = null;

  private static getProvider(): EmailProvider {
    if (!this.providerInstance) {
      // Validate configuration at startup
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
    
    // 1. Create audit log in PENDING state
    let auditLog;
    try {
      auditLog = await prisma.emailAuditLog.create({
        data: {
          recipient: options.to,
          subject: options.subject,
          category: options.category,
          status: "PENDING",
          attempts: 1,
        },
      });
    } catch (dbError) {
      console.error("[EmailService] Failed to create EmailAuditLog entry:", dbError);
      Sentry.captureException(dbError);
    }

    try {
      // 2. Perform the async send via Provider
      const result = await provider.send(options);

      // 3. Update Audit Log to SENT
      if (auditLog) {
        await prisma.emailAuditLog.update({
          where: { id: auditLog.id },
          data: {
            status: "SENT",
            errorLog: `MessageId: ${result.messageId}`,
          },
        });
      }
      return true;
    } catch (error: any) {
      console.error(`[EmailService] Failed to send email to ${options.to}:`, error);
      Sentry.captureException(error);

      // 4. Update Audit Log to FAILED
      if (auditLog) {
        try {
          await prisma.emailAuditLog.update({
            where: { id: auditLog.id },
            data: {
              status: "FAILED",
              errorLog: error.message || String(error),
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
    const founderEmail = process.env.FOUNDER_EMAIL || "hello@velvetlane.in";
    const html = renderAdminAlertEmail({ subject, body });

    return this.send({
      to: founderEmail,
      subject: `[Velvet Alert] ${subject}`,
      html,
      category: "SYSTEM",
    });
  }
}
