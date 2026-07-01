import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySignzyWebhookSignature } from "@/lib/signzy";
import { calculateTrustScore } from "@/lib/trust-score";
import { captureAndLogError } from "@/lib/sentry";
import { trackEvent } from "@/lib/posthog";

export async function POST(req: Request) {
  let rawBody = "";
  try {
    // 1. Read raw body and signature header
    const signature = req.headers.get("x-signzy-signature") || req.headers.get("x-signature") || "";
    rawBody = await req.text();

    // 2. Validate signature against shared secret
    const isValid = verifySignzyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn(`[Signzy Webhook] Invalid signature attempt. Signature: ${signature}`);
      return new NextResponse(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Parse request body
    const body = JSON.parse(rawBody);
    const { referenceId, status, faceMatchScore } = body as {
      referenceId: string;
      status: string;
      faceMatchScore: number;
    };

    if (!referenceId) {
      return NextResponse.json({ error: "Missing referenceId" }, { status: 400 });
    }

    // 4. Look up SellerVerification by signzyReferenceId
    const verification = await prisma.sellerVerification.findFirst({
      where: { signzyReferenceId: referenceId },
      include: { seller: { include: { userProfile: true } } },
    });

    if (!verification) {
      console.warn(`[Signzy Webhook] SellerVerification not found for referenceId: ${referenceId}`);
      return NextResponse.json({ error: "Reference ID not found" }, { status: 404 });
    }

    // 5. Determine kycStatus based on faceMatchScore
    let kycStatus = "pending";
    let rejectionReason: string | null = null;
    let verifiedAt: Date | null = null;

    if (faceMatchScore >= 80) {
      kycStatus = "auto_approved";
      verifiedAt = new Date();
    } else if (faceMatchScore >= 60) {
      kycStatus = "manual_review";
    } else {
      kycStatus = "rejected";
      rejectionReason = "Identity verification failed (Low face match score)";
    }

    // 6. Update database record in transaction
    await prisma.$transaction(async (tx) => {
      const dbVerification = await tx.sellerVerification.findUnique({
        where: { id: verification.id },
      });
      const bankVerified = dbVerification?.bankVerified || false;
      const newTrustScore = calculateTrustScore({ kycStatus, bankVerified });

      await tx.sellerVerification.update({
        where: { id: verification.id },
        data: {
          kycStatus,
          faceMatchScore,
          rejectionReason,
          verifiedAt,
          trustScore: newTrustScore,
        },
      });
    });

    // 7. Track PostHog event
    const userId = verification.seller.userProfile.userId;
    trackEvent(userId, "seller_kyc_outcome", {
      sellerId: verification.sellerId,
      status: kycStatus,
      faceMatchScore,
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    captureAndLogError(error, "SignzyWebhookRoute", { rawBody });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
