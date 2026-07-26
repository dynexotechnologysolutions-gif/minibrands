"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Sparkles, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";

export default function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/admin",
      });
      if (res?.error) {
        setErrorMessage(res.error.message || "Google Authentication failed.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Google Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Glass & Glow Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface/90 backdrop-blur-xl border border-border-gray/70 rounded-3xl p-8 shadow-2xl z-10 animate-fade-in-up">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary via-indigo-600 to-black rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface tracking-tight">
            Founder Admin Access
          </h1>
          <p className="text-xs text-text-muted font-medium flex items-center justify-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-primary inline" />
            Restricted Enterprise Executive Portal
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-error-red/10 border border-error-red/30 text-error-red text-xs font-bold text-center animate-fade-in-up">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          <p className="text-[11px] text-text-muted text-center leading-relaxed mb-4">
            Authorized founder access is strictly restricted to verified corporate Google credentials. 
            All access logs, activities, and audit logs are recorded.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-extrabold flex items-center justify-center gap-3 shadow-lg shadow-primary/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Founder...</span>
              </>
            ) : (
              <>
                <img
                  alt="Google"
                  className="w-4 h-4"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-Lrs6fi30Roms51aPNqibpTJxhGIi-LcfaT89wBFttUbPyRfrRNE2MSZgpCQ31AkZ2CTh8WDhHATyL8nzrJvRSfxcUtuD9rrHY3ArHo03R3HrqX8oShu__qHNOOoCnTPJJCH_8fQkRs4upR4I5bs_EidjsmLr2f-xzSWlYOfSnzYVSYheCg0IdWgQoWcMYZVn-noWeZNz3RfVclzYsGIFrnl9pTgmPwe2LiGieG6lQXkS563oTSRBzFwCuxKrxLJ6bEXIrSqM8kxm"
                />
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-border-gray/40 text-center text-[11px] text-text-muted font-medium">
          Protected by Enterprise RBAC & Audit Logging • Session duration 8 hours
        </div>
      </div>
    </div>
  );
}
