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
  text?: string;
  replyTo?: string;
  correlationId?: string;
  category: EmailCategory;
  attachments?: EmailAttachment[];
}

export interface EmailSendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  pending?: string[];
  response: string;
  envelope: {
    from: string;
    to: string[];
  };
  envelopeTime?: number;
  messageTime?: number;
  messageSize?: number;
}

export interface EmailProvider {
  send(options: EmailSendOptions): Promise<EmailSendResult>;
  verify(): Promise<boolean>;
}
