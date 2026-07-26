import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: { seller: true },
    });

    if (!userProfile || !userProfile.seller) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      gstin,
      businessAddress,
      panNumber,
      panName,
      panCardUrl,
      aadhaarNumber,
      aadhaarName,
      aadhaarFrontUrl,
      aadhaarBackUrl,
      bankAccountNumber,
      bankIfsc,
      bankAccountName,
      cancelledChequeUrl,
      submit,
    } = body;

    const sellerId = userProfile.seller.id;

    // Build data object
    const updateData: any = {};
    if (gstin !== undefined) updateData.gstin = gstin;
    if (businessAddress !== undefined) updateData.businessAddress = businessAddress;
    if (panNumber !== undefined) updateData.panNumber = panNumber;
    if (panName !== undefined) updateData.panName = panName;
    if (panCardUrl !== undefined) updateData.panCardUrl = panCardUrl;
    if (aadhaarNumber !== undefined) updateData.aadhaarNumber = aadhaarNumber;
    if (aadhaarName !== undefined) updateData.aadhaarName = aadhaarName;
    if (aadhaarFrontUrl !== undefined) updateData.aadhaarFrontUrl = aadhaarFrontUrl;
    if (aadhaarBackUrl !== undefined) updateData.aadhaarBackUrl = aadhaarBackUrl;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
    if (bankIfsc !== undefined) updateData.bankIfsc = bankIfsc;
    if (bankAccountName !== undefined) updateData.bankAccountName = bankAccountName;
    if (cancelledChequeUrl !== undefined) updateData.cancelledChequeUrl = cancelledChequeUrl;

    if (submit) {
      updateData.status = "PENDING_VERIFICATION";
      updateData.submittedAt = new Date();
      
      // Also update kycStatus in sellerVerification
      await prisma.sellerVerification.upsert({
        where: { sellerId },
        update: { kycStatus: "pending" },
        create: { sellerId, kycStatus: "pending" }
      });
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: updateData,
    });

    return NextResponse.json({ success: true, seller: updatedSeller });
  } catch (error: any) {
    console.error("Failed to submit onboarding details:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
