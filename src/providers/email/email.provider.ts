export type EmailCategory = "AUTH" | "TRANSACTIONAL" | "SYSTEM" | "NOTIFICATION" | "MARKETING";

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  category: EmailCategory;
  attachments?: EmailAttachment[];
}

export interface EmailProvider {
  send(options: EmailSendOptions): Promise<{ messageId: string }>;
  verify(): Promise<boolean>;
}
