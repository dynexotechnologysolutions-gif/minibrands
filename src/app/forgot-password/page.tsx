"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import HomeHeader from "@/components/home/HomeHeader";
import * as z from "zod";

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
      // Send OTP code / reset email token
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
    <div className="bg-surface-container-low min-h-screen flex flex-col w-full text-on-surface">
      <HomeHeader userProfile={null} cartCount={0} sellerHref="/login?role=seller" />

      <main className="flex-grow flex flex-col items-center justify-center px-base py-xxl">
        <div className="w-full max-w-[440px] bg-white rounded-lg p-xl border border-border-gray shadow-sm">
          <div className="mb-xl text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-md text-primary">
              <span className="material-symbols-outlined text-[28px]">lock_reset</span>
            </div>
            <h1 className="font-headline-md text-headline-md text-primary mb-xs font-bold">
              Forgot Password?
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Enter your registered email address and we&apos;ll send you a password reset code.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-md bg-error-container text-error text-body-md rounded font-bold border border-error/20 flex gap-2 items-center">
              <span className="material-symbols-outlined text-[20px]">warning</span>
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-md bg-surface-container-low text-success-green text-body-md rounded font-bold border border-success-green/20 flex gap-2 items-center">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>{successMessage}</span>
            </div>
          )}

          {!isSubmitted ? (
            <form className="flex flex-col gap-lg" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-xs">
                <label className="font-label-bold text-label-bold text-on-surface">
                  Email Address
                </label>
                <input
                  className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md bg-white"
                  placeholder="Enter your email"
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
                className="w-full py-md bg-primary text-on-primary font-label-bold text-label-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    Sending Reset Code...
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
                className="w-full py-md bg-primary text-on-primary font-label-bold text-label-bold rounded-lg hover:opacity-90 text-center block"
              >
                Enter Reset Code & Set New Password →
              </Link>
            </div>
          )}

          <div className="mt-xl text-center">
            <Link href="/login" className="font-body-sm text-body-sm text-primary font-bold hover:underline flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center min-h-screen bg-surface-container-low">
          <span className="material-symbols-outlined animate-spin text-[36px] text-primary">sync</span>
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
