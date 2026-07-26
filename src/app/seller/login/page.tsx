import React, { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { validateSessionAndRole } from "@/lib/auth-services/guard";
import { RedirectService } from "@/lib/auth-services/redirect.service";
import SellerLoginForm from "./SellerLoginForm";

export const dynamic = "force-dynamic";

export default async function SellerLoginPage() {
  const reqHeaders = await headers();
  const authResult = await validateSessionAndRole(reqHeaders);

  // If a valid session is found, redirect based on seller profile presence or fallback
  if (authResult.state === "AUTHORIZED" || authResult.state === "ROLE_MISMATCH") {
    const userProfile = authResult.userProfile;
    const userRole = userProfile?.role;

    if (userProfile?.seller) {
      redirect("/seller/dashboard");
    } else {
      redirect("/seller/onboarding");
    }
  }

  // Otherwise, render the client-side login form
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center min-h-screen bg-surface-container-low">
          <span className="material-symbols-outlined animate-spin text-[36px] text-primary">sync</span>
        </div>
      }
    >
      <SellerLoginForm />
    </Suspense>
  );
}
