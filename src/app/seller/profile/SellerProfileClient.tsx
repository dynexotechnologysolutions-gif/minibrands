"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateSellerProfileSchema, UpdateSellerProfileInput } from "@/schemas/seller.schema";
import { updateSellerProfile } from "@/actions/update-seller-profile.action";
import StoreCoverHeader from "@/components/seller/profile/StoreCoverHeader";
import BrandInformationCard from "@/components/seller/profile/BrandInformationCard";
import QuickInfoBento from "@/components/seller/profile/QuickInfoBento";
import ProfileSidebarCards from "@/components/seller/profile/ProfileSidebarCards";
import { AlertCircle, CheckCircle } from "lucide-react";

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
  const watchedDescription = watch("storeDescription");
  const watchedCategory = watch("category");

  // Cloudinary Logo Upload Handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setUploadError(null);

    try {
      const signRes = await fetch("/api/cloudinary/sign", { method: "POST" });
      if (!signRes.ok) throw new Error("Failed to authorize upload");
      const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

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

  // Cloudinary Banner Upload Handler
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    setUploadError(null);

    try {
      const signRes = await fetch("/api/cloudinary/sign", { method: "POST" });
      if (!signRes.ok) throw new Error("Failed to authorize upload");
      const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

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

  const isKycVerified = verification?.kycStatus === "approved" || verification?.kycStatus === "auto_approved";

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {alertMsg && (
        <div className="fixed bottom-6 right-6 z-[110] animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 font-bold text-xs border ${
              alertMsg.type === "success"
                ? "bg-emerald-900 text-white border-emerald-800"
                : "bg-red-900 text-white border-red-800"
            }`}
          >
            {alertMsg.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{alertMsg.text}</span>
          </div>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Upload Error</p>
            <p className="text-red-600/90 mt-0.5">{uploadError}</p>
          </div>
        </div>
      )}

      {/* Hero Store Cover Header Card */}
      <StoreCoverHeader
        storeName={seller.storeName || seller.businessName}
        category={seller.category}
        city={seller.city}
        bannerUrl={watchedBanner}
        logoUrl={watchedLogo}
        isKycVerified={isKycVerified}
        trustScore={verification?.trustScore || 98}
        isUploadingBanner={isUploadingBanner}
        isUploadingLogo={isUploadingLogo}
        onBannerChange={handleBannerUpload}
        onLogoChange={handleLogoUpload}
      />

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Brand Info Form & Bento Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <BrandInformationCard
              register={register}
              errors={errors}
              businessName={seller.businessName}
              watchedDescription={watchedDescription}
              isSubmitting={isSubmitting || isPending}
              onSave={handleSubmit(onSubmit)}
            />
          </form>

          {/* Quick Info Bento Tiles */}
          <QuickInfoBento
            sellerId={seller.id}
            userEmail={userProfile?.user?.email}
            storeName={seller.businessName}
          />
        </div>

        {/* Right Column: Profile Completeness, Trust Status & Preview (4 cols) */}
        <div className="lg:col-span-4">
          <ProfileSidebarCards
            sellerId={seller.id}
            hasLogo={Boolean(watchedLogo)}
            hasBanner={Boolean(watchedBanner)}
            hasDescription={Boolean(watchedDescription && watchedDescription.length > 20)}
            hasCategory={Boolean(watchedCategory)}
            kycStatus={verification?.kycStatus || "pending"}
            bankLast4={verification?.bankAccountLast4}
            trustScore={verification?.trustScore || 98}
          />
        </div>
      </div>
    </div>
  );
}
