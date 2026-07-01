"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateSellerProfileSchema, UpdateSellerProfileInput } from "@/schemas/seller.schema";
import { updateSellerProfile } from "@/actions/update-seller-profile.action";
import HomeHeader from "@/components/home/HomeHeader";
import { 
  Store, 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  ShieldCheck,
  Award,
  CreditCard,
  Image as ImageIcon
} from "lucide-react";

interface SellerProfileClientProps {
  seller: any;
  verification: any;
  userProfile: any;
}

export default function SellerProfileClient({
  seller,
  verification,
  userProfile,
}: SellerProfileClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Toast State
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Form initialization
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSellerProfileInput>({
    resolver: zodResolver(UpdateSellerProfileSchema) as any,
    defaultValues: {
      storeName: seller.storeName || seller.businessName,
      storeDescription: seller.storeDescription || "",
      storeLogo: seller.storeLogo || "",
      storeBanner: seller.storeBanner || "",
      category: seller.category as any,
      city: seller.city as any,
    },
  });

  const watchedLogo = watch("storeLogo");
  const watchedBanner = watch("storeBanner");

  // Cloudinary Upload Handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setUploadError(null);

    try {
      // 1. Get signature
      const signRes = await fetch("/api/cloudinary/sign", { method: "POST" });
      if (!signRes.ok) throw new Error("Failed to authorize upload");
      const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

      // 2. Upload file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      if (!uploadRes.ok) throw new Error("Cloudinary upload failed");
      const data = await uploadRes.json();

      setValue("storeLogo", data.secure_url);
      triggerToast("Store logo uploaded successfully.");
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    setUploadError(null);

    try {
      // 1. Get signature
      const signRes = await fetch("/api/cloudinary/sign", { method: "POST" });
      if (!signRes.ok) throw new Error("Failed to authorize upload");
      const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

      // 2. Upload file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      if (!uploadRes.ok) throw new Error("Cloudinary upload failed");
      const data = await uploadRes.json();

      setValue("storeBanner", data.secure_url);
      triggerToast("Store banner uploaded successfully.");
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload banner.");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const onSubmit = async (data: UpdateSellerProfileInput) => {
    try {
      const res = await updateSellerProfile(data);
      if (res.success) {
        triggerToast("Store profile updated successfully.");
        startTransition(() => {
          router.refresh();
        });
      } else {
        triggerToast(res.error?.message || "Failed to update profile.", "error");
      }
    } catch (err: any) {
      triggerToast(err.message || "An unexpected error occurred.", "error");
    }
  };

  // Helper styles for KYC Badges
  const getKycBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "approved" || s === "auto_approved") {
      return {
        bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
        label: "Verified (e-KYC)",
        icon: "verified"
      };
    }
    if (s === "rejected") {
      return {
        bg: "bg-red-50 border-red-200 text-red-700",
        label: "Rejected",
        icon: "cancel"
      };
    }
    return {
      bg: "bg-amber-50 border-amber-200 text-amber-700",
      label: "Pending Review",
      icon: "pending"
    };
  };

  const kyc = getKycBadge(verification?.kycStatus || "pending");

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col w-full">
      {/* Navigation Header */}
      <HomeHeader
        userProfile={userProfile}
        cartCount={0}
        sellerHref="/seller/dashboard"
      />

      {/* Toast Alert */}
      {alertMsg && (
        <div className="fixed bottom-base right-base z-50 animate-fade-in-up">
          <div
            className={`p-base border rounded shadow-lg flex items-center gap-sm font-label-bold text-label-bold ${
              alertMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <span className="material-symbols-outlined">
              {alertMsg.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{alertMsg.text}</span>
          </div>
        </div>
      )}

      {/* Main Page Layout */}
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full flex-grow space-y-8">
        {/* Back Link & Title */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => router.push("/seller/dashboard")}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-sm">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-950">
                Store Profile Settings
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Customize your boutique branding details and verify your business credentials.
              </p>
            </div>
          </div>
        </div>

        {uploadError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex items-start gap-2.5 animate-fade-in-up">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Upload Error</p>
              <p className="text-red-600/90 mt-0.5">{uploadError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form Panel: 8 Columns */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
              
              {/* Banner Upload Section */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Store Banner Cover Image
                </label>
                <div className="relative group rounded-2xl border border-slate-200 aspect-[21/9] w-full overflow-hidden bg-slate-50 flex items-center justify-center">
                  {watchedBanner ? (
                    <>
                      <img src={watchedBanner} alt="Store Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="bg-white/90 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-white active:scale-95 transition-all">
                          Change Banner
                          <input type="file" accept="image/*" onChange={handleBannerUpload} disabled={isUploadingBanner} className="hidden" />
                        </label>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto text-slate-400">
                        {isUploadingBanner ? (
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-700">Upload Banner Cover</p>
                      <p className="text-[10px] text-slate-400">Optimal size 1200x500 pixels</p>
                      <input type="file" accept="image/*" onChange={handleBannerUpload} disabled={isUploadingBanner} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  )}
                </div>
              </div>

              {/* Logo Upload Section */}
              <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-slate-100 pb-6">
                <div className="relative group shrink-0 w-24 h-24 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-50 flex items-center justify-center">
                  {watchedLogo ? (
                    <>
                      <img src={watchedLogo} alt="Store Logo" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="text-[10px] bg-white/95 text-slate-800 font-bold px-2 py-1 rounded cursor-pointer">
                          Edit
                          <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} className="hidden" />
                        </label>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      {isUploadingLogo ? (
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mx-auto" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400 mx-auto" />
                      )}
                      <span className="text-[9px] font-bold text-slate-500 block mt-1">Upload Logo</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="font-bold text-slate-800 text-sm">Store Brand Logo</h3>
                  <p className="text-slate-400 text-xs">This image is displayed publicly on your storefront, invoice receipts, and search cards.</p>
                </div>
              </div>

              {/* Input details */}
              <div className="space-y-6">
                {/* Store Name */}
                <div className="space-y-2">
                  <label htmlFor="storeName" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Store Display Name
                  </label>
                  <input
                    id="storeName"
                    type="text"
                    {...register("storeName")}
                    className={`block w-full border rounded-xl px-4 py-3 bg-white text-sm focus:outline-none focus:ring-2 ${
                      errors.storeName 
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                        : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                    placeholder="Enter store name"
                  />
                  {errors.storeName && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.storeName.message}</span>
                    </p>
                  )}
                </div>

                {/* Category & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-base">
                  <div className="space-y-2">
                    <label htmlFor="category" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Primary Boutique Category
                    </label>
                    <select
                      id="category"
                      {...register("category")}
                      className="block w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Women's Ethnic Wear">Women's Ethnic Wear</option>
                      <option value="Streetwear">Streetwear</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Handloom">Handloom</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="city" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Delivery Hub Location
                    </label>
                    <select
                      id="city"
                      {...register("city")}
                      disabled
                      className="block w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-sm cursor-not-allowed"
                    >
                      <option value="Chennai">Chennai</option>
                    </select>
                    <p className="text-[10px] text-slate-400 font-medium">Velvet Lane only launches in Chennai currently.</p>
                  </div>
                </div>

                {/* Store Description */}
                <div className="space-y-2">
                  <label htmlFor="storeDescription" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Brand Store Description
                  </label>
                  <textarea
                    id="storeDescription"
                    rows={4}
                    {...register("storeDescription")}
                    className={`block w-full border rounded-xl px-4 py-3 bg-white text-sm focus:outline-none focus:ring-2 ${
                      errors.storeDescription
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                        : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                    placeholder="Describe your brand boutique. Tell customers about your design philosophy, fabrics, or history..."
                  />
                  {errors.storeDescription && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.storeDescription.message}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving profile...</span>
                    </>
                  ) : (
                    <span>Save Profile Changes</span>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Right Verification Status Panel: 4 Columns */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Velvet Trust Score Card */}
            <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Velvet Trust Score</span>
              </h3>
              <div className="h-px bg-slate-100 w-full"></div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-slate-900">{verification?.trustScore || 0}</span>
                <span className="text-sm text-slate-400 font-semibold">/ 100</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Calculated based on listing completeness, bank linkages, response times, and buyer satisfaction scores.
              </p>
            </section>

            {/* KYC Status Card */}
            <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Identity KYC</span>
              </h3>
              <div className="h-px bg-slate-100 w-full"></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">KYC Status</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${kyc.bg}`}>
                    {kyc.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Legal Business Name</span>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{seller.businessName}</span>
                </div>
              </div>
            </section>

            {/* Settlements Bank Status Card */}
            <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Settlements Bank</span>
              </h3>
              <div className="h-px bg-slate-100 w-full"></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Bank Linked</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    verification?.bankVerified 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                      : "bg-amber-50 border-amber-200 text-amber-700"
                  }`}>
                    {verification?.bankVerified ? "Linked" : "Not Linked"}
                  </span>
                </div>
                {verification?.bankVerified && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Account Number</span>
                    <span className="text-xs font-semibold text-slate-800">Ending in ...{verification.bankAccountLast4}</span>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
