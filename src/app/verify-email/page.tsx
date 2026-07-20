"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import HomeHeader from "@/components/home/HomeHeader";
import * as z from "zod";

const otpSchema = z.string().length(6, "Verification code must be 6 digits.");

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const val = otpSchema.safeParse(otpCode);
    if (!val.success) {
      setError(val.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authClient.signIn.emailOtp({
        email: email,
        otp: otpCode,
      });

      if (response.error) {
        setError(response.error.message || "Invalid or expired verification code.");
      } else {
        setSuccessMessage("Email verified successfully! Activating session...");
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (err: any) {
      setError("Failed to verify email code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "email-verification",
      });
      if (response.error) {
        setError(response.error.message || "Failed to resend code.");
      } else {
        setResendTimer(30);
        setSuccessMessage("New verification code sent!");
      }
    } catch (err) {
      setError("Failed to resend verification code.");
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
              <span className="material-symbols-outlined text-[28px]">mark_email_read</span>
            </div>
            <h1 className="font-headline-md text-headline-md text-primary mb-xs font-bold">
              Verify Your Email
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Enter the 6-digit verification code sent to <strong>{email || "your email"}</strong>.
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

          <form className="flex flex-col gap-lg" onSubmit={handleVerify}>
            {!emailParam && (
              <div className="flex flex-col gap-xs">
                <label className="font-label-bold text-label-bold text-on-surface">
                  Email Address
                </label>
                <input
                  className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md bg-white"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-bold text-on-surface">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <input
                  className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md bg-white tracking-[0.25em] font-mono font-bold text-center text-lg"
                  placeholder="000000"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-body-sm">
              <span className="text-text-muted">Didn&apos;t receive the code?</span>
              {resendTimer > 0 ? (
                <span className="text-text-muted font-semibold">Resend in {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-primary font-bold hover:underline cursor-pointer disabled:opacity-50"
                >
                  Resend Code
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-md bg-primary text-on-primary font-label-bold text-label-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  Verifying...
                </>
              ) : (
                "Verify & Activate Account"
              )}
            </button>
          </form>

          <div className="mt-xl text-center">
            <Link href="/login" className="font-body-sm text-body-sm text-primary font-bold hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center min-h-screen bg-surface-container-low">
          <span className="material-symbols-outlined animate-spin text-[36px] text-primary">sync</span>
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
