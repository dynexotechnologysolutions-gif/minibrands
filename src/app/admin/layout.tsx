import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { validateSessionAndRole } from "@/lib/auth-services/guard";
import { RedirectService } from "@/lib/auth-services/redirect.service";
import AdminLayout from "@/components/admin/AdminLayout";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const authResult = await validateSessionAndRole(reqHeaders, Role.ADMIN);

  // Handle State Machine Redirection Rules
  if (authResult.state === "NO_COOKIE" || authResult.state === "INVALID_SESSION") {
    redirect("/admin/login");
  }

  if (authResult.state === "EXPIRED_SESSION") {
    redirect("/session-expired?redirectTo=%2Fadmin");
  }

  if (authResult.state === "ROLE_MISMATCH") {
    const userRole = authResult.userProfile?.role;
    const safeUrl = RedirectService.getFallbackForRole(userRole);
    redirect(safeUrl);
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

  const role = authResult.userProfile?.role || Role.BUYER;
  const userName = authResult.session?.user.name || "Founder Admin";
  const userEmail = authResult.session?.user.email || "admin@velvetlane.in";

  return (
    <AdminLayout userName={userName} userEmail={userEmail} role={role}>
      {children}
    </AdminLayout>
  );
}
