"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import HomeHeader from "@/components/home/HomeHeader";
import { Building2, ArrowLeft, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import * as z from "zod";

const emailSchema = z.string().email("Please enter a valid email address.");

function SellerForgotPasswordForm() {
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
        setSuccessMessage(`Password reset code sent to ${email}. Check your email inbox.`);
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-low min-h-screen flex flex-col w-full text-on-surface font-sans">
      <HomeHeader userProfile={null} cartCount={0} sellerHref="/seller/onboarding" />

      <main className="flex-grow flex flex-col items-center justify-center px-base py-xxl">
        <div className="w-full max-w-[460px] bg-white rounded-2xl p-xl border border-border-gray shadow-md">
          <div className="mb-xl text-center">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center mx-auto mb-md text-indigo-600">
              <Lock className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest block mb-1">Seller Security Portal</span>
            <h1 className="font-headline-md text-headline-md text-primary mb-xs font-bold font-display">
              Seller Forgot Password
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Enter your registered seller email address to receive a password reset verification code.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-md bg-error-container text-error text-body-md rounded-xl font-bold border border-error/20 flex gap-2 items-center">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-md bg-surface-container-low text-success-green text-body-md rounded-xl font-bold border border-success-green/20 flex gap-2 items-center">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {!isSubmitted ? (
            <form className="flex flex-col gap-lg" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-xs">
                <label className="font-label-bold text-label-bold text-on-surface">
                  Seller Email Address
                </label>
                <input
                  className="w-full p-md border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-body-md bg-white"
                  placeholder="store@boutique.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-md bg-primary text-on-primary font-label-bold text-label-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-sm shadow-md disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    Sending Code...
                  </>
                ) : (
                  "Send Reset Code"
                )}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-md">
              <Link
                href={`/reset-password?email=${encodeURIComponent(email)}`}
                className="w-full py-md bg-primary text-on-primary font-label-bold text-label-bold rounded-xl hover:opacity-90 text-center block shadow-md"
              >
                Enter Code & Set New Password →
              </Link>
            </div>
          )}

          <div className="mt-xl text-center">
            <Link href="/seller/login" className="font-body-sm text-body-sm text-primary font-bold hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Seller Sign In</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SellerForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center min-h-screen bg-surface-container-low">
          <span className="material-symbols-outlined animate-spin text-[36px] text-primary">sync</span>
        </div>
      }
    >
      <SellerForgotPasswordForm />
    </Suspense>
  );
}
