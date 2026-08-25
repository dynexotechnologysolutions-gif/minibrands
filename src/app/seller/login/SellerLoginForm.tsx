"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import HomeHeader from "@/components/home/HomeHeader";
import { Building2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import * as z from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

export default function SellerLoginForm() {
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
          router.refresh();
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
          <div className="flex items-center gap-xs text-[#0F7F7F] font-bold text-xs uppercase tracking-widest mb-xs">
            <Building2 className="w-4 h-4 text-[#0F7F7F]" />
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
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="font-label-bold text-label-bold text-on-surface select-none">
              Sign In with Google
            </span>
          </button>

          {/* Register Callout */}
          <div className="mt-xl pt-lg border-t border-outline-variant text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Want to start selling on MiniBrands?{" "}
              <Link
                href="/seller/onboarding"
                className="text-[#0F7F7F] font-bold hover:underline"
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
