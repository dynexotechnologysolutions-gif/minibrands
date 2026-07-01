import { NextResponse } from "next/server";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.SIGNZY_WEBHOOK_SECRET || "mock_signzy_webhook_secret";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const referenceId = searchParams.get("referenceId") || "";
  const sellerId = searchParams.get("sellerId") || "";

  // Render a simple sandbox test page allowing the user to select the KYC outcome
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Signzy Sandbox Simulator</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          padding: 32px;
          max-width: 450px;
          width: 100%;
          text-align: center;
        }
        h1 {
          font-size: 24px;
          color: #111827;
          margin-bottom: 8px;
        }
        p {
          color: #4b5563;
          font-size: 14px;
          margin-bottom: 24px;
        }
        .btn {
          display: block;
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 12px;
          transition: background-color 0.2s;
        }
        .btn-success {
          background-color: #10b981;
          color: white;
        }
        .btn-success:hover { background-color: #059669; }
        .btn-warning {
          background-color: #f59e0b;
          color: white;
        }
        .btn-warning:hover { background-color: #d97706; }
        .btn-danger {
          background-color: #ef4444;
          color: white;
        }
        .btn-danger:hover { background-color: #dc2626; }
        .ref-info {
          font-family: monospace;
          background: #f3f4f6;
          padding: 6px;
          border-radius: 4px;
          font-size: 12px;
          color: #374151;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Signzy Sandbox Simulator</h1>
        <p>Select a mock Aadhaar KYC verification outcome for reference:</p>
        <p class="ref-info">${referenceId}</p>
        
        <form method="POST" style="margin-top: 24px;">
          <input type="hidden" name="referenceId" value="${referenceId}" />
          <input type="hidden" name="sellerId" value="${sellerId}" />
          
          <button type="submit" name="score" value="85" class="btn btn-success">
            Simulate Approved (Score: 85)
          </button>
          
          <button type="submit" name="score" value="70" class="btn btn-warning">
            Simulate Manual Review (Score: 70)
          </button>
          
          <button type="submit" name="score" value="45" class="btn btn-danger">
            Simulate Rejected (Score: 45)
          </button>
        </form>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const referenceId = formData.get("referenceId") as string;
    const score = parseInt(formData.get("score") as string, 10);

    const payload = {
      referenceId,
      status: "completed",
      faceMatchScore: score,
    };

    const payloadString = JSON.stringify(payload);

    // Sign using the shared secret
    const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
    hmac.update(payloadString);
    const signature = hmac.digest("hex");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Call our actual webhook endpoint
    const webhookRes = await fetch(`${appUrl}/api/webhooks/signzy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signzy-signature": signature,
      },
      body: payloadString,
    });

    if (!webhookRes.ok) {
      const errorText = await webhookRes.text();
      console.error("Mock redirect form submit to webhook failed:", errorText);
    }

    // Redirect the user back to the onboarding page
    return NextResponse.redirect(`${appUrl}/seller/onboarding`, 303);
  } catch (error) {
    console.error("Mock redirect handler error:", error);
    return new NextResponse("Simulator failed", { status: 500 });
  }
}
