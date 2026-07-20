"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import HomeHeader from "@/components/home/HomeHeader";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { validatePassword } from "@/lib/password-policy";
import * as z from "zod";

const otpCodeSchema = z.string().length(6, "Verification code must be 6 digits.");

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const emailQuery = searchParams.get("email") || "";
  const tokenQuery = searchParams.get("token") || "";

  const [email, setEmail] = useState(emailQuery);
  const [code, setCode] = useState(tokenQuery);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (emailQuery) setEmail(emailQuery);
    if (tokenQuery) setCode(tokenQuery);
  }, [emailQuery, tokenQuery]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    if (!code || code.length < 4) {
      setError("Please enter the verification code received in your email.");
      return;
    }

    const passVal = validatePassword(newPassword);
    if (!passVal.isValid) {
      setError(passVal.errors[0]);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      // Reset password via Better-Auth
      const response = await authClient.resetPassword({
        newPassword: newPassword,
        token: code,
      });

      if (response.error) {
        setError(response.error.message || "Invalid or expired reset code. Please request a new one.");
      } else {
        setSuccessMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 1800);
      }
    } catch (err: any) {
      setError("Failed to reset password. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-low min-h-screen flex flex-col w-full text-on-surface">
      <HomeHeader userProfile={null} cartCount={0} sellerHref="/login?role=seller" />

      <main className="flex-grow flex flex-col items-center justify-center px-base py-xxl">
        <div className="w-full max-w-[460px] bg-white rounded-lg p-xl border border-border-gray shadow-sm">
          <div className="mb-xl text-center">
            <h1 className="font-headline-md text-headline-md text-primary mb-xs font-bold">
              Set New Password
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Create a new secure password for your MiniBrands account.
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

          <form className="flex flex-col gap-md" onSubmit={handleResetPassword}>
            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-bold text-on-surface">
                Email Address
              </label>
              <input
                className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md bg-white disabled:bg-surface-container-low"
                placeholder="name@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-bold text-on-surface">
                Verification Code / Reset Token
              </label>
              <input
                className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md bg-white font-mono tracking-wider"
                placeholder="Enter 6-digit code or token"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-bold text-on-surface">
                New Password
              </label>
              <div className="relative">
                <input
                  className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md bg-white"
                  placeholder="Enter new password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="absolute right-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px] hover:text-primary cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </button>
              </div>
              <PasswordStrengthMeter password={newPassword} />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-bold text-on-surface">
                Confirm New Password
              </label>
              <input
                className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md bg-white"
                placeholder="Retype new password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-md bg-primary text-on-primary font-label-bold text-label-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-sm mt-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  Resetting Password...
                </>
              ) : (
                "Reset Password & Sign In"
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center min-h-screen bg-surface-container-low">
          <span className="material-symbols-outlined animate-spin text-[36px] text-primary">sync</span>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
