import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { validateSessionAndRole } from "@/lib/auth-services/guard";
import { RedirectService } from "@/lib/auth-services/redirect.service";
import SellerProfileClient from "./SellerProfileClient";

import SellerLayout from "@/components/seller/SellerLayout";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Store Profile Settings | MiniBrands",
  description: "Manage your independent boutique store logo, banner, categories, and review your verification status.",
};

export default async function SellerProfilePage() {
  const reqHeaders = await headers();
  const authResult = await validateSessionAndRole(reqHeaders, Role.SELLER);

  if (authResult.state === "NO_COOKIE" || authResult.state === "INVALID_SESSION") {
    redirect("/seller/login");
  }

  if (authResult.state === "EXPIRED_SESSION") {
    redirect("/session-expired?redirectTo=%2Fseller%2Fprofile");
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
  const sellerInfo = {
    id: seller.id,
    businessName: seller.businessName,
    storeName: seller.storeName,
    isKycVerified: seller.verification?.kycStatus === "approved" || seller.verification?.kycStatus === "auto_approved",
    userEmail: userProfile.user.email,
  };

  return (
    <SellerLayout sellerInfo={sellerInfo}>
      <SellerProfileClient 
        seller={seller} 
        verification={seller.verification} 
        userProfile={userProfile}
      />
    </SellerLayout>
  );
}
