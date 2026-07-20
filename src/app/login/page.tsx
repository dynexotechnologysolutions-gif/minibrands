"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import HomeHeader from "@/components/home/HomeHeader";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import * as z from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const otpCodeSchema = z
  .string()
  .length(6, "Verification code must be exactly 6 digits")
  .regex(/^\d+$/, "Verification code must be numeric");

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [authMode, setAuthMode] = useState<"password" | "otp">("password");
  const [otpStep, setOtpStep] = useState<"email" | "otp">("email");

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
        const res = await authClient.getSession().catch(() => null);
        if (res && res.data && res.data.user) {
          if (roleIntent === "seller") {
            router.push("/seller/onboarding");
          } else {
            const redirectTo = searchParams.get("redirectTo") || "/";
            router.push(redirectTo);
          }
        }
      } catch (err) {
        // Silently handle session check failure on unauthenticated page
      }
    };
    checkActiveSession();
  }, [roleIntent, searchParams, router]);

  // Resend code countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Email + Password Sign In
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      setError(emailValidation.error.issues[0].message);
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authClient.signIn.email({
        email: email,
        password: password,
        rememberMe: rememberMe,
      });

      if (response.error) {
        setError(response.error.message || "Invalid email or password. Please check your credentials.");
      } else {
        setSuccessMessage("Login successful! Redirecting...");
        setTimeout(() => {
          if (roleIntent === "seller") {
            router.push("/seller/onboarding");
          } else {
            const redirectTo = searchParams.get("redirectTo") || "/";
            router.push(redirectTo);
          }
        }, 1000);
      }
    } catch (err: any) {
      setError("Login failed. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Email OTP - Send Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

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
        setOtpStep("otp");
        setResendTimer(30);
        setSuccessMessage(`Verification code sent to ${email}`);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Email OTP - Verify Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

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
        setSuccessMessage("Code verified! Redirecting...");
        setTimeout(() => {
          if (roleIntent === "seller") {
            router.push("/seller/onboarding");
          } else {
            const redirectTo = searchParams.get("redirectTo") || "/";
            router.push(redirectTo);
          }
        }, 1000);
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
      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL: roleIntent === "seller" ? "/seller/onboarding" : searchParams.get("redirectTo") || "/",
      });
      if (res?.error) {
        setError(res.error.message || "Google OAuth requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file.");
      }
    } catch (err: any) {
      setError(err.message || "Google Authentication failed. Please verify GOOGLE_CLIENT_ID in your .env file.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-low min-h-screen flex flex-col w-full text-on-surface">
      <HomeHeader
        userProfile={null}
        cartCount={0}
        sellerHref={roleIntent === "seller" ? "/seller/onboarding" : "/login?role=seller"}
      />

      <main className="flex-grow flex flex-col items-center justify-center px-base py-xxl">
        <div className="w-full max-w-[440px] bg-white rounded-lg p-xl login-card border border-border-gray shadow-sm">
          {/* Header */}
          <div className="mb-lg">
            <h1 className="font-headline-md text-headline-md text-primary mb-xs font-bold">
              {roleIntent === "seller" ? "Seller Login" : "Welcome Back"}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {roleIntent === "seller"
                ? "Access your seller workspace and manage your boutique store."
                : "Access your account and discover curated artisanal fashion."}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-surface-container-low p-1 rounded-lg mb-lg border border-outline-variant">
            <button
              type="button"
              onClick={() => {
                setAuthMode("password");
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-label-bold font-bold text-xs sm:text-sm rounded-md transition-all cursor-pointer ${
                authMode === "password"
                  ? "bg-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Password Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("otp");
                setOtpStep("email");
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-label-bold font-bold text-xs sm:text-sm rounded-md transition-all cursor-pointer ${
                authMode === "otp"
                  ? "bg-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Code (OTP) Login
            </button>
          </div>

          {/* Feedback Banners */}
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

          {/* Password Login Form */}
          {authMode === "password" ? (
            <form className="flex flex-col gap-lg" onSubmit={handlePasswordLogin}>
              <div className="flex flex-col gap-xs">
                <label className="font-label-bold text-label-bold text-on-surface">
                  Email Address
                </label>
                <input
                  className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-body-md bg-white"
                  placeholder="Enter your email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-bold text-label-bold text-on-surface">
                  Password
                </label>
                <div className="relative">
                  <input
                    className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-body-md bg-white"
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <button
                    className="absolute right-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px] select-none hover:text-primary transition-colors cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    {showPassword ? "visibility_off" : "visibility"}
                  </button>
                </div>
                {password && <PasswordStrengthMeter password={password} />}
              </div>

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
                <Link
                  href="/forgot-password"
                  className="font-body-sm text-body-sm text-primary hover:underline font-semibold"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-md bg-primary text-on-primary font-label-bold text-label-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    Signing In...
                  </>
                ) : (
                  "Log In"
                )}
              </button>
            </form>
          ) : (
            /* Email OTP Form */
            <form
              className="flex flex-col gap-lg"
              onSubmit={otpStep === "email" ? handleSendCode : handleVerifyCode}
            >
              <div className="flex flex-col gap-xs">
                <label className="font-label-bold text-label-bold text-on-surface">
                  Email Address
                </label>
                <input
                  className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-body-md bg-white disabled:bg-surface-container-low"
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || otpStep === "otp"}
                  required
                />
              </div>

              {otpStep === "otp" && (
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
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
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
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-md bg-primary text-on-primary font-label-bold text-label-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    {otpStep === "email" ? "Sending Code..." : "Verifying..."}
                  </>
                ) : otpStep === "email" ? (
                  "Send Verification Code"
                ) : (
                  "Verify & Log In"
                )}
              </button>
            </form>
          )}

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
          </div>

          {/* Sign Up */}
          <div className="mt-xl text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              New to MINIBRANDS?{" "}
              <Link
                href={roleIntent === "seller" ? "/signup?role=seller" : "/signup"}
                className="text-primary font-bold hover:underline"
              >
                Create an Account
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
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

      {/* Footer */}
      <footer className="w-full py-xl px-base lg:px-xl flex flex-col md:flex-row justify-between items-center gap-base bg-surface-container-highest border-t border-outline-variant">
        <div className="flex flex-col items-center md:items-start gap-xs">
          <span className="font-headline-sm text-headline-sm font-bold text-primary">
            MINIBRANDS
          </span>
          <span className="font-body-sm text-body-sm text-on-surface">
            © 2026 MINIBRANDS India. All rights reserved. Secure Marketplace.
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-base">
          <Link className="font-body-sm text-body-sm text-secondary hover:text-primary transition-all" href="/products">
            Privacy Policy
          </Link>
          <Link className="font-body-sm text-body-sm text-secondary hover:text-primary transition-all" href="/products">
            Terms of Service
          </Link>
          <Link className="font-body-sm text-body-sm text-secondary hover:text-primary transition-all" href="/products">
            Buyer Protection
          </Link>
          <Link className="font-body-sm text-body-sm text-secondary hover:text-primary transition-all" href="/products">
            Contact Us
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
          <span className="material-symbols-outlined animate-spin text-[36px] text-primary">sync</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
