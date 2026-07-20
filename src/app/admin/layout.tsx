import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) {
    // Note: Middleware already handles redirect for protected routes
    return <AdminLayout>{children}</AdminLayout>;
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  const role = userProfile?.role || "BUYER";
  const userName = session.user.name || "Founder Admin";
  const userEmail = session.user.email || "admin@velvetlane.in";

  return (
    <AdminLayout userName={userName} userEmail={userEmail} role={role}>
      {children}
    </AdminLayout>
  );
}
