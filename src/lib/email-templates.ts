/**
 * MiniBrands / Velvet Lane Email Templates
 * Production-ready, responsive, branded HTML email templates for authentication flows.
 */

interface VerificationEmailOptions {
  name?: string;
  code: string;
  expiresInMinutes?: number;
}

interface PasswordResetOptions {
  name?: string;
  resetUrl?: string;
  code?: string;
  expiresInMinutes?: number;
}

interface WelcomeEmailOptions {
  name: string;
  role: "BUYER" | "SELLER" | "ADMIN";
}

interface AccountLockAlertOptions {
  name: string;
  ipAddress?: string;
  time: string;
  unlockTime?: string;
}

export function getVerificationEmailHtml({ name, code, expiresInMinutes = 5 }: VerificationEmailOptions): string {
  const greeting = name ? `Hi ${name},` : "Hello,";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - MiniBrands</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; font-weight: 800;">MINIBRANDS</h1>
              <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Velvet Lane Fashion Marketplace</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px 28px; color: #1e293b;">
              <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Verify Your Email Address</h2>
              <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px;">${greeting} Thank you for joining MiniBrands. Please use the verification code below to complete your authentication:</p>
              
              <!-- Code Box -->
              <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; display: inline-block;">${code}</span>
              </div>
              
              <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">This code will expire in <strong>${expiresInMinutes} minutes</strong>. If you did not request this code, please ignore this email.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 4px 0;">© 2026 MiniBrands Velvet Lane India. All rights reserved.</p>
              <p style="margin: 0; color: #94a3b8;">Secure Fashion Marketplace</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getPasswordResetEmailHtml({ name, resetUrl, code, expiresInMinutes = 15 }: PasswordResetOptions): string {
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

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - MiniBrands</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; font-weight: 800;">MINIBRANDS</h1>
              <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Velvet Lane Security</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px 28px; color: #1e293b;">
              <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Password Reset Request</h2>
              <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 16px;">${greeting} We received a request to reset your MiniBrands account password.</p>
              ${actionButton}
              ${codeDisplay}
              <p style="font-size: 13px; color: #64748b; margin-top: 24px;">This request will expire in <strong>${expiresInMinutes} minutes</strong>. If you did not request a password reset, your account is safe and no action is required.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 4px 0;">© 2026 MiniBrands Velvet Lane. All rights reserved.</p>
              <p style="margin: 0; color: #94a3b8;">If you need support, contact support@minibrands.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getWelcomeEmailHtml({ name, role }: WelcomeEmailOptions): string {
  const roleText = role === "SELLER" ? "Seller Boutique Account" : "Buyer Account";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MiniBrands</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <tr>
            <td style="background-color: #0f172a; padding: 28px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1px;">WELCOME TO MINIBRANDS</h1>
              <p style="color: #f59e0b; margin: 6px 0 0 0; font-size: 13px; font-weight: 600;">Velvet Lane Marketplace</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 28px; color: #1e293b;">
              <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Hi ${name},</h2>
              <p style="font-size: 15px; color: #475569; line-height: 1.6;">Your ${roleText} is now active and ready to go. Explore premium artisanal collections, seamless checkout, buyer protection, and boutique storefronts.</p>
              <div style="margin: 28px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" style="background-color: #0f172a; color: #ffffff; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block;">Start Exploring</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0;">© 2026 MiniBrands India. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getAccountLockoutEmailHtml({ name, ipAddress, time, unlockTime }: AccountLockAlertOptions): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert: Account Temporarily Locked</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 8px; border: 1px solid #fee2e2; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <tr>
            <td style="background-color: #dc2626; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">SECURITY ALERT</h1>
              <p style="color: #fef2f2; margin: 4px 0 0 0; font-size: 12px;">Account Lockout Notification</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 28px; color: #1e293b;">
              <h2 style="font-size: 18px; color: #991b1b; margin-top: 0;">Hi ${name},</h2>
              <p style="font-size: 14px; color: #475569; line-height: 1.6;">Multiple invalid password attempts were detected on your MiniBrands account at <strong>${time}</strong>${ipAddress ? ` from IP address <code>${ipAddress}</code>` : ""}.</p>
              <p style="font-size: 14px; color: #475569; line-height: 1.6;">For your security, login has been temporarily locked${unlockTime ? ` until <strong>${unlockTime}</strong>` : " for 15 minutes"}.</p>
              <p style="font-size: 13px; color: #64748b; margin-top: 20px;">If this was not you, we strongly recommend resetting your password immediately once the lockout expires.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0;">© 2026 MiniBrands Velvet Lane Security Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
