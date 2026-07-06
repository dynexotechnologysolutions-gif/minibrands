"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { RegisterSellerSchema, BankVerifySchema, RegisterSellerInput, BankVerifyInput } from "@/schemas/seller.schema";
import { registerSeller } from "@/actions/seller-register.action";
import { initiateKyc } from "@/actions/seller-kyc-initiate.action";
import { verifyBank } from "@/actions/seller-bank-verify.action";
import { checkKycStatus } from "@/actions/seller-kyc-check.action";
import { authClient } from "@/lib/auth-client";
import { 
  Building2, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  ArrowRight, 
  Loader2, 
  UserCheck, 
  CreditCard, 
  AlertCircle,
  LogOut
} from "lucide-react";

interface OnboardingFormProps {
  initialStep: number;
  initialSellerId: string | null;
  initialKycStatus: string | null;
  initialBankVerified: boolean;
  initialHasInitiatedKyc: boolean;
  userEmail: string;
}

export default function OnboardingForm({
  initialStep,
  initialSellerId,
  initialKycStatus,
  initialBankVerified,
  initialHasInitiatedKyc,
  userEmail,
}: OnboardingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [sellerId, setSellerId] = useState<string | null>(initialSellerId);
  const [kycStatus, setKycStatus] = useState<string | null>(initialKycStatus);
  const [bankVerified, setBankVerified] = useState(initialBankVerified);
  const [hasInitiatedKyc, setHasInitiatedKyc] = useState(initialHasInitiatedKyc);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  // Setup Step 1 (Business Info) Form
  const {
    register: registerBusiness,
    handleSubmit: handleSubmitBusiness,
    formState: { errors: businessErrors },
  } = useForm<RegisterSellerInput>({
    resolver: zodResolver(RegisterSellerSchema),
  });

  // Setup Step 3 (Bank Details) Form
  const {
    register: registerBank,
    handleSubmit: handleSubmitBank,
    formState: { errors: bankErrors },
  } = useForm<BankVerifyInput>({
    resolver: zodResolver(BankVerifySchema),
    mode: "onBlur",
  });

  // Query to poll KYC status on Step 2
  const { data: pollData } = useQuery({
    queryKey: ["kycStatusPoll", sellerId],
    queryFn: async () => {
      setPollCount((c) => c + 1);
      const res = await checkKycStatus();
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || "Failed to fetch status");
    },
    // Poll every 3 seconds, enabled on Step 2 if kyc is not auto_approved/approved, has initiated, and under 20 poll counts (60s)
    enabled: step === 2 && !!sellerId && hasInitiatedKyc && kycStatus !== "auto_approved" && kycStatus !== "approved" && pollCount < 20,
    refetchInterval: 3000,
    retry: false,
  });

  // Monitor polling results
  useEffect(() => {
    if (pollData) {
      const currentKyc = pollData.kycStatus;
      setKycStatus(currentKyc);
      setBankVerified(pollData.bankVerified);
      
      if (currentKyc === "auto_approved" || currentKyc === "approved") {
        setStep(3); // Advance to bank details
      }
    }
  }, [pollData]);

  // Handle Step 1 Submit
  const onBusinessSubmit = async (data: RegisterSellerInput) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await registerSeller(data);
      if (res.success && res.data) {
        setSellerId(res.data.sellerId);
        setKycStatus("pending");
        setStep(2);
      } else {
        setActionError(res.error?.message || "Failed to register seller profile");
      }
    } catch (err) {
      setActionError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle KYC Session Initiation
  const handleStartKyc = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await initiateKyc();
      if (res.success && res.data) {
        setHasInitiatedKyc(true);
        // Full hosted redirect
        window.location.href = res.data.signzyRedirectUrl;
      } else {
        setActionError(res.error?.message || "Failed to initiate identity verification session");
      }
    } catch (err) {
      setActionError("Failed to connect to verification server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Step 3 Submit
  const onBankSubmit = async (data: BankVerifyInput) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await verifyBank(data);
      if (res.success && res.data) {
        setBankVerified(true);
        setStep(4);
      } else {
        setActionError(res.error?.message || "Bank penny-drop verification failed.");
      }
    } catch (err) {
      setActionError("An unexpected error occurred during bank verification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-12 px-4 max-w-2xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">Seller Portal</span>
          <h1 className="text-xl font-bold font-display text-slate-800 mt-1">Velvet Lane Onboarding</h1>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-600 font-medium transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="mb-10">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <span>Step {step} of 4</span>
          <span className="text-indigo-600">
            {step === 1 && "Business Profile"}
            {step === 2 && "Aadhaar KYC"}
            {step === 3 && "Bank Account Link"}
            {step === 4 && "Store Ready"}
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${step * 25}%` }}
          />
        </div>
      </div>

      {/* Form Content Panel */}
      <div className="glass-panel rounded-2xl p-8 shadow-lg flex-1 flex flex-col justify-between min-h-[400px]">
        <div>
          {/* Step 1: Business Profile */}
          {step === 1 && (
            <div className="animate-fade-in-up">
              <h2 className="text-lg font-bold text-slate-800 font-display mb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Tell us about your Business</span>
              </h2>
              <p className="text-slate-500 text-sm mb-8">
                Onboard your boutique store or local designer label to access customers in Chennai.
              </p>

              <form onSubmit={handleSubmitBusiness(onBusinessSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="businessName" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Official Business Name
                  </label>
                  <input
                    id="businessName"
                    type="text"
                    placeholder="e.g. Kavitha Silks Ltd or Jane Doe"
                    className={`block w-full py-3 px-4 bg-white border ${
                      businessErrors.businessName ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    } rounded-xl shadow-sm focus:outline-none focus:ring-2 text-sm transition-all`}
                    {...registerBusiness("businessName")}
                  />
                  {businessErrors.businessName && (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{businessErrors.businessName.message}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="storeName" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Store Brand Name (Public Display Name)
                  </label>
                  <input
                    id="storeName"
                    type="text"
                    placeholder="e.g. Kavitha's Ethnic Silks"
                    className={`block w-full py-3 px-4 bg-white border ${
                      businessErrors.storeName ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    } rounded-xl shadow-sm focus:outline-none focus:ring-2 text-sm transition-all`}
                    {...registerBusiness("storeName")}
                  />
                  {businessErrors.storeName && (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{businessErrors.storeName.message}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Primary Category
                    </label>
                    <select
                      id="category"
                      className={`block w-full py-3 px-4 bg-white border ${
                        businessErrors.category ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                      } rounded-xl shadow-sm focus:outline-none focus:ring-2 text-sm transition-all`}
                      {...registerBusiness("category")}
                    >
                      <option value="">Select a category...</option>
                      <option value="Women's Ethnic Wear">Women's Ethnic Wear</option>
                      <option value="Streetwear">Streetwear</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Handloom">Handloom</option>
                    </select>
                    {businessErrors.category && (
                      <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{businessErrors.category.message}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Operating City
                    </label>
                    <select
                      id="city"
                      className={`block w-full py-3 px-4 bg-white border ${
                        businessErrors.city ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                      } rounded-xl shadow-sm focus:outline-none focus:ring-2 text-sm transition-all`}
                      {...registerBusiness("city")}
                    >
                      <option value="Chennai">Chennai</option>
                    </select>
                    {businessErrors.city && (
                      <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{businessErrors.city.message}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-sm shadow-sm transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving profile...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to Identity Verification</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Aadhaar KYC */}
          {step === 2 && (
            <div className="animate-fade-in-up">
              <h2 className="text-lg font-bold text-slate-800 font-display mb-2 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>Identity Verification</span>
              </h2>
              <p className="text-slate-500 text-sm mb-8">
                Verify your business identity using Aadhaar e-KYC. This build is a sandbox test.
              </p>

              {/* Status display logic */}
              {kycStatus === "pending" && hasInitiatedKyc && pollCount > 0 ? (
                /* Polling UI state */
                <div className="py-12 flex flex-col items-center text-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                  <h3 className="font-bold text-slate-700 mb-1">Verifying Identity...</h3>
                  <p className="text-slate-500 text-xs max-w-[360px] leading-relaxed">
                    We are waiting for validation feedback from our e-KYC provider. Please do not close this page.
                  </p>
                </div>
              ) : kycStatus === "manual_review" ? (
                /* Manual Review UI state */
                <div className="py-8 px-6 bg-amber-50/80 border border-amber-100 rounded-xl text-center flex flex-col items-center">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
                  <h3 className="font-bold text-amber-800 mb-1">Under Manual Review</h3>
                  <p className="text-amber-700 text-xs max-w-[440px] leading-relaxed mb-6">
                    Your verification requires manual review because the facial matching confidence score was slightly below threshold (60-79%).
                  </p>
                  <div className="p-3 bg-white border border-amber-100 rounded-lg text-slate-500 text-xs text-left max-w-[480px]">
                    <strong>Note:</strong> We will review your submission and notify you via <strong>{userEmail}</strong> within 4 hours. You can continue onboarding or wait for confirmation.
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Proceed to Bank Setup</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : kycStatus === "rejected" ? (
                /* Rejected UI state */
                <div className="py-8 px-6 bg-red-50/80 border border-red-100 rounded-xl text-center flex flex-col items-center">
                  <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                  <h3 className="font-bold text-red-800 mb-1">Verification Failed</h3>
                  <p className="text-red-700 text-xs max-w-[440px] leading-relaxed mb-6">
                    Aadhaar validation failed. The facial matching confidence score was below 60%.
                  </p>
                  <button
                    onClick={handleStartKyc}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:bg-indigo-400 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : null}
                    <span>Retry Verification</span>
                  </button>
                </div>
              ) : (
                /* Initial start state */
                <div className="space-y-6">
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-slate-600 text-xs leading-relaxed">
                    <p className="font-semibold text-indigo-800 mb-1">Verification Process</p>
                    <ul className="list-disc pl-4 space-y-1 mt-1">
                      <li>You will be redirected to the secure Signzy Sandbox flow.</li>
                      <li>Prepare your Aadhaar details for validation.</li>
                      <li>Completing verification unlocks immediate store status.</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleStartKyc}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-sm shadow-sm transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Starting Verification...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify with Aadhaar e-KYC</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Bank Account Link */}
          {step === 3 && (
            <div className="animate-fade-in-up">
              <h2 className="text-lg font-bold text-slate-800 font-display mb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span>Bank Details & Payout Account</span>
              </h2>
              <p className="text-slate-500 text-sm mb-8">
                Provide your bank details to enable secure automated payouts via Razorpay. We will verify your account with a penny-drop test.
              </p>

              <form onSubmit={handleSubmitBank(onBankSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="accountNumber" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Bank Account Number
                  </label>
                  <input
                    id="accountNumber"
                    type="password"
                    placeholder="••••••••••••"
                    className={`block w-full py-3 px-4 bg-white border ${
                      bankErrors.accountNumber ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    } rounded-xl shadow-sm focus:outline-none focus:ring-2 text-sm transition-all`}
                    {...registerBank("accountNumber")}
                  />
                  {bankErrors.accountNumber && (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{bankErrors.accountNumber.message}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="ifsc" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    IFSC Code
                  </label>
                  <input
                    id="ifsc"
                    type="text"
                    placeholder="HDFC0001234"
                    className={`block w-full py-3 px-4 bg-white border ${
                      bankErrors.ifsc ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    } rounded-xl shadow-sm focus:outline-none focus:ring-2 text-sm transition-all`}
                    {...registerBank("ifsc")}
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                    }}
                  />
                  {bankErrors.ifsc && (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{bankErrors.ifsc.message}</span>
                    </p>
                  )}
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-slate-500 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    Your full account details are never stored. Only the last 4 digits are persisted for payout tracking.
                  </span>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-sm shadow-sm transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Bank Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 4: Success confirmation */}
          {step === 4 && (
            <div className="animate-fade-in-up text-center py-8">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 font-display mb-3">
                Your Store is Being Set Up!
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-10 leading-relaxed">
                Congratulations! You have completed the identity and bank account onboarding verification. Your trust score is now updated to 50.
              </p>

              <button
                onClick={() => router.push("/seller/dashboard")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors cursor-pointer"
              >
                <span>Go to Seller Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Global Error Banner */}
        {actionError && (
          <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex items-start gap-2.5 animate-fade-in-up">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Action Failed</p>
              <p className="text-red-600/90 mt-0.5 leading-relaxed">{actionError}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
