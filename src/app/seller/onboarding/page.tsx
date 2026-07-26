import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { validateSessionAndRole } from "@/lib/auth-services/guard";
import { prisma } from "@/lib/prisma";
import Providers from "@/app/providers";
import OnboardingForm from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const reqHeaders = await headers();
  const authResult = await validateSessionAndRole(reqHeaders, Role.BUYER);

  // Handle State Machine Redirection Rules
  if (authResult.state === "NO_COOKIE" || authResult.state === "INVALID_SESSION") {
    redirect("/seller/login");
  }

  if (authResult.state === "EXPIRED_SESSION") {
    redirect("/session-expired?redirectTo=%2Fseller%2Fonboarding");
  }

  if (authResult.state === "UNAVAILABLE") {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4 bg-slate-800 p-8 rounded-3xl border border-slate-700">
          <h2 className="text-xl font-bold text-red-400">Authentication Service Offline</h2>
          <p className="text-sm text-slate-300">We are unable to verify your session at this moment. Please refresh the page or try again later.</p>
        </div>
      </div>
    );
  }

  const userProfile = authResult.userProfile;
  const seller = userProfile?.seller || null;
  const verification = seller?.verification || null;

  const isVerified =
    verification &&
    (verification.kycStatus === "auto_approved" || verification.kycStatus === "approved") &&
    verification.bankVerified;

  if (isVerified) {
    redirect("/seller/dashboard");
  }

  // Determine starting step based on database state
  let initialStep = 1;
  if (seller) {
    if (verification?.kycStatus !== "auto_approved" && verification?.kycStatus !== "approved") {
      initialStep = 2;
    } else if (!verification?.bankVerified) {
      initialStep = 3;
    } else {
      initialStep = 4;
    }
  }

  return (
    <Providers>
      <div className="flex-1 min-h-screen flex flex-col">
        <OnboardingForm
          initialStep={initialStep}
          initialSellerId={seller?.id || null}
          initialKycStatus={verification?.kycStatus || null}
          initialBankVerified={verification?.bankVerified || false}
          initialHasInitiatedKyc={!!verification?.signzyReferenceId}
          userEmail={authResult.session?.user.email || ""}
          initialPanNumber={seller?.panNumber || ""}
          initialPanName={seller?.panName || ""}
          initialPanCardUrl={seller?.panCardUrl || ""}
          initialAadhaarNumber={seller?.aadhaarNumber || ""}
          initialAadhaarName={seller?.aadhaarName || ""}
          initialAadhaarFrontUrl={seller?.aadhaarFrontUrl || ""}
          initialAadhaarBackUrl={seller?.aadhaarBackUrl || ""}
          initialCancelledChequeUrl={seller?.cancelledChequeUrl || ""}
        />
      </div>
    </Providers>
  );
}
