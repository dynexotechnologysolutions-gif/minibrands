"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { validatePassword } from "@/lib/password-policy";
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
  Store,
  User,
} from "lucide-react";

const emailSchema = z.string().email("Please enter a valid email address.");

function SignupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const roleParam = searchParams.get("role") || "buyer";
  const [role, setRole] = useState<"BUYER" | "SELLER">(
    roleParam === "seller" ? "SELLER" : "BUYER"
  );

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync role selection if query param changes
  useEffect(() => {
    if (roleParam === "seller") setRole("SELLER");
  }, [roleParam]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    const emailVal = emailSchema.safeParse(email);
    if (!emailVal.success) {
      setError(emailVal.error.issues[0].message);
      return;
    }

    if (role === "SELLER" && !businessName.trim()) {
      setError("Please enter your business or boutique name.");
      return;
    }

    const passValidation = validatePassword(password);
    if (!passValidation.isValid) {
      setError(passValidation.errors[0]);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please retype your password.");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authClient.signUp.email({
        email: email,
        password: password,
        name: name,
        callbackURL: role === "SELLER" ? "/seller/onboarding" : "/",
      });

      if (response.error) {
        setError(response.error.message || "Signup failed. Email may already be in use.");
      } else {
        if (role !== "SELLER") {
          try {
            await authClient.emailOtp.sendVerificationOtp({
              email: email,
              type: "email-verification",
            });
          } catch (otpErr) {
            console.error("Failed to auto-send verification OTP on registration:", otpErr);
          }
        }
        setSuccessMessage("Account created successfully! Redirecting...");
        setTimeout(() => {
          if (role === "SELLER") {
            router.push("/seller/onboarding");
          } else {
            router.push("/verify-email?email=" + encodeURIComponent(email));
          }
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during signup.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL: role === "SELLER" ? "/seller/onboarding" : "/",
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
              style={{ background: "linear-gradient(135deg, #0F7F7F 0%, #0d3b36 100%)" }}
            >
              M
            </span>
            <span className="font-vl-heading text-lg font-extrabold tracking-[-0.04em] text-[#111827]">MiniBrands</span>
          </Link>
          <Link
            href="/faqs"
            className="text-sm font-semibold text-[#6B7280] hover:text-[#0F7F7F] transition-colors"
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
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=90"
            alt="MiniBrands boutique owner campaign"
            fill
            priority
            sizes="45vw"
            className="object-cover object-top opacity-85 transition-transform duration-10000 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/90 via-[#111827]/40 to-transparent" />
          
          {/* Overlay Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-16 text-white z-10">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#0F7F7F] mb-3">Join Marketplace</span>
            <h2 className="font-vl-heading text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-[-0.03em] max-w-[480px]">
              Start your fashion journey with MiniBrands.
            </h2>
            <p className="mt-4 text-white/70 max-w-[420px] text-base leading-relaxed">
              Discover unique creators, support small local labels, or scale your own boutique brand across the country.
            </p>
            
            {/* Trust Badges */}
            <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-x-6 gap-y-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <CheckCircle className="h-4.5 w-4.5 text-[#0F7F7F]" /> Creative Designers
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <CheckCircle className="h-4.5 w-4.5 text-[#0F7F7F]" /> Fast Onboarding
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <CheckCircle className="h-4.5 w-4.5 text-[#0F7F7F]" /> Complete Control
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Authentication form */}
        <main className="flex items-center justify-center p-6 sm:p-12 lg:p-16">
          <div className="w-full max-w-[480px] bg-white rounded-[28px] border border-[#ECECEC] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300">
            {/* Headline */}
            <div className="mb-8 text-center sm:text-left">
              <h1 className="font-vl-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827] mb-2">
                {role === "SELLER" ? "Create Boutique Seller Account" : "Create Your Account"}
              </h1>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                {role === "SELLER"
                  ? "Join MiniBrands to launch your fashion store and reach thousands of buyers."
                  : "Discover curated independent fashion and track your orders seamlessly."}
              </p>
            </div>

            {/* Role Switcher Pills */}
            <div className="flex bg-[#F5F5F8] p-1 rounded-2xl mb-6 border border-[#ECECEC]">
              <button
                type="button"
                onClick={() => setRole("BUYER")}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  role === "BUYER"
                    ? "bg-white text-[#0F7F7F] shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                Buyer Account
              </button>
              <button
                type="button"
                onClick={() => setRole("SELLER")}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  role === "SELLER"
                    ? "bg-white text-[#0F7F7F] shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                Seller Account
              </button>
            </div>

            {/* Error & Success Banners */}
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

            {/* Google Quick Signup */}
            <button
              onClick={handleGoogleSignup}
              disabled={isLoading}
              type="button"
              className="w-full h-[52px] bg-white border border-[#ECECEC] rounded-2xl flex items-center justify-center gap-3 hover:bg-[#FAFAFC] active:scale-[0.98] transition-all cursor-pointer mb-6 group disabled:opacity-50"
            >
              <img
                alt="Google"
                className="w-5 h-5 shrink-0"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-Lrs6fi30Roms51aPNqibpTJxhGIi-LcfaT89wBFttUbPyRfrRNE2MSZgpCQ31AkZ2CTh8WDhHATyL8nzrJvRSfxcUtuD9rrHY3ArHo03R3HrqX8oShu__qHNOOoCnTPJJCH_8fQkRs4upR4I5bs_EidjsmLr2f-xzSWlYOfSnzYVSYheCg0IdWgQoWcMYZVn-noWeZNz3RfVclzYsGIFrnl9pTgmPwe2LiGieG6lQXkS563oTSRBzFwCuxKrxLJ6bEXIrSqM8kxm"
              />
              <span className="text-sm font-bold text-[#111827] select-none">
                Sign up with Google
              </span>
            </button>

            <div className="relative my-6 flex items-center">
              <div className="flex-grow border-t border-[#ECECEC]"></div>
              <span className="px-4 text-[10px] font-bold text-[#9CA3AF] tracking-wider uppercase bg-white select-none">
                OR SIGN UP WITH EMAIL
              </span>
              <div className="flex-grow border-t border-[#ECECEC]"></div>
            </div>

            {/* Form */}
            <form className="flex flex-col gap-4" onSubmit={handleSignup}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
                  <input
                    className="w-full h-[52px] pl-12 pr-4 border border-[#ECECEC] rounded-2xl outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] bg-white transition-all focus:border-[#0F7F7F] focus:shadow-[0_0_0_4px_rgba(15,127,127,0.1)]"
                    placeholder="e.g. Ananya Sharma"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {role === "SELLER" && (
                <div className="flex flex-col gap-1.5 animate-fade-in-up">
                  <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                    Business / Store Name
                  </label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
                    <input
                      className="w-full h-[52px] pl-12 pr-4 border border-[#ECECEC] rounded-2xl outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] bg-white transition-all focus:border-[#0F7F7F] focus:shadow-[0_0_0_4px_rgba(15,127,127,0.1)]"
                      placeholder="e.g. Velvet Couture Studio"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
                  <input
                    className="w-full h-[52px] pl-12 pr-4 border border-[#ECECEC] rounded-2xl outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] bg-white transition-all focus:border-[#0F7F7F] focus:shadow-[0_0_0_4px_rgba(15,127,127,0.1)]"
                    placeholder="name@example.com"
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
                    className="w-full h-[52px] pl-12 pr-12 border border-[#ECECEC] rounded-2xl outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] bg-white transition-all focus:border-[#0F7F7F] focus:shadow-[0_0_0_4px_rgba(15,127,127,0.1)]"
                    placeholder="Create a strong password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#0F7F7F] transition-colors cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={password} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
                  <input
                    className="w-full h-[52px] pl-12 pr-4 border border-[#ECECEC] rounded-2xl outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] bg-white transition-all focus:border-[#0F7F7F] focus:shadow-[0_0_0_4px_rgba(15,127,127,0.1)]"
                    placeholder="Retype password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer mt-2 leading-tight">
                <input
                  className="w-4 h-4 mt-0.5 rounded border-[#ECECEC] text-[#0F7F7F] focus:ring-[#0F7F7F] cursor-pointer shrink-0"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="text-xs font-semibold text-[#6B7280] select-none">
                  I agree to MiniBrands&apos;s{" "}
                  <Link href="/terms" className="text-[#0F7F7F] font-bold hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[#0F7F7F] font-bold hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[52px] mt-4 bg-[#0F7F7F] text-white font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_16px_rgba(15,127,127,0.25)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Log In redirect */}
            <div className="mt-8 text-center">
              <p className="text-sm text-[#6B7280]">
                Already have an account?{" "}
                <Link
                  href={role === "SELLER" ? "/login?role=seller" : "/login"}
                  className="text-[#0F7F7F] font-bold hover:underline"
                >
                  Log In
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
            <ShieldCheck className="h-4 w-4 text-[#0F7F7F]" /> Secure SSL Connection
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
            <ShieldCheck className="h-4 w-4 text-[#0F7F7F]" /> Data Encrypted
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
            <ShieldCheck className="h-4 w-4 text-[#0F7F7F]" /> Privacy Protected
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center min-h-screen bg-[#FAFAFC]">
          <Loader2 className="h-8 w-8 animate-spin text-[#0F7F7F]" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
