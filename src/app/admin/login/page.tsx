import React, { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { validateSessionAndRole } from "@/lib/auth-services/guard";
import { RedirectService } from "@/lib/auth-services/redirect.service";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const reqHeaders = await headers();
  const authResult = await validateSessionAndRole(reqHeaders);

  // If a valid session is found, redirect to their role's fallback page
  if (authResult.state === "AUTHORIZED" || authResult.state === "ROLE_MISMATCH") {
    const userRole = authResult.userProfile?.role;
    const destination = RedirectService.getFallbackForRole(userRole);
    redirect(destination);
  }

  // Otherwise, render the client-side login form
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs">Loading admin auth...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
