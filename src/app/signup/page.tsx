"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import HomeHeader from "@/components/home/HomeHeader";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { validatePassword } from "@/lib/password-policy";
import * as z from "zod";

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
      // 1. Sign up via email & password in Better-Auth
      const response = await authClient.signUp.email({
        email: email,
        password: password,
        name: name,
        callbackURL: role === "SELLER" ? "/seller/onboarding" : "/",
      });

      if (response.error) {
        setError(response.error.message || "Signup failed. Email may already be in use.");
      } else {
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
    <div className="bg-surface-container-low min-h-screen flex flex-col w-full text-on-surface">
      <HomeHeader
        userProfile={null}
        cartCount={0}
        sellerHref={role === "SELLER" ? "/seller/onboarding" : "/login?role=seller"}
      />

      <main className="flex-grow flex flex-col items-center justify-center px-base py-xxl">
        <div className="w-full max-w-[480px] bg-white rounded-lg p-xl border border-border-gray shadow-sm">
          {/* Header */}
          <div className="mb-xl text-center">
            <h1 className="font-headline-md text-headline-md text-primary mb-xs font-bold">
              {role === "SELLER" ? "Create Boutique Seller Account" : "Create Your Account"}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {role === "SELLER"
                ? "Join MiniBrands to launch your fashion store and reach thousands of buyers."
                : "Discover curated artisanal fashion and track your orders seamlessly."}
            </p>
          </div>

          {/* Role Switcher Pills */}
          <div className="flex bg-surface-container-low p-1 rounded-lg mb-lg border border-outline-variant">
            <button
              type="button"
              onClick={() => setRole("BUYER")}
              className={`flex-1 py-2 text-label-bold font-bold text-xs sm:text-sm rounded-md transition-all cursor-pointer ${
                role === "BUYER"
                  ? "bg-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Buyer Account
            </button>
            <button
              type="button"
              onClick={() => setRole("SELLER")}
              className={`flex-1 py-2 text-label-bold font-bold text-xs sm:text-sm rounded-md transition-all cursor-pointer ${
                role === "SELLER"
                  ? "bg-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Seller Account
            </button>
          </div>

          {/* Error & Success Banners */}
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

          {/* Google Quick Signup */}
          <button
            onClick={handleGoogleSignup}
            disabled={isLoading}
            type="button"
            className="w-full py-md bg-white border border-outline-variant rounded-lg flex items-center justify-center gap-md hover:bg-surface-container transition-colors cursor-pointer mb-lg disabled:opacity-50"
          >
            <img
              alt="Google"
              className="w-5 h-5"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-Lrs6fi30Roms51aPNqibpTJxhGIi-LcfaT89wBFttUbPyRfrRNE2MSZgpCQ31AkZ2CTh8WDhHATyL8nzrJvRSfxcUtuD9rrHY3ArHo03R3HrqX8oShu__qHNOOoCnTPJJCH_8fQkRs4upR4I5bs_EidjsmLr2f-xzSWlYOfSnzYVSYheCg0IdWgQoWcMYZVn-noWeZNz3RfVclzYsGIFrnl9pTgmPwe2LiGieG6lQXkS563oTSRBzFwCuxKrxLJ6bEXIrSqM8kxm"
            />
            <span className="font-label-bold text-label-bold text-on-surface select-none">
              Sign up with Google
            </span>
          </button>

          <div className="relative my-lg flex items-center">
            <div className="flex-grow border-t border-outline-variant"></div>
            <span className="px-md font-body-sm text-body-sm text-on-surface-variant bg-white select-none">
              OR SIGN UP WITH EMAIL
            </span>
            <div className="flex-grow border-t border-outline-variant"></div>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-md" onSubmit={handleSignup}>
            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-bold text-on-surface">
                Full Name
              </label>
              <input
                className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md bg-white"
                placeholder="e.g. Ananya Sharma"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {role === "SELLER" && (
              <div className="flex flex-col gap-xs animate-fade-in-up">
                <label className="font-label-bold text-label-bold text-on-surface">
                  Business / Store Name
                </label>
                <input
                  className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md bg-white"
                  placeholder="e.g. Velvet Couture Studio"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            )}

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

            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-bold text-on-surface">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md bg-white"
                  placeholder="Create a strong password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              <PasswordStrengthMeter password={password} />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-bold text-on-surface">
                Confirm Password
              </label>
              <input
                className="w-full p-md border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md bg-white"
                placeholder="Retype password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <label className="flex items-start gap-sm cursor-pointer mt-xs">
              <input
                className="w-4 h-4 mt-1 rounded-sm border-outline-variant text-primary focus:ring-primary cursor-pointer"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                disabled={isLoading}
              />
              <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight select-none">
                I agree to MiniBrands&apos;s <Link href="/products" className="text-primary font-bold hover:underline">Terms of Service</Link> and <Link href="/products" className="text-primary font-bold hover:underline">Privacy Policy</Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-md bg-primary text-on-primary font-label-bold text-label-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-sm mt-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-xl text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Already have an account?{" "}
              <Link
                href={role === "SELLER" ? "/login?role=seller" : "/login"}
                className="text-primary font-bold hover:underline"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center min-h-screen bg-surface-container-low">
          <span className="material-symbols-outlined animate-spin text-[36px] text-primary">sync</span>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
