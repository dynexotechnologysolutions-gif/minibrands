import { getBaseLayout } from "../layout";

interface AdminAlertTemplateOptions {
  subject: string;
  body: string;
}

export function renderAdminAlertEmail({ subject, body }: AdminAlertTemplateOptions): string {
  const content = `
    <h2 style="font-size: 20px; color: #dc2626; margin-top: 0;">Critical Platform Alert</h2>
    <p style="font-size: 14px; color: #475569; line-height: 1.6; font-weight: 600;">Subject: ${subject}</p>
    <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 6px; padding: 18px; margin: 20px 0; font-family: monospace; font-size: 13px; color: #991b1b; white-space: pre-wrap; word-break: break-all;">
      ${body}
    </div>
    <p style="font-size: 12px; color: #64748b; margin-top: 24px; margin-bottom: 0;">This is an automated system security/operational alert. Please inspect the dashboard or audit logs for detail.</p>
  `;

  return getBaseLayout(`[Velvet Alert] ${subject}`, content);
}
