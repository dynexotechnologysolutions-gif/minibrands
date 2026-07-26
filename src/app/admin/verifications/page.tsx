import React from "react";
import { prisma } from "@/lib/prisma";
import VerificationConsoleClient from "./VerificationConsoleClient";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  const sellers = await prisma.seller.findMany({
    include: {
      userProfile: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedSellers = sellers.map((s) => ({
    id: s.id,
    businessName: s.businessName,
    storeName: s.storeName || s.businessName,
    businessEmail: s.userProfile.user.email,
    businessPhone: "", 
    businessAddress: s.businessAddress || "",
    city: s.city,
    state: "Tamil Nadu",
    pincode: "",
    panNumber: s.panNumber || "",
    panDocUrl: s.panCardUrl || "",
    aadhaarDocUrl: s.aadhaarFrontUrl || "",
    aadhaarBackUrl: s.aadhaarBackUrl || "",
    accountHolderName: s.bankAccountName || "",
    accountNumber: s.bankAccountNumber || "",
    ifscCode: s.bankIfsc || "",
    bankName: "", 
    chequeDocUrl: s.cancelledChequeUrl || "",
    status: s.status,
    adminNotes: s.adminNotes || "",
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border-gray/70">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">
            Seller KYC Verification Console
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Review identity documents, business details, and cancel cheque uploads to approve/reject onboarding merchants.
          </p>
        </div>
      </div>
      <VerificationConsoleClient initialSellers={formattedSellers} />
    </div>
  );
}
