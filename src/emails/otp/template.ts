import { getBaseLayout } from "../layout";

interface OTPTemplateOptions {
  name?: string;
  code: string;
  expiresInMinutes?: number;
}

export function renderOTPEmail({ name, code, expiresInMinutes = 5 }: OTPTemplateOptions): string {
  const greeting = name ? `Hi ${name},` : "Hello,";
  const content = `
    <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Verify Your Email Address</h2>
    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px;">${greeting} Thank you for using Velvet Lane. Please use the verification code below to complete your sign-in / verification:</p>
    
    <!-- Code Box -->
    <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
      <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; display: inline-block;">${code}</span>
    </div>
    
    <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">This code will expire in <strong>${expiresInMinutes} minutes</strong>. If you did not request this code, please ignore this email.</p>
  `;

  return getBaseLayout("Verify Your Email Address", content);
}
