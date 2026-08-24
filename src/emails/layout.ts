export function getBaseLayout(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - MiniBrands</title>
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
              <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">MiniBrands Fashion Marketplace</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px 28px; color: #1e293b;">
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 4px 0;">© 2026 MiniBrands India. All rights reserved.</p>
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
