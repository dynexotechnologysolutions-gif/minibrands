"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Sparkles, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";

export default function AdminLoginForm() {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
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
