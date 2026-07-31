"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import * as z from "zod";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

const emailSchema = z.string().email("Please enter a valid email address");
const otpCodeSchema = z
  .string()
  .length(6, "Verification code must be exactly 6 digits")
  .regex(/^\d+$/, "Verification code must be numeric");

export default function LoginForm() {
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
          router.refresh();
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
          router.refresh();
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

      {/* Main split layout container */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-[45fr_55fr] min-h-[calc(100vh-80px)]">
        {/* LEFT SIDE: Editorial brand section */}
        <div className="relative hidden lg:block overflow-hidden bg-slate-900">
          <Image
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=90"
            alt="MiniBrands fashion campaign"
            fill
            priority
            sizes="45vw"
            className="object-cover object-top opacity-85 transition-transform duration-10000 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/90 via-[#111827]/40 to-transparent" />
          
          {/* Overlay Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-16 text-white z-10">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF4D8D] mb-3">MiniBrands Edit</span>
            <h2 className="font-vl-heading text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-[-0.03em] max-w-[480px]">
              Discover independent fashion brands you&apos;ll actually love.
            </h2>
            <p className="mt-4 text-white/70 max-w-[420px] text-base leading-relaxed">
              Access curated boutique labels and shop expressive wear designed for the modern look.
            </p>
            
            {/* Trust Badges */}
            <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-x-6 gap-y-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <CheckCircle className="h-4.5 w-4.5 text-[#FF3E6C]" /> Verified Sellers
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <CheckCircle className="h-4.5 w-4.5 text-[#FF3E6C]" /> Secure Checkout
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <CheckCircle className="h-4.5 w-4.5 text-[#FF3E6C]" /> Fast Delivery
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Authentication form */}
        <main className="flex items-center justify-center p-6 sm:p-12 lg:p-16">
          <div className="w-full max-w-[460px] bg-white rounded-[28px] border border-[#ECECEC] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300">
            {/* Headline */}
            <div className="mb-8">
              <h1 className="font-vl-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827] mb-2">
                {roleIntent === "seller" ? "Seller Login" : "Welcome Back"}
              </h1>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                {roleIntent === "seller"
                  ? "Access your seller workspace and manage your boutique store."
                  : "Access your account and discover curated fashion labels."}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-[#F5F5F8] p-1 rounded-2xl mb-6 border border-[#ECECEC]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("password");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === "password"
                    ? "bg-white text-[#FF3E6C] shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("otp");
                  setOtpStep("email");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === "otp"
                    ? "bg-white text-[#FF3E6C] shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                Verification Code (OTP)
              </button>
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

            {/* Password Login Form */}
            {authMode === "password" ? (
              <form className="flex flex-col gap-5" onSubmit={handlePasswordLogin}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
                    <input
                      className="w-full h-[52px] pl-12 pr-4 border border-[#ECECEC] rounded-2xl outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] bg-white transition-all focus:border-[#FF3E6C] focus:shadow-[0_0_0_4px_rgba(255,62,108,0.1)]"
                      placeholder="Enter your email address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
                    <input
                      className="w-full h-[52px] pl-12 pr-12 border border-[#ECECEC] rounded-2xl outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] bg-white transition-all focus:border-[#FF3E6C] focus:shadow-[0_0_0_4px_rgba(255,62,108,0.1)]"
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#FF3E6C] transition-colors cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {password && <PasswordStrengthMeter password={password} />}
                </div>

                <div className="flex justify-between items-center mt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      className="w-4 h-4 rounded border-[#ECECEC] text-[#FF3E6C] focus:ring-[#FF3E6C] cursor-pointer"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                    />
                    <span className="text-xs font-semibold text-[#6B7280] group-hover:text-[#111827] select-none transition-colors">
                      Remember Me
                    </span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-[#FF3E6C] hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[52px] bg-[#FF3E6C] text-white font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_16px_rgba(255,62,108,0.25)]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            ) : (
              /* Email OTP Form */
              <form
                className="flex flex-col gap-5"
                onSubmit={otpStep === "email" ? handleSendCode : handleVerifyCode}
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
                    <input
                      className="w-full h-[52px] pl-12 pr-4 border border-[#ECECEC] rounded-2xl outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] bg-white transition-all focus:border-[#FF3E6C] focus:shadow-[0_0_0_4px_rgba(255,62,108,0.1)] disabled:bg-slate-50"
                      placeholder="Enter your email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading || otpStep === "otp"}
                      required
                    />
                  </div>
                </div>

                {otpStep === "otp" && (
                  <div className="flex flex-col gap-1.5 animate-fade-in-up">
                    <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                      6-Digit Verification Code
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-[52px] border border-[#ECECEC] rounded-2xl outline-none text-base text-[#111827] bg-white tracking-[0.25em] font-mono font-bold text-center transition-all focus:border-[#FF3E6C] focus:shadow-[0_0_0_4px_rgba(255,62,108,0.1)]"
                        placeholder="000000"
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        disabled={isLoading}
                        required
                        autoFocus
                      />
                      {resendTimer > 0 ? (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] select-none font-bold">
                          Resend in {resendTimer}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={isLoading}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#FF3E6C] hover:underline select-none font-bold cursor-pointer disabled:opacity-50"
                        >
                          Resend
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      className="w-4 h-4 rounded border-[#ECECEC] text-[#FF3E6C] focus:ring-[#FF3E6C] cursor-pointer"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                    />
                    <span className="text-xs font-semibold text-[#6B7280] group-hover:text-[#111827] select-none transition-colors">
                      Remember Me
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[52px] bg-[#FF3E6C] text-white font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_16px_rgba(255,62,108,0.25)]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {otpStep === "email" ? "Sending Code..." : "Verifying..."}
                    </>
                  ) : otpStep === "email" ? (
                    "Send Verification Code"
                  ) : (
                    "Verify & Sign In"
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-7 flex items-center">
              <div className="flex-grow border-t border-[#ECECEC]"></div>
              <span className="px-4 text-xs font-bold text-[#9CA3AF] bg-white select-none">
                OR
              </span>
              <div className="flex-grow border-t border-[#ECECEC]"></div>
            </div>

            {/* Social Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              type="button"
              className="w-full h-[52px] bg-white border border-[#ECECEC] rounded-2xl flex items-center justify-center gap-3 hover:bg-[#FAFAFC] active:scale-[0.98] transition-all cursor-pointer group disabled:opacity-50"
            >
              <img
                alt="Google"
                className="w-5 h-5 shrink-0"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-Lrs6fi30Roms51aPNqibpTJxhGIi-LcfaT89wBFttUbPyRfrRNE2MSZgpCQ31AkZ2CTh8WDhHATyL8nzrJvRSfxcUtuD9rrHY3ArHo03R3HrqX8oShu__qHNOOoCnTPJJCH_8fQkRs4upR4I5bs_EidjsmLr2f-xzSWlYOfSnzYVSYheCg0IdWgQoWcMYZVn-noWeZNz3RfVclzYsGIFrnl9pTgmPwe2LiGieG6lQXkS563oTSRBzFwCuxKrxLJ6bEXIrSqM8kxm"
              />
              <span className="text-sm font-bold text-[#111827] select-none">
                Continue with Google
              </span>
            </button>

            {/* Sign Up */}
            <div className="mt-8 text-center">
              <p className="text-sm text-[#6B7280]">
                New to MiniBrands?{" "}
                <Link
                  href={roleIntent === "seller" ? "/signup?role=seller" : "/signup"}
                  className="text-[#FF3E6C] font-bold hover:underline"
                >
                  Create an Account
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>

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
