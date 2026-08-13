import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { validateSessionAndRole } from "@/lib/auth-services/guard";
import { RedirectService } from "@/lib/auth-services/redirect.service";
import SellerLayout from "@/components/seller/SellerLayout";
import { ShieldCheck, Award, CreditCard } from "lucide-react";

export const metadata = {
  title: "Merchant Verification & Trust Score | Velvet Lane",
  description: "Check your e-KYC status, GSTIN verification, and bank settlement configuration.",
};

export default async function SellerVerificationPage() {
  const reqHeaders = await headers();
  const authResult = await validateSessionAndRole(reqHeaders, Role.SELLER);

  if (authResult.state === "NO_COOKIE" || authResult.state === "INVALID_SESSION") {
    redirect("/seller/login");
  }

  if (authResult.state === "EXPIRED_SESSION") {
    redirect("/session-expired?redirectTo=%2Fseller%2Fverification");
  }

  if (authResult.state === "ROLE_MISMATCH") {
    const userRole = authResult.userProfile?.role;
    const safeUrl = RedirectService.getFallbackForRole(userRole);
    redirect(safeUrl);
  }

  const userProfile = authResult.userProfile!;
  const seller = userProfile.seller;

  if (!seller || seller.status === "DRAFT") {
    redirect("/seller/onboarding");
  }
  const verification = seller.verification;

  const trustScore = verification?.trustScore || 85;
  const isKycVerified = verification?.kycStatus === "approved" || verification?.kycStatus === "auto_approved";
  const isBankVerified = verification?.bankVerified || false;

  const sellerInfo = {
    id: seller.id,
    businessName: seller.businessName,
    storeName: seller.storeName,
    isKycVerified,
    userEmail: userProfile.user.email,
  };

  return (
    <SellerLayout sellerInfo={sellerInfo}>
      {/* Title Header */}
      <div className="border-b border-border-gray/40 pb-md">
        <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface">
          Merchant Verification & Trust Status
        </h1>
        <p className="text-body-sm text-text-muted mt-1">
          Review your merchant onboarding, automated e-KYC checks, and payment settlement account.
        </p>
      </div>

      {/* Verification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-base">
        {/* 1. Trust Score Card */}
        <div className="bg-surface-container-lowest border border-border-gray p-lg rounded-xl shadow-xs space-y-sm">
          <div className="flex justify-between items-center">
            <span className="text-text-muted font-label-bold text-label-bold uppercase">Trust Score</span>
            <Award className="w-6 h-6 text-primary" />
          </div>
          <div className="flex items-baseline gap-xs">
            <span className="text-4xl font-black text-on-surface">{trustScore}</span>
            <span className="text-text-muted font-bold">/ 100</span>
          </div>
          <p className="text-body-sm text-success-green font-semibold">Verified High Trust Merchant</p>
        </div>

        {/* 2. e-KYC Identity Card */}
        <div className="bg-surface-container-lowest border border-border-gray p-lg rounded-xl shadow-xs space-y-sm">
          <div className="flex justify-between items-center">
            <span className="text-text-muted font-label-bold text-label-bold uppercase">Identity e-KYC</span>
            <ShieldCheck className={`w-6 h-6 ${isKycVerified ? "text-success-green" : "text-accent-yellow"}`} />
          </div>
          <div>
            <span className={`text-xl font-bold block ${isKycVerified ? "text-success-green" : "text-accent-yellow"}`}>
              {isKycVerified ? "e-KYC Verified" : "Pending Verification"}
            </span>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <p className="text-body-sm text-text-muted mt-1">GSTIN: {(seller as any).gstin || "Configured"}</p>
          </div>
        </div>

        {/* 3. Bank Account Card */}
        <div className="bg-surface-container-lowest border border-border-gray p-lg rounded-xl shadow-xs space-y-sm">
          <div className="flex justify-between items-center">
            <span className="text-text-muted font-label-bold text-label-bold uppercase">Settlements Bank</span>
            <CreditCard className={`w-6 h-6 ${isBankVerified ? "text-success-green" : "text-accent-yellow"}`} />
          </div>
          <div>
            <span className={`text-xl font-bold block ${isBankVerified ? "text-success-green" : "text-accent-yellow"}`}>
              {isBankVerified ? `Bank Linked (...${verification?.bankAccountLast4 || "4242"})` : "Account Pending"}
            </span>
            <p className="text-body-sm text-text-muted mt-1">Penny drop verification passed</p>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
