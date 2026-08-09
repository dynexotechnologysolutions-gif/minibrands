"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface ClaimOrderClientProps {
  email: string;
  token: string;
}

export default function ClaimOrderClient({ email, token }: ClaimOrderClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const normalizedEmail = email.toLowerCase().trim();

  // Step 1: Request OTP Send via Better Auth
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: normalizedEmail,
        type: "sign-in", // Supports both login and auto registration
      });

      if (error) {
        setErrorMsg(error.message || "Failed to send OTP verification code.");
      } else {
        setStep("verify");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP + Claim Order
  const handleVerifyAndClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Verify OTP using Better Auth to log in/sign up the user
      const { error: authError } = await authClient.signIn.emailOtp({
        email: normalizedEmail,
        otp,
      });

      if (authError) {
        setErrorMsg(authError.message || "Invalid or expired OTP code.");
        setIsLoading(false);
        return;
      }

      // 2. Call claim API server-side now that the session is verified
      const claimRes = await fetch("/api/guest-orders/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!claimRes.ok) {
        const errData = await claimRes.json();
        setErrorMsg(errData.error || "Claim failed. Order could not be associated.");
        setIsLoading(false);
        return;
      }

      // Claim success! Redirect straight to order history
      router.push("/account/orders");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process verification.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="font-vl-heading text-xl font-extrabold text-vl-ink">
          {step === "request" ? "Verify Your Email" : "Enter Verification Code"}
        </h2>
        <p className="text-xs text-vl-muted leading-relaxed">
          {step === "request"
            ? `We'll send a secure one-time passcode to ${normalizedEmail} to verify ownership and claim this order.`
            : `Please enter the 6-digit verification code sent to ${normalizedEmail}.`}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-vl-card border border-vl-danger/25 bg-vl-danger/10 text-xs font-bold text-red-950 text-center">
          {errorMsg}
        </div>
      )}

      {step === "request" ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-vl-ink mb-1.5">Email Address</label>
            <input
              type="email"
              disabled
              value={normalizedEmail}
              className="w-full min-h-11 rounded-vl-control border border-vl-border bg-vl-surface/50 px-4 text-sm opacity-70 cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-vl-control bg-vl-primary text-sm font-bold text-white shadow-md hover:bg-vl-primary-strong active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : "Send Verification OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyAndClaim} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-vl-ink mb-1.5">Enter OTP Code</label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 123456"
              className="w-full min-h-11 rounded-vl-control border border-vl-border bg-vl-surface px-4 text-sm text-center font-bold tracking-widest focus:border-vl-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-vl-control bg-vl-primary text-sm font-bold text-white shadow-md hover:bg-vl-primary-strong active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : "Verify & Claim Order"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep("request")}
              className="text-xs font-bold text-vl-primary hover:underline"
            >
              ← Back to Email Request
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
