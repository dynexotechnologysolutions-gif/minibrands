import React, { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { validateSessionAndRole } from "@/lib/auth-services/guard";
import { RedirectService } from "@/lib/auth-services/redirect.service";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const roleIntent = params.role;

  const reqHeaders = await headers();
  const authResult = await validateSessionAndRole(reqHeaders);

  // If a valid session is found, redirect based on role intent or default fallback
  if (authResult.state === "AUTHORIZED" || authResult.state === "ROLE_MISMATCH") {
    const userProfile = authResult.userProfile;
    const userRole = userProfile?.role;

    if (roleIntent === "seller") {
      if (userProfile?.seller) {
        redirect("/seller/dashboard");
      } else {
        redirect("/seller/onboarding");
      }
    }

    const destination = RedirectService.getFallbackForRole(userRole);
    redirect(destination);
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
      <LoginForm />
    </Suspense>
  );
}
