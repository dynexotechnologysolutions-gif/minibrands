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
  LogOut,
  ShieldCheck,
  Store,
  Check
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
    router.push("/seller/login");
  };

  const stepDetails = [
    { id: 1, title: "Business Profile", icon: Building2 },
    { id: 2, title: "Identity e-KYC", icon: UserCheck },
    { id: 3, title: "Bank Account", icon: CreditCard },
    { id: 4, title: "Store Ready", icon: Store },
  ];

  return (
    <div className="bg-surface-container-low min-h-screen flex flex-col justify-between py-8 sm:py-12 px-4 max-w-3xl mx-auto w-full text-on-surface font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-gray/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest block">Seller Onboarding Portal</span>
            <h1 className="text-xl sm:text-2xl font-black font-headline-md text-primary tracking-tight">Velvet Lane Onboarding</h1>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted hover:text-error hover:bg-error-container/30 font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {/* Premium Step Progress Indicator */}
      <div className="mb-8 bg-white p-4 sm:p-6 rounded-2xl border border-border-gray shadow-xs">
        <div className="flex justify-between items-center text-xs font-bold text-text-muted uppercase tracking-wider mb-4">
          <span>Step {step} of 4</span>
          <span className="text-primary font-black">
            {step === 1 && "Business Profile Setup"}
            {step === 2 && "Aadhaar Identity e-KYC"}
            {step === 3 && "Bank Penny-Drop Link"}
            {step === 4 && "Boutique Activated"}
          </span>
        </div>

        {/* Desktop Step Badges */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 relative">
          {stepDetails.map((s) => {
            const isCompleted = step > s.id;
            const isCurrent = step === s.id;
            const Icon = s.icon;

            return (
              <div key={s.id} className="flex flex-col items-center text-center group">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${
                    isCompleted
                      ? "bg-success-green text-white shadow-xs"
                      : isCurrent
                      ? "bg-primary text-on-primary ring-4 ring-primary/20 shadow-md"
                      : "bg-surface-container text-text-muted border border-border-gray"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 text-white stroke-[3]" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`mt-2 text-[11px] font-semibold leading-tight hidden sm:block ${
                    isCurrent ? "text-primary font-bold" : isCompleted ? "text-on-surface font-medium" : "text-text-muted"
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Smooth Animated Progress Bar */}
        <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden mt-4">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Content Panel */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 lg:p-10 border border-border-gray shadow-md flex-1 flex flex-col justify-between min-h-[420px] transition-all">
        <div>
          {/* Step 1: Business Profile */}
          {step === 1 && (
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 className="w-4 h-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-primary font-headline-sm">
                  Tell us about your Business
                </h2>
              </div>
              <p className="text-on-surface-variant text-body-sm mb-8 leading-relaxed">
                Onboard your boutique store or local designer label to access fashion customers in Chennai.
              </p>

              <form onSubmit={handleSubmitBusiness(onBusinessSubmit)} className="space-y-6">
                <div className="space-y-1.5">
                  <label htmlFor="businessName" className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                    Official Business Name <span className="text-error-red">*</span>
                  </label>
                  <input
                    id="businessName"
                    type="text"
                    placeholder="e.g. Kavitha Silks Ltd or Jane Doe Studio"
                    className={`block w-full py-3 px-4 bg-white border ${
                      businessErrors.businessName ? "border-error focus:ring-error" : "border-outline-variant focus:border-primary focus:ring-primary/20"
                    } rounded-xl shadow-xs focus:outline-none focus:ring-2 text-body-md transition-all`}
                    {...registerBusiness("businessName")}
                  />
                  {businessErrors.businessName && (
                    <p className="text-error text-xs mt-1.5 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{businessErrors.businessName.message}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="storeName" className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                    Store Brand Name (Public Display Name) <span className="text-error-red">*</span>
                  </label>
                  <input
                    id="storeName"
                    type="text"
                    placeholder="e.g. Kavitha's Ethnic Silks"
                    className={`block w-full py-3 px-4 bg-white border ${
                      businessErrors.storeName ? "border-error focus:ring-error" : "border-outline-variant focus:border-primary focus:ring-primary/20"
                    } rounded-xl shadow-xs focus:outline-none focus:ring-2 text-body-md transition-all`}
                    {...registerBusiness("storeName")}
                  />
                  {businessErrors.storeName && (
                    <p className="text-error text-xs mt-1.5 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{businessErrors.storeName.message}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label htmlFor="category" className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                      Primary Category <span className="text-error-red">*</span>
                    </label>
                    <select
                      id="category"
                      className={`block w-full py-3 px-4 bg-white border ${
                        businessErrors.category ? "border-error focus:ring-error" : "border-outline-variant focus:border-primary focus:ring-primary/20"
                      } rounded-xl shadow-xs focus:outline-none focus:ring-2 text-body-md transition-all`}
                      {...registerBusiness("category")}
                    >
                      <option value="">Select a category...</option>
                      <option value="Women's Ethnic Wear">Women's Ethnic Wear</option>
                      <option value="Streetwear">Streetwear</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Handloom">Handloom</option>
                    </select>
                    {businessErrors.category && (
                      <p className="text-error text-xs mt-1.5 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{businessErrors.category.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="city" className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                      Operating City <span className="text-error-red">*</span>
                    </label>
                    <select
                      id="city"
                      className={`block w-full py-3 px-4 bg-white border ${
                        businessErrors.city ? "border-error focus:ring-error" : "border-outline-variant focus:border-primary focus:ring-primary/20"
                      } rounded-xl shadow-xs focus:outline-none focus:ring-2 text-body-md transition-all`}
                      {...registerBusiness("city")}
                    >
                      <option value="Chennai">Chennai</option>
                    </select>
                    {businessErrors.city && (
                      <p className="text-error text-xs mt-1.5 flex items-center gap-1 font-semibold">
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
                    className="w-full py-3.5 px-4 bg-primary hover:opacity-90 disabled:opacity-50 text-on-primary font-bold rounded-xl text-label-bold shadow-md transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Profile...</span>
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
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-primary font-headline-sm">
                  Identity Verification
                </h2>
              </div>
              <p className="text-on-surface-variant text-body-sm mb-8 leading-relaxed">
                Verify your business identity using Aadhaar e-KYC. This build is a sandbox test.
              </p>

              {/* Status display logic */}
              {kycStatus === "pending" && hasInitiatedKyc && pollCount > 0 ? (
                /* Polling UI state */
                <div className="py-12 flex flex-col items-center text-center bg-surface-container-low/50 rounded-2xl border border-border-gray p-6">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                  <h3 className="font-bold text-on-surface text-body-md mb-1">Verifying Identity...</h3>
                  <p className="text-on-surface-variant text-xs max-w-[360px] leading-relaxed">
                    We are waiting for validation feedback from our e-KYC provider. Please do not close this page.
                  </p>
                </div>
              ) : kycStatus === "manual_review" ? (
                /* Manual Review UI state */
                <div className="py-8 px-6 bg-amber-50 border border-amber-200 rounded-2xl text-center flex flex-col items-center">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
                  <h3 className="font-bold text-amber-900 text-body-md mb-1">Under Manual Review</h3>
                  <p className="text-amber-800 text-xs max-w-[440px] leading-relaxed mb-6">
                    Your verification requires manual review because the facial matching confidence score was slightly below threshold (60-79%).
                  </p>
                  <div className="p-4 bg-white border border-amber-200 rounded-xl text-on-surface-variant text-xs text-left max-w-[480px]">
                    <strong>Note:</strong> We will review your submission and notify you via <strong>{userEmail}</strong> within 4 hours. You can continue onboarding or wait for confirmation.
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Proceed to Bank Setup</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : kycStatus === "rejected" ? (
                /* Rejected UI state */
                <div className="py-8 px-6 bg-red-50 border border-red-200 rounded-2xl text-center flex flex-col items-center">
                  <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                  <h3 className="font-bold text-red-900 text-body-md mb-1">Verification Failed</h3>
                  <p className="text-red-800 text-xs max-w-[440px] leading-relaxed mb-6">
                    Aadhaar validation failed. The facial matching confidence score was below 60%.
                  </p>
                  <button
                    onClick={handleStartKyc}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:opacity-90 text-on-primary text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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
                  <div className="p-5 bg-surface-container-low border border-border-gray rounded-2xl text-on-surface-variant text-xs leading-relaxed">
                    <p className="font-bold text-primary mb-2 text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span>Verification Process</span>
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5">
                      <li>You will be redirected to the secure Signzy Sandbox flow.</li>
                      <li>Prepare your Aadhaar details for instant validation.</li>
                      <li>Completing verification unlocks immediate store activation.</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleStartKyc}
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 bg-primary hover:opacity-90 disabled:opacity-50 text-on-primary font-bold rounded-xl text-label-bold shadow-md transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-primary font-headline-sm">
                  Bank Details & Payout Account
                </h2>
              </div>
              <p className="text-on-surface-variant text-body-sm mb-8 leading-relaxed">
                Provide your bank details to enable secure automated payouts via Razorpay. We will verify your account with a penny-drop test.
              </p>

              <form onSubmit={handleSubmitBank(onBankSubmit)} className="space-y-6">
                <div className="space-y-1.5">
                  <label htmlFor="accountNumber" className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                    Bank Account Number <span className="text-error-red">*</span>
                  </label>
                  <input
                    id="accountNumber"
                    type="password"
                    placeholder="••••••••••••"
                    className={`block w-full py-3 px-4 bg-white border ${
                      bankErrors.accountNumber ? "border-error focus:ring-error" : "border-outline-variant focus:border-primary focus:ring-primary/20"
                    } rounded-xl shadow-xs focus:outline-none focus:ring-2 text-body-md transition-all`}
                    {...registerBank("accountNumber")}
                  />
                  {bankErrors.accountNumber && (
                    <p className="text-error text-xs mt-1.5 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{bankErrors.accountNumber.message}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ifsc" className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                    IFSC Code <span className="text-error-red">*</span>
                  </label>
                  <input
                    id="ifsc"
                    type="text"
                    placeholder="HDFC0001234"
                    className={`block w-full py-3 px-4 bg-white border ${
                      bankErrors.ifsc ? "border-error focus:ring-error" : "border-outline-variant focus:border-primary focus:ring-primary/20"
                    } rounded-xl shadow-xs focus:outline-none focus:ring-2 text-body-md transition-all font-mono tracking-wider`}
                    {...registerBank("ifsc")}
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                    }}
                  />
                  {bankErrors.ifsc && (
                    <p className="text-error text-xs mt-1.5 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{bankErrors.ifsc.message}</span>
                    </p>
                  )}
                </div>

                <div className="p-4 bg-surface-container-low border border-border-gray rounded-xl text-on-surface-variant text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success-green shrink-0 mt-0.5" />
                  <span>
                    Your full account details are never stored. Only the last 4 digits are persisted for payout tracking.
                  </span>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 bg-primary hover:opacity-90 disabled:opacity-50 text-on-primary font-bold rounded-xl text-label-bold shadow-md transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <div className="w-16 h-16 bg-success-green/10 border border-success-green/20 rounded-full flex items-center justify-center text-success-green mx-auto mb-6 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-primary font-headline-md mb-3">
                Your Store is Being Set Up!
              </h2>
              <p className="text-on-surface-variant text-body-md max-w-md mx-auto mb-10 leading-relaxed">
                Congratulations! You have completed identity and bank account verification. Your merchant trust score is now updated to 50.
              </p>

              <button
                onClick={() => router.push("/seller/dashboard")}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary hover:opacity-90 text-on-primary font-bold rounded-xl text-label-bold shadow-md transition-all cursor-pointer"
              >
                <span>Go to Seller Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Global Error Banner */}
        {actionError && (
          <div className="mt-8 p-4 bg-error-container border border-error/20 rounded-xl text-error text-xs flex items-start gap-2.5 animate-fade-in-up font-semibold">
            <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Action Failed</p>
              <p className="mt-0.5 leading-relaxed">{actionError}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
