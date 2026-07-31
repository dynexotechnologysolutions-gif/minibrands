"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import * as z from "zod";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";

const emailSchema = z.string().email("Please enter a valid email address.");

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const emailVal = emailSchema.safeParse(email);
    if (!emailVal.success) {
      setError(emailVal.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "forget-password",
      });

      if (response.error) {
        setError(response.error.message || "Failed to request password reset. Please try again.");
      } else {
        setIsSubmitted(true);
        setSuccessMessage(`Password reset code sent to ${email}. Check your inbox.`);
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#FAFAFC] min-h-screen flex flex-col w-full text-[#111827] font-sans">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#ECECEC]/80 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="MiniBrands home">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-vl-heading text-lg font-extrabold text-white shadow-md transition-all duration-200 group-hover:scale-105 group-hover:rotate-3"
              style={{ background: "linear-gradient(135deg, #6C3BFF 0%, #FF4D8D 100%)" }}
            >
              M
            </span>
            <span className="font-vl-heading text-lg font-extrabold tracking-[-0.04em] text-[#111827]">MiniBrands</span>
          </Link>
          <Link
            href="/faqs"
            className="text-sm font-semibold text-[#6B7280] hover:text-[#FF3E6C] transition-colors"
          >
            Need Help?
          </Link>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-grow flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-[460px] bg-white rounded-[28px] border border-[#ECECEC] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300">
          <div className="mb-8 text-center">
            <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#FF3E6C]">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="font-vl-heading text-2xl font-extrabold tracking-tight text-[#111827] mb-2">
              Forgot Password?
            </h1>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Enter your registered email address and we&apos;ll send you a password reset code.
            </p>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 text-[#EF4444] text-sm rounded-2xl border border-red-100 flex gap-2.5 items-start">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-5 p-4 bg-emerald-50 text-[#16A34A] text-sm rounded-2xl border border-emerald-100 flex gap-2.5 items-start">
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {!isSubmitted ? (
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
                  <input
                    className="w-full h-[52px] pl-12 pr-4 border border-[#ECECEC] rounded-2xl outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] bg-white transition-all focus:border-[#FF3E6C] focus:shadow-[0_0_0_4px_rgba(255,62,108,0.1)]"
                    placeholder="Enter your registered email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[52px] bg-[#FF3E6C] text-white font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_16px_rgba(255,62,108,0.25)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending Reset Code...
                  </>
                ) : (
                  "Send Reset Code"
                )}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-4 animate-fade-in-up">
              <Link
                href={`/reset-password?email=${encodeURIComponent(email)}`}
                className="w-full h-[52px] bg-[#FF3E6C] text-white font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(255,62,108,0.25)]"
              >
                Enter Reset Code & Set Password →
              </Link>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-sm font-bold text-[#FF3E6C] hover:underline flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </main>

      {/* Trust & Security UX Strip */}
      <footer className="w-full bg-[#FAFAFC] border-t border-[#ECECEC] py-6 select-none mt-auto">
        <div className="max-w-[1440px] mx-auto px-4 flex flex-wrap justify-center gap-x-8 gap-y-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
            <ShieldCheck className="h-4 w-4 text-[#FF3E6C]" /> Secure SSL Connection
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
            <ShieldCheck className="h-4 w-4 text-[#FF3E6C]" /> Data Encrypted
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
            <ShieldCheck className="h-4 w-4 text-[#FF3E6C]" /> Privacy Protected
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center min-h-screen bg-[#FAFAFC]">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF3E6C]" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
