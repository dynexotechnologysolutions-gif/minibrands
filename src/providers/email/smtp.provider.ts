import nodemailer from "nodemailer";
import { EmailProvider, EmailSendOptions } from "./email.provider";

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

  async send(options: EmailSendOptions): Promise<{ messageId: string }> {
    const info = await this.transporter.sendMail({
      from: process.env.SMTP_FROM || "Velvet Lane <onboarding@resend.dev>",
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    return { messageId: info.messageId };
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
