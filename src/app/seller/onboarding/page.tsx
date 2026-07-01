import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OnboardingForm from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  // 1. Check Better Auth session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login?role=seller");
  }

  // 2. Fetch current profile and verification status
  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      seller: {
        include: {
          verification: true,
        },
      },
    },
  });

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
    <div className="flex-1 min-h-screen flex flex-col">
      <OnboardingForm
        initialStep={initialStep}
        initialSellerId={seller?.id || null}
        initialKycStatus={verification?.kycStatus || null}
        initialBankVerified={verification?.bankVerified || false}
        initialHasInitiatedKyc={!!verification?.signzyReferenceId}
        userEmail={session.user.email}
      />
    </div>
  );
}
