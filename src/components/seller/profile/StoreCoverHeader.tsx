"use client";

import React from "react";
import { Camera, Edit, UserCheck, ShieldCheck, Sparkles } from "lucide-react";

interface StoreCoverHeaderProps {
  storeName: string;
  category: string;
  city: string;
  bannerUrl?: string;
  logoUrl?: string;
  isKycVerified: boolean;
  trustScore?: number;
  isUploadingBanner?: boolean;
  isUploadingLogo?: boolean;
  onBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function StoreCoverHeader({
  storeName,
  category,
  city,
  bannerUrl,
  logoUrl,
  isKycVerified,
  trustScore = 98,
  isUploadingBanner,
  isUploadingLogo,
  onBannerChange,
  onLogoChange,
}: StoreCoverHeaderProps) {
  return (
    <section className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 relative">
      {/* Banner Cover Area */}
      <div className="h-44 sm:h-56 md:h-64 relative group bg-slate-900 overflow-hidden">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt="Store Banner Cover"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">
              No Cover Banner Uploaded
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all" />

        {/* Change Banner Button Overlay */}
        <label className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-bold text-slate-900 hover:bg-white transition-all shadow-md cursor-pointer active:scale-95">
          <Camera className="w-4 h-4 text-slate-700" />
          <span className="hidden sm:inline">
            {isUploadingBanner ? "Uploading..." : "Change Banner"}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={onBannerChange}
            disabled={isUploadingBanner}
            className="hidden"
          />
        </label>
      </div>

      {/* Profile Avatar & Store Title Info Header */}
      <div className="px-4 sm:px-8 pb-6 sm:pb-8 pt-0 -mt-12 sm:-mt-16 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 text-center md:text-left">
        {/* Avatar Logo Upload */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-xl flex items-center justify-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={storeName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-extrabold text-slate-700 uppercase">
                {storeName.slice(0, 2)}
              </span>
            )}
          </div>
          <label className="absolute bottom-1 right-1 bg-slate-900 text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
            <Edit className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={onLogoChange}
              disabled={isUploadingLogo}
              className="hidden"
            />
          </label>
        </div>

        {/* Store Title & Badges */}
        <div className="flex-1 md:pb-1 w-full space-y-1.5">
          <div className="flex flex-col md:flex-row items-center gap-2 flex-wrap justify-center md:justify-start">
            <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-950 tracking-tight">
              {storeName}
            </h2>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider">
                <UserCheck className="w-3 h-3 text-emerald-600" />
                {isKycVerified ? "Verified Merchant" : "Pending Verification"}
              </span>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2.5 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider">
                Trust Score: {trustScore}/100
              </span>
            </div>
          </div>

          <p className="text-slate-500 font-medium text-xs sm:text-sm flex items-center justify-center md:justify-start gap-2 flex-wrap">
            <span className="font-bold text-slate-800">{category || "Fashion Boutique"}</span>
            <span>&bull;</span>
            <span className="text-slate-600">{city || "India"}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
