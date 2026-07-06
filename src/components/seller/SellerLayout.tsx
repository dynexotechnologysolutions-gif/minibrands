"use client";

import React, { useState } from "react";
import SellerSidebar from "./SellerSidebar";
import SellerTopbar from "./SellerTopbar";

interface SellerLayoutProps {
  children: React.ReactNode;
  sellerInfo?: {
    id: string;
    businessName: string;
    storeName?: string;
    isKycVerified?: boolean;
    userEmail?: string;
  };
}

export default function SellerLayout({ children, sellerInfo }: SellerLayoutProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-sans">
      {/* Sidebar Shell */}
      <SellerSidebar
        storeName={sellerInfo?.businessName || sellerInfo?.storeName || "Seller Store"}
        storeEmail={sellerInfo?.userEmail || "seller@velvetlane.in"}
        isKycVerified={sellerInfo?.isKycVerified ?? true}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Main Content Area Offset for Sidebar */}
      <div className="lg:ml-[260px] min-h-screen flex flex-col flex-1 transition-all duration-300">
        {/* Top Navigation Bar */}
        <SellerTopbar
          onToggleMobileSidebar={() => setIsOpenMobile(!isOpenMobile)}
          sellerId={sellerInfo?.id}
        />

        {/* Page Content Shell */}
        <main className="flex-1 p-base md:p-lg max-w-[1920px] w-full mx-auto space-y-lg">
          {children}
        </main>
      </div>
    </div>
  );
}
