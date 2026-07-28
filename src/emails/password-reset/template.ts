import { getBaseLayout } from "../layout";

interface PasswordResetTemplateOptions {
  name?: string;
  resetUrl?: string;
  code?: string;
  expiresInMinutes?: number;
}

export function renderPasswordResetEmail({ name, resetUrl, code, expiresInMinutes = 15 }: PasswordResetTemplateOptions): string {
  const greeting = name ? `Hi ${name},` : "Hello,";
  
  const actionButton = resetUrl ? `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 6px; display: inline-block;">Reset Password</a>
    </div>
  ` : "";

  const codeDisplay = code ? `
    <div style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; text-align: center; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600;">Reset Verification Code</p>
      <span style="font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #0f172a;">${code}</span>
    </div>
  ` : "";

  const content = `
    <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Reset Your Password</h2>
    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px;">${greeting} We received a request to reset your password on your Velvet Lane account. Click the button below to set a new password, or use the code provided:</p>
    
    ${actionButton}
    ${codeDisplay}
    
    <p style="font-size: 13px; color: #64748b; margin-top: 24px; margin-bottom: 0;">This password reset request is valid for <strong>${expiresInMinutes} minutes</strong>. If you did not request this, you can safely ignore this email.</p>
  `;

  return getBaseLayout("Reset Your Password", content);
}
