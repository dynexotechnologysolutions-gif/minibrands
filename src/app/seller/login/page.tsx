"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import HomeHeader from "@/components/home/HomeHeader";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { Building2, ShieldCheck, Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import * as z from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

function SellerLoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = searchParams.get("redirectTo") || "/seller/dashboard";

  // Check if session already exists on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const res = await authClient.getSession().catch(() => null);
        if (res?.data?.user) {
          router.push("/seller/dashboard");
        }
      } catch (err) {
        // Ignore session check errors on unauthenticated page
      }
    };
    checkActiveSession();
  }, [router]);

  // Handle Seller Email + Password Login
  const handleSellerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const emailVal = emailSchema.safeParse(email);
    if (!emailVal.success) {
      setError(emailVal.error.issues[0].message);
      return;
    }

    if (!password) {
      setError("Please enter your seller password.");
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
        setError(response.error.message || "Invalid seller credentials. Please check your email and password.");
      } else {
        setSuccessMessage("Login successful! Entering Seller Portal...");
        setTimeout(() => {
          router.push(redirectTo);
        }, 800);
      }
    } catch (err: any) {
      setError("Login failed. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth Login for Sellers
  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/seller/dashboard",
      });
      if (res?.error) {
        setError(res.error.message || "Google OAuth requires GOOGLE_CLIENT_ID in your .env file.");
      }
    } catch (err: any) {
      setError(err.message || "Google Authentication failed. Please check your settings.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-low min-h-screen flex flex-col w-full text-on-surface font-sans">
      <HomeHeader
        userProfile={null}
        cartCount={0}
        sellerHref="/seller/onboarding"
      />

      <main className="flex-grow flex flex-col items-center justify-center px-base py-xxl">
        <div className="w-full max-w-[460px] bg-white rounded-2xl p-xl border border-border-gray shadow-md">
          {/* Header Badge */}
          <div className="flex items-center gap-xs text-indigo-600 font-bold text-xs uppercase tracking-widest mb-xs">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Seller Workspace Portal</span>
          </div>

          <h1 className="font-headline-md text-headline-md text-primary mb-xs font-bold font-display">
            Seller Sign In
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
            Manage your boutique store, inventory, orders, and financial payouts.
          </p>

          {/* Feedback Banners */}
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

          {/* Seller Login Form */}
          <form className="flex flex-col gap-lg" onSubmit={handleSellerLogin}>
            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-bold text-on-surface">
                Seller Email Address
              </label>
              <input
                className="w-full p-md border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-body-md bg-white"
                placeholder="store@boutique.com"
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
                  className="w-full p-md border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-body-md bg-white"
                  placeholder="Enter seller password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="absolute right-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px] hover:text-primary transition-colors cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </button>
              </div>
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
                  Keep me signed in
                </span>
              </label>
              <Link
                href="/seller/forgot-password"
                className="font-body-sm text-body-sm text-primary hover:underline font-bold"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-md bg-primary text-on-primary font-label-bold text-label-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-sm shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  Signing In...
                </>
              ) : (
                <>
                  <span>Sign In to Seller Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Sign-in */}
          <div className="relative my-xl flex items-center">
            <div className="flex-grow border-t border-outline-variant"></div>
            <span className="px-md font-body-sm text-body-sm text-on-surface-variant bg-white select-none">
              OR
            </span>
            <div className="flex-grow border-t border-outline-variant"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            type="button"
            className="w-full py-md bg-white border border-outline-variant rounded-xl flex items-center justify-center gap-md hover:bg-surface-container transition-colors cursor-pointer group disabled:opacity-50"
          >
            <img
              alt="Google"
              className="w-5 h-5"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-Lrs6fi30Roms51aPNqibpTJxhGIi-LcfaT89wBFttUbPyRfrRNE2MSZgpCQ31AkZ2CTh8WDhHATyL8nzrJvRSfxcUtuD9rrHY3ArHo03R3HrqX8oShu__qHNOOoCnTPJJCH_8fQkRs4upR4I5bs_EidjsmLr2f-xzSWlYOfSnzYVSYheCg0IdWgQoWcMYZVn-noWeZNz3RfVclzYsGIFrnl9pTgmPwe2LiGieG6lQXkS563oTSRBzFwCuxKrxLJ6bEXIrSqM8kxm"
            />
            <span className="font-label-bold text-label-bold text-on-surface select-none">
              Sign In with Google
            </span>
          </button>

          {/* Register Callout */}
          <div className="mt-xl pt-lg border-t border-outline-variant text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Want to start selling on Velvet Lane?{" "}
              <Link
                href="/seller/onboarding"
                className="text-indigo-600 font-bold hover:underline"
              >
                Become a Seller
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SellerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center min-h-screen bg-surface-container-low">
          <span className="material-symbols-outlined animate-spin text-[36px] text-primary">sync</span>
        </div>
      }
    >
      <SellerLoginForm />
    </Suspense>
  );
}
