"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import HomeHeader from "@/components/home/HomeHeader";
import * as z from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const otpCodeSchema = z
  .string()
  .length(6, "Verification code must be exactly 6 digits")
  .regex(/^\d+$/, "Verification code must be numeric");

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const roleIntent = searchParams.get("role") || "buyer";

  // Check if session already exists on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const { data: session } = await authClient.getSession();
        if (session && session.user) {
          if (roleIntent === "seller") {
            router.push("/seller/onboarding");
          } else {
            router.push("/products");
          }
        }
      } catch (err) {
        console.error("Failed to check active session:", err);
      }
    };
    checkActiveSession();
  }, [roleIntent, router]);

  // Resend code countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate email
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      setError(emailValidation.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "sign-in",
      });

      if (response.error) {
        setError(response.error.message || "Failed to send code. Please try again.");
      } else {
        setStep("otp");
        setResendTimer(30); // Disable resend for 30s
        setSuccessMessage(`Verification code sent to ${email}`);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate OTP code
    const otpValidation = otpCodeSchema.safeParse(otpCode);
    if (!otpValidation.success) {
      setError(otpValidation.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authClient.signIn.emailOtp({
        email: email,
        otp: otpCode,
        rememberMe: rememberMe,
      });

      if (response.error) {
        setError(response.error.message || "Invalid or expired verification code.");
      } else {
        // Successful login redirect based on role
        if (roleIntent === "seller") {
          router.push("/seller/onboarding");
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      setError("Verification failed. Please check your internet connection.");
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
        type: "sign-in",
      });
      if (response.error) {
        setError(response.error.message || "Failed to send code.");
      } else {
        setResendTimer(30);
        setSuccessMessage("Code resent successfully!");
      }
    } catch (err) {
      setError("Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: roleIntent === "seller" ? "/seller/onboarding" : "/",
      });
    } catch (err: any) {
      setError(err.message || "Google Authentication is not configured or failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(
      "MINIBRANDS uses secure passwordless verification. Simply enter your email and click Login to receive a code. No password is required!"
    );
  };

  const handleCreateAccountClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(
      "Enter your email and click Login. If you do not have an account yet, one will be created for you automatically!"
    );
  };

  return (
    <div className="bg-surface-container-low min-h-screen flex flex-col w-full text-on-surface">
      {/* TopNavBar (Shared Component) */}
      <HomeHeader
        userProfile={null}
        cartCount={0}
        sellerHref={roleIntent === "seller" ? "/seller/onboarding" : "/login?role=seller"}
      />

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center px-base py-xxl">
        {/* Login Card */}
        <div className="w-full max-w-[440px] bg-white rounded-lg p-xl login-card border border-border-gray shadow-sm">
          {/* Login Header */}
          <div className="mb-xl">
            <h1 className="font-headline-md text-headline-md text-primary mb-xs">
              {roleIntent === "seller" ? "Seller Login" : "Login"}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {roleIntent === "seller"
                ? "Access your seller workspace and manage your business."
                : "Access your account and discover the latest in fashion."}
            </p>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mb-4 p-md bg-error-container text-error text-body-md rounded font-bold border border-error/20 flex gap-2 items-center">
              <span className="material-symbols-outlined text-[20px]">
                warning
              </span>
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-md bg-surface-container-low text-success-green text-body-md rounded font-bold border border-success-green/20 flex gap-2 items-center">
              <span className="material-symbols-outlined text-[20px]">info</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form
            className="flex flex-col gap-lg"
            onSubmit={step === "email" ? handleSendCode : handleVerifyCode}
          >
            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-bold text-on-surface">
                Email or Mobile Number
              </label>
              <input
                className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-body-md bg-white disabled:bg-surface-container-low"
                placeholder="Enter your email or phone"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || step === "otp"}
                required
              />
            </div>

            {step === "email" ? (
              <div className="flex flex-col gap-xs animate-fade-in-up">
                <label className="font-label-bold text-label-bold text-on-surface">
                  Password
                </label>
                <div className="relative">
                  <input
                    className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-body-md bg-white"
                    placeholder="Enter password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    className="absolute right-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px] select-none hover:text-primary transition-colors cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    {showPassword ? "visibility_off" : "visibility"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-xs animate-fade-in-up">
                <label className="font-label-bold text-label-bold text-on-surface">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <input
                    className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-body-md bg-white tracking-[0.2em] font-mono font-bold"
                    placeholder="000000"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, ""))
                    }
                    disabled={isLoading}
                    required
                  />
                  {resendTimer > 0 ? (
                    <span className="absolute right-md top-1/2 -translate-y-1/2 text-body-sm text-text-muted select-none font-semibold">
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="absolute right-md top-1/2 -translate-y-1/2 text-body-sm text-primary hover:underline select-none font-semibold cursor-pointer disabled:opacity-50"
                    >
                      Resend
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <label className="flex items-center gap-sm cursor-pointer group">
                <input
                  className="w-4 h-4 rounded-sm border-outline-variant text-primary focus:ring-primary cursor-pointer"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface select-none">
                  Remember Me
                </span>
              </label>
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="font-body-sm text-body-sm text-primary hover:underline font-semibold bg-transparent border-none cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Primary Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-md bg-primary text-on-primary font-label-bold text-label-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    sync
                  </span>
                  {step === "email" ? "Sending Code..." : "Verifying..."}
                </>
              ) : step === "email" ? (
                "Login"
              ) : (
                "Verify & Login"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-xl flex items-center">
            <div className="flex-grow border-t border-outline-variant"></div>
            <span className="px-md font-body-sm text-body-sm text-on-surface-variant bg-white select-none">
              OR
            </span>
            <div className="flex-grow border-t border-outline-variant"></div>
          </div>

          {/* Social Login */}
          <div className="flex flex-col gap-md">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              type="button"
              className="w-full py-md bg-white border border-outline-variant rounded-lg flex items-center justify-center gap-md hover:bg-surface-container transition-colors cursor-pointer group disabled:opacity-50"
            >
              <img
                alt="Google"
                className="w-5 h-5"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-Lrs6fi30Roms51aPNqibpTJxhGIi-LcfaT89wBFttUbPyRfrRNE2MSZgpCQ31AkZ2CTh8WDhHATyL8nzrJvRSfxcUtuD9rrHY3ArHo03R3HrqX8oShu__qHNOOoCnTPJJCH_8fQkRs4upR4I5bs_EidjsmLr2f-xzSWlYOfSnzYVSYheCg0IdWgQoWcMYZVn-noWeZNz3RfVclzYsGIFrnl9pTgmPwe2LiGieG6lQXkS563oTSRBzFwCuxKrxLJ6bEXIrSqM8kxm"
              />
              <span className="font-label-bold text-label-bold text-on-surface select-none">
                Continue with Google
              </span>
            </button>
            <button
              onClick={() =>
                setError("Apple Login is not configured for this environment.")
              }
              disabled={isLoading}
              type="button"
              className="w-full py-md bg-white border border-outline-variant rounded-lg flex items-center justify-center gap-md hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[22px] text-on-surface">
                apps
              </span>
              <span className="font-label-bold text-label-bold text-on-surface select-none">
                Continue with Apple
              </span>
            </button>
          </div>

          {/* Sign Up */}
          <div className="mt-xl text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              New to MINIBRANDS?
              <button
                type="button"
                onClick={handleCreateAccountClick}
                className="text-primary font-bold hover:underline ml-xs cursor-pointer"
              >
                Create an Account
              </button>
            </p>
          </div>
        </div>

        {/* Trust Section */}
        <div className="mt-xl flex flex-wrap justify-center gap-xl opacity-80 select-none">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              verified_user
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Secure Login
            </span>
          </div>
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              shield
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Buyer Protection
            </span>
          </div>
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              lock
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Privacy Protected
            </span>
          </div>
        </div>
      </main>

      {/* Footer (Shared Component) */}
      <footer className="w-full py-xl px-base lg:px-xl flex flex-col md:flex-row justify-between items-center gap-base bg-surface-container-highest border-t border-outline-variant">
        <div className="flex flex-col items-center md:items-start gap-xs">
          <span className="font-headline-sm text-headline-sm font-bold text-primary">
            MINIBRANDS
          </span>
          <span className="font-body-sm text-body-sm text-on-surface">
            © 2024 MINIBRANDS India. All rights reserved. Secure Marketplace.
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-base">
          <Link
            className="font-body-sm text-body-sm text-secondary hover:text-primary transition-all cursor-pointer"
            href="/products"
          >
            Privacy Policy
          </Link>
          <Link
            className="font-body-sm text-body-sm text-secondary hover:text-primary transition-all cursor-pointer"
            href="/products"
          >
            Terms of Service
          </Link>
          <Link
            className="font-body-sm text-body-sm text-secondary hover:text-primary transition-all cursor-pointer"
            href="/products"
          >
            Buyer Protection
          </Link>
          <Link
            className="font-body-sm text-body-sm text-secondary hover:text-primary transition-all cursor-pointer"
            href="/products"
          >
            Contact Us
          </Link>
          <Link
            className="font-body-sm text-body-sm text-secondary hover:text-primary transition-all cursor-pointer"
            href="/products"
          >
            Track Order
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center min-h-screen bg-surface-container-low">
          <span className="material-symbols-outlined animate-spin text-[36px] text-primary">
            sync
          </span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
