/**
 * Computes the trust score for a seller.
 * Returns 50 if KYC is approved (auto_approved or approved) AND bank is verified.
 * Returns 0 otherwise.
 */
export function calculateTrustScore(verification: {
  kycStatus: string;
  bankVerified: boolean;
}): number {
  const isKycApproved =
    verification.kycStatus === "auto_approved" || verification.kycStatus === "approved";
  
  if (isKycApproved && verification.bankVerified) {
    return 50;
  }
  
  return 0;
}
