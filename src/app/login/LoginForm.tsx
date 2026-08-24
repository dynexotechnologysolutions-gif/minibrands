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

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

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
        fetch("/api/cart/merge-guest", { method: "POST" }).catch(() => {});
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
    } catch {
      setError("Login failed. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

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
    } catch {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

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
        fetch("/api/cart/merge-guest", { method: "POST" }).catch(() => {});
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
    } catch {
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
    } catch {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Google Authentication failed. Please verify GOOGLE_CLIENT_ID in your .env file.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-vl-surface min-h-screen flex flex-col w-full text-vl-ink font-sans">
      {/* Header — MiniBrands native */}
      <header className="sticky top-0 z-50 w-full border-b border-vl-border/80 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="MiniBrands home">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-vl-heading text-lg font-extrabold text-white shadow-md transition-all duration-200 group-hover:scale-105 group-hover:rotate-3"
              style={{ background: "linear-gradient(135deg, #0F7F7F 0%, #0d3b36 100%)" }}
            >
              M
            </span>
            <span className="font-vl-heading text-lg font-extrabold tracking-[-0.04em] text-vl-ink">MiniBrands</span>
          </Link>
          <Link href="/faqs" className="text-sm font-semibold text-vl-muted hover:text-vl-primary transition-colors">
            Need Help?
          </Link>
        </div>
      </header>

      {/* Split layout */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-[45fr_55fr] min-h-[calc(100vh-80px)]">
        {/* LEFT — Editorial */}
        <div className="relative hidden lg:block overflow-hidden bg-[#0d3b36]">
          <Image
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=90"
            alt="MiniBrands fashion campaign"
            fill
            priority
            sizes="45vw"
            className="object-cover object-top opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-vl-ink/90 via-vl-ink/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-16 text-white z-10">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 mb-3">MiniBrands Edit</span>
            <h2 className="font-vl-heading text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-[-0.03em] max-w-[480px]">
              Discover independent fashion brands you&apos;ll actually love.
            </h2>
            <p className="mt-4 text-white/70 max-w-[420px] text-base leading-relaxed">
              Access curated boutique labels and shop expressive wear designed for the modern look.
            </p>
            <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-x-6 gap-y-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <CheckCircle className="h-4.5 w-4.5 text-white" /> Verified Sellers
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <CheckCircle className="h-4.5 w-4.5 text-white" /> Secure Checkout
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <CheckCircle className="h-4.5 w-4.5 text-white" /> Fast Delivery
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <main className="flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-vl-surface">
          <div className="w-full max-w-[460px] bg-vl-card rounded-vl-card border border-vl-border p-6 sm:p-10 shadow-vl-soft">
            <div className="mb-8">
              <h1 className="font-vl-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-vl-ink mb-2">
                {roleIntent === "seller" ? "Seller Login" : "Welcome Back"}
              </h1>
              <p className="text-sm text-vl-muted leading-relaxed">
                {roleIntent === "seller"
                  ? "Access your seller workspace and manage your boutique store."
                  : "Access your account and discover curated fashion labels."}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-vl-surface p-1 rounded-2xl mb-6 border border-vl-border">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => {
                  setAuthMode("password");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === "password" ? "bg-white text-vl-primary shadow-sm border border-vl-border" : "text-vl-muted hover:text-vl-ink"
                }`}
              >
                Password
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => {
                  setAuthMode("otp");
                  setOtpStep("email");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === "otp" ? "bg-white text-vl-primary shadow-sm border border-vl-border" : "text-vl-muted hover:text-vl-ink"
                }`}
              >
                Verification Code (OTP)
              </button>
            </div>

            {error && (
              <div className="mb-5 p-4 bg-red-50 text-vl-danger text-sm rounded-2xl border border-red-100 flex gap-2.5 items-start">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-5 p-4 bg-emerald-50 text-vl-success text-sm rounded-2xl border border-emerald-100 flex gap-2.5 items-start">
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {authMode === "password" ? (
              <form className="flex flex-col gap-5" onSubmit={handlePasswordLogin}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-vl-ink uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-vl-muted" />
                    <input
                      suppressHydrationWarning
                      className="w-full h-[52px] pl-12 pr-4 border border-vl-border rounded-2xl outline-none text-sm text-vl-ink placeholder:text-vl-muted bg-white transition-all focus:border-vl-primary focus:shadow-[0_0_0_4px_rgba(15,127,127,0.12)]"
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
                  <label className="text-xs font-bold text-vl-ink uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-vl-muted" />
                    <input
                      suppressHydrationWarning
                      className="w-full h-[52px] pl-12 pr-12 border border-vl-border rounded-2xl outline-none text-sm text-vl-ink placeholder:text-vl-muted bg-white transition-all focus:border-vl-primary focus:shadow-[0_0_0_4px_rgba(15,127,127,0.12)]"
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <button
                      suppressHydrationWarning
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-vl-muted hover:text-vl-primary transition-colors cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {password && <PasswordStrengthMeter password={password} />}
                </div>

                <div className="flex justify-between items-center mt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      className="w-4 h-4 rounded border-vl-border text-vl-primary focus:ring-vl-primary cursor-pointer"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                    />
                    <span className="text-xs font-semibold text-vl-muted group-hover:text-vl-ink select-none transition-colors">Remember Me</span>
                  </label>
                  <Link href="/forgot-password" className="text-xs font-bold text-vl-primary hover:underline">
                    Forgot Password?
                  </Link>
                </div>

                <button
                  suppressHydrationWarning
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[52px] bg-vl-primary text-white font-bold rounded-2xl hover:bg-vl-primary-strong active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_16px_rgba(15,127,127,0.2)]"
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
              <form className="flex flex-col gap-5" onSubmit={otpStep === "email" ? handleSendCode : handleVerifyCode}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-vl-ink uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-vl-muted" />
                    <input
                      suppressHydrationWarning
                      className="w-full h-[52px] pl-12 pr-4 border border-vl-border rounded-2xl outline-none text-sm text-vl-ink placeholder:text-vl-muted bg-white transition-all focus:border-vl-primary focus:shadow-[0_0_0_4px_rgba(15,127,127,0.12)] disabled:bg-vl-surface"
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
                    <label className="text-xs font-bold text-vl-ink uppercase tracking-wider">6-Digit Verification Code</label>
                    <div className="relative">
                      <input
                        suppressHydrationWarning
                        className="w-full h-[52px] border border-vl-border rounded-2xl outline-none text-base text-vl-ink bg-white tracking-[0.25em] font-mono font-bold text-center transition-all focus:border-vl-primary focus:shadow-[0_0_0_4px_rgba(15,127,127,0.12)]"
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
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-vl-muted select-none font-bold">Resend in {resendTimer}s</span>
                      ) : (
                        <button
                          suppressHydrationWarning
                          type="button"
                          onClick={handleResendCode}
                          disabled={isLoading}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-vl-primary hover:underline select-none font-bold cursor-pointer disabled:opacity-50"
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
                      className="w-4 h-4 rounded border-vl-border text-vl-primary focus:ring-vl-primary cursor-pointer"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                    />
                    <span className="text-xs font-semibold text-vl-muted group-hover:text-vl-ink select-none transition-colors">Remember Me</span>
                  </label>
                </div>

                <button
                  suppressHydrationWarning
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[52px] bg-vl-primary text-white font-bold rounded-2xl hover:bg-vl-primary-strong active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_16px_rgba(15,127,127,0.2)]"
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

            <div className="relative my-7 flex items-center">
              <div className="flex-grow border-t border-vl-border"></div>
              <span className="px-4 text-xs font-bold text-vl-muted bg-vl-card select-none">OR</span>
              <div className="flex-grow border-t border-vl-border"></div>
            </div>

            <button
              suppressHydrationWarning
              onClick={handleGoogleLogin}
              disabled={isLoading}
              type="button"
              className="w-full h-[52px] bg-white border border-vl-border rounded-2xl flex items-center justify-center gap-3 hover:bg-vl-surface active:scale-[0.98] transition-all cursor-pointer group disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-sm font-bold text-vl-ink select-none">Continue with Google</span>
            </button>

            <div className="mt-8 text-center">
              <p className="text-sm text-vl-muted">
                New to MiniBrands?{" "}
                <Link href={roleIntent === "seller" ? "/signup?role=seller" : "/signup"} className="text-vl-primary font-bold hover:underline">
                  Create an Account
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>

      <footer className="w-full bg-vl-surface border-t border-vl-border py-6 select-none mt-auto">
        <div className="max-w-[1440px] mx-auto px-4 flex flex-wrap justify-center gap-x-8 gap-y-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-vl-muted">
            <ShieldCheck className="h-4 w-4 text-vl-primary" /> Secure SSL Connection
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-vl-muted">
            <ShieldCheck className="h-4 w-4 text-vl-primary" /> Data Encrypted
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-vl-muted">
            <ShieldCheck className="h-4 w-4 text-vl-primary" /> Privacy Protected
          </span>
        </div>
      </footer>
    </div>
  );
}
