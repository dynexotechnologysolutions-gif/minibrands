"use client";

import React, { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  Clock,
  HelpCircle,
  Home,
  KeyRound,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

function SessionExpiredContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const redirectTo = searchParams.get("redirectTo") || "/";

  const handleSignInAgain = async () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    try {
      await authClient.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
    
    startTransition(() => {
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    });
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <div className="bg-[#FAFAFC] min-h-screen flex flex-col w-full text-[#111827] font-sans">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#ECECEC]/80 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="MiniBrands home">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-vl-heading text-lg font-extrabold text-white shadow-md transition-all duration-200 group-hover:scale-105 group-hover:rotate-3"
              style={{ background: "linear-gradient(135deg, #0F7F7F 0%, #0d3b36 100%)" }}
            >
              M
            </span>
            <span className="font-vl-heading text-lg font-extrabold tracking-[-0.04em] text-[#111827]">MiniBrands</span>
          </Link>
          <Link
            href="/faqs"
            className="text-sm font-semibold text-[#6B7280] hover:text-[#0F7F7F] transition-colors"
          >
            Need Help?
          </Link>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-grow flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-[480px] bg-white rounded-[28px] border border-[#ECECEC] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] text-center transition-all duration-300">
          
          {/* Timeout illustration */}
          <div className="w-20 h-20 bg-[#0F7F7F]/10 border border-[#0F7F7F]/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#0F7F7F]">
            <Clock className="h-10 w-10 animate-pulse" />
          </div>

          {/* Messages */}
          <div className="space-y-3 mb-8">
            <h1 className="font-vl-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
              Session Expired
            </h1>
            <p className="text-sm text-[#6B7280] leading-relaxed max-w-[380px] mx-auto">
              For your security, your session has ended due to inactivity. Don&apos;t worry—your cart items and data remain secure. Please sign in again.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleSignInAgain}
              disabled={isRedirecting || isPending}
              className="h-[52px] bg-[#0F7F7F] text-white font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 px-6 sm:flex-1 shadow-[0_4px_16px_rgba(15,127,127,0.25)]"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <KeyRound className="h-5 w-5" />
                  Sign In Again
                </>
              )}
            </button>
            <button
              onClick={handleBackToHome}
              className="h-[52px] border-[1.5px] border-[#ECECEC] hover:bg-[#FAFAFC] active:scale-[0.98] transition-all font-semibold rounded-2xl text-[#111827] px-6 sm:flex-1 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="h-5 w-5 text-[#9CA3AF]" />
              Back to Home
            </button>
          </div>

          {/* Safety info card */}
          <div className="mt-8 p-4 bg-[#F5F5F8] border border-[#ECECEC] rounded-2xl text-left flex gap-3.5 items-start">
            <div className="bg-white p-2 border border-[#ECECEC] rounded-xl shrink-0 text-[#0F7F7F]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-0.5">Security First</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                To protect your financial and personal credentials, active sessions automatically expire after a period of inactivity.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Trust & Security UX Strip */}
      <footer className="w-full bg-[#FAFAFC] border-t border-[#ECECEC] py-6 select-none mt-auto">
        <div className="max-w-[1440px] mx-auto px-4 flex flex-wrap justify-center gap-x-8 gap-y-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
            <ShieldCheck className="h-4 w-4 text-[#0F7F7F]" /> Secure SSL Connection
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
            <ShieldCheck className="h-4 w-4 text-[#0F7F7F]" /> Data Encrypted
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
            <ShieldCheck className="h-4 w-4 text-[#0F7F7F]" /> Privacy Protected
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function SessionExpiredPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center min-h-screen bg-[#FAFAFC]">
          <Loader2 className="h-8 w-8 animate-spin text-[#0F7F7F]" />
        </div>
      }
    >
      <SessionExpiredContent />
    </Suspense>
  );
}
