"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Store, ArrowRight, Check } from "lucide-react";
import { switchActiveRole } from "@/actions/switch-role.action";

interface UserProfileData {
  id: string;
  role: "BUYER" | "SELLER" | "ADMIN" | "SUPER_ADMIN";
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  seller?: {
    id: string;
    businessName: string;
    storeName: string;
    storeLogo?: string | null;
  } | null;
}

interface MobileAccountSwitcherProps {
  userProfile: UserProfileData | null;
}

export default function MobileAccountSwitcher({ userProfile }: MobileAccountSwitcherProps) {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<"BUYER" | "SELLER">("BUYER");
  const [isPending, setIsPending] = useState(false);

  // Read active mode from cookies on mount
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )active_role_mode=([^;]*)/);
    const cookieVal = match ? match[1] : null;
    const resolvedMode = cookieVal === "SELLER" && userProfile?.seller ? "SELLER" : "BUYER";
    
    const timer = setTimeout(() => {
      setActiveMode(resolvedMode);
    }, 0);
    
    return () => clearTimeout(timer);
  }, [userProfile]);

  const handleRoleSwitch = async (newMode: "BUYER" | "SELLER") => {
    if (newMode === activeMode || isPending) return;
    setIsPending(true);
    try {
      const res = await switchActiveRole(newMode);
      if (res.success) {
        setActiveMode(newMode);
        router.refresh();
        if (newMode === "SELLER") {
          router.push("/seller/dashboard");
        } else {
          router.push("/");
        }
      } else {
        alert(res.error?.message || "Failed to switch role");
      }
    } catch (err) {
      console.error("Failed to switch role:", err);
    } finally {
      setIsPending(false);
    }
  };

  const isSellerUser = !!userProfile?.seller;

  return (
    <div className="w-full md:hidden" aria-label="Switch account">
      {isSellerUser ? (
        <div className="bg-vl-card border border-vl-border rounded-vl-card p-5 shadow-vl-soft">
          <h3 className="font-vl-heading text-xs font-bold text-vl-ink uppercase tracking-wider mb-3">
            Account Mode
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Buyer Mode Button */}
            <button
              onClick={() => handleRoleSwitch("BUYER")}
              disabled={isPending}
              className={`flex items-center justify-between px-4 h-12 rounded-vl-control text-xs font-bold border transition-all cursor-pointer ${
                activeMode === "BUYER"
                  ? "bg-vl-primary/10 border-vl-primary text-vl-primary"
                  : "bg-vl-surface border-vl-border text-vl-muted hover:bg-vl-surface/80"
              }`}
              aria-current={activeMode === "BUYER" ? "page" : undefined}
              aria-label="Switch to Buyer Mode"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>Buyer Mode</span>
              </div>
              {activeMode === "BUYER" && <Check className="w-4 h-4 shrink-0" />}
            </button>

            {/* Seller Mode Button */}
            <button
              onClick={() => handleRoleSwitch("SELLER")}
              disabled={isPending}
              className={`flex items-center justify-between px-4 h-12 rounded-vl-control text-xs font-bold border transition-all cursor-pointer ${
                activeMode === "SELLER"
                  ? "bg-vl-primary/10 border-vl-primary text-vl-primary"
                  : "bg-vl-surface border-vl-border text-vl-muted hover:bg-vl-surface/80"
              }`}
              aria-current={activeMode === "SELLER" ? "page" : undefined}
              aria-label="Switch to Seller Mode"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 shrink-0" />
                <span>Seller Mode</span>
              </div>
              {activeMode === "SELLER" && <Check className="w-4 h-4 shrink-0" />}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => router.push("/seller/onboarding")}
          className="w-full flex items-center justify-between p-4 bg-vl-primary/5 hover:bg-vl-primary/10 border border-vl-primary/25 rounded-vl-card text-left transition-all cursor-pointer group"
          aria-label="Become a seller on MiniBrands"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vl-primary/10 flex items-center justify-center text-vl-primary">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="font-vl-heading text-xs font-bold text-vl-ink">Want to sell on MiniBrands?</p>
              <p className="text-[10px] text-vl-muted mt-0.5">Register your boutique store and start selling</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-vl-primary group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
}
