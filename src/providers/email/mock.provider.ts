import { EmailProvider, EmailSendOptions, EmailSendResult } from "./email.provider";

export class MockEmailProvider implements EmailProvider {
  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    console.log("=========================================");
    console.log(`[MOCK EMAIL SANDBOX]`);
    console.log(`To:      ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Category: ${options.category}`);
    console.log(`Body Length: ${options.html.length} chars`);
    if (options.text) {
      console.log(`Plain Text Alternative Length: ${options.text.length} chars`);
    }
    if (options.replyTo) {
      console.log(`Reply-To: ${options.replyTo}`);
    }
    if (options.correlationId) {
      console.log(`Correlation ID: ${options.correlationId}`);
    }
    if (options.attachments && options.attachments.length > 0) {
      console.log(`Attachments: ${options.attachments.map(a => a.filename).join(", ")}`);
    }
    console.log("=========================================");
    
    const messageId = `mock-msg-${Date.now()}`;
    return {
      messageId,
      accepted: [options.to],
      rejected: [],
      response: "250 2.0.0 OK (mock sandbox)",
      envelope: {
        from: "sandbox@minibrands.in",
        to: [options.to],
      },
    };
  }

  async verify(): Promise<boolean> {
    return true;
  }
}
