import nodemailer from "nodemailer";
import { EmailProvider, EmailSendOptions, EmailSendResult } from "./email.provider";

export class SMTPProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      pool: true,
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      connectionTimeout: 5000,
      socketTimeout: 5000,
    });
  }

  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    const headers: Record<string, string> = {};
    if (options.correlationId) {
      headers["X-Correlation-ID"] = options.correlationId;
    }

    const startTime = performance.now();
    const info = await this.transporter.sendMail({
      from: process.env.SMTP_FROM || "MiniBrands <onboarding@resend.dev>",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      headers,
      attachments: options.attachments,
    });
    const messageTime = Math.round(performance.now() - startTime);
    const messageSize = Buffer.byteLength(options.html + (options.text || "") + options.subject);

    return {
      messageId: info.messageId,
      accepted: info.accepted as string[],
      rejected: info.rejected as string[],
      pending: info.pending as string[],
      response: info.response,
      envelope: {
        from: info.envelope.from,
        to: info.envelope.to as string[],
      },
      messageTime,
      messageSize,
    };
  }

  async verify(): Promise<boolean> {
    try {
      return await this.transporter.verify();
    } catch (error) {
      console.error("SMTP connection verification failed:", error);
      return false;
    }
  }
}
