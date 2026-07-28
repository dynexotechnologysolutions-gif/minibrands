import { EmailProvider, EmailSendOptions } from "./email.provider";

export class MockEmailProvider implements EmailProvider {
  async send(options: EmailSendOptions): Promise<{ messageId: string }> {
    console.log("=========================================");
    console.log(`[MOCK EMAIL SANDBOX]`);
    console.log(`To:      ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Category: ${options.category}`);
    console.log(`Body Length: ${options.html.length} chars`);
    if (options.attachments && options.attachments.length > 0) {
      console.log(`Attachments: ${options.attachments.map(a => a.filename).join(", ")}`);
    }
    console.log("=========================================");
    return { messageId: `mock-msg-${Date.now()}` };
  }

  async verify(): Promise<boolean> {
    return true;
  }
}
