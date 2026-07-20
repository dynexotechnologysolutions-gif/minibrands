"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Sparkles, ShieldAlert, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message || "Invalid founder credentials.");
        setIsLoading(false);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please check credentials.");
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

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wider">
              Founder Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@velvetlane.in"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-lowest border border-border-gray/70 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs font-medium text-on-surface transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-lowest border border-border-gray/70 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs font-medium text-on-surface transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all mt-6 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Founder...</span>
              </>
            ) : (
              <>
                <span>Sign In To Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border-gray/40 text-center text-[11px] text-text-muted font-medium">
          Protected by Enterprise RBAC & Audit Logging • Session duration 8 hours
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs">Loading admin auth...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
