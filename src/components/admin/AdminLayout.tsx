"use client";

import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import AdminBreadcrumbs from "./AdminBreadcrumbs";

interface AdminLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
  role?: string;
}

export default function AdminLayout({
  children,
  userName = "Founder Admin",
  userEmail = "founder@velvetlane.in",
  role = "ADMIN",
}: AdminLayoutProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  return (
    <div className="min-h-screen bg-surface-bg text-on-surface flex flex-col font-sans antialiased selection:bg-primary/20 selection:text-primary">
      {/* Sidebar Navigation */}
      <AdminSidebar
        userName={userName}
        userEmail={userEmail}
        role={role}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Main Content Area Container */}
      <div className="flex-1 lg:pl-[260px] flex flex-col min-w-0 transition-all duration-300">
        {/* Topbar Header */}
        <AdminTopbar
          userName={userName}
          userEmail={userEmail}
          role={role}
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
        />

        {/* Dynamic Page Body Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">
          <AdminBreadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
