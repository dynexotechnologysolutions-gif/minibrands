"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ShieldCheck, CreditCard, Award, ExternalLink, Store } from "lucide-react";

interface ProfileSidebarCardsProps {
  sellerId: string;
  hasLogo: boolean;
  hasBanner: boolean;
  hasDescription: boolean;
  hasCategory: boolean;
  kycStatus: string;
  bankLast4?: string;
  trustScore?: number;
}

export default function ProfileSidebarCards({
  sellerId,
  hasLogo,
  hasBanner,
  hasDescription,
  hasCategory,
  kycStatus,
  bankLast4,
  trustScore = 98,
}: ProfileSidebarCardsProps) {
  // Calculate completeness percentage
  const completedCount = [hasLogo, hasBanner, hasDescription, hasCategory].filter(Boolean).length;
  const percentage = Math.round((completedCount / 4) * 100);

  const strokeDashoffset = 251.2 - (251.2 * percentage) / 100;

  const isKycVerified = kycStatus === "approved" || kycStatus === "auto_approved";

  return (
    <div className="space-y-6">
      {/* 1. Profile Completeness Progress Card */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">Profile Completeness</h3>

        <div className="relative w-28 h-28 mx-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-slate-100 stroke-current"
              cx="50"
              cy="50"
              r="40"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              className="text-slate-900 stroke-current transition-all duration-700 ease-out"
              cx="50"
              cy="50"
              r="40"
              strokeWidth="8"
              strokeDasharray="251.2"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-slate-900">{percentage}%</span>
          </div>
        </div>

        <ul className="text-left space-y-2.5 pt-2 text-xs">
          <li className="flex items-center gap-2">
            {hasLogo ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 shrink-0" />
            )}
            <span className={hasLogo ? "font-semibold text-slate-800" : "text-slate-400"}>
              Store Logo Uploaded
            </span>
          </li>

          <li className="flex items-center gap-2">
            {hasBanner ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 shrink-0" />
            )}
            <span className={hasBanner ? "font-semibold text-slate-800" : "text-slate-400"}>
              Cover Banner Image Uploaded
            </span>
          </li>

          <li className="flex items-center gap-2">
            {hasDescription ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 shrink-0" />
            )}
            <span className={hasDescription ? "font-semibold text-slate-800" : "text-slate-400"}>
              Brand Description Added
            </span>
          </li>

          <li className="flex items-center gap-2">
            {hasCategory ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 shrink-0" />
            )}
            <span className={hasCategory ? "font-semibold text-slate-800" : "text-slate-400"}>
              Primary Category Selected
            </span>
          </li>
        </ul>
      </section>

      {/* 2. Trust & KYC Status Card */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">Trust & Verification</h3>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
            isKycVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}>
            {isKycVerified ? "Healthy" : "Action Needed"}
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              <span className="font-medium text-slate-800">Identity e-KYC</span>
            </div>
            <span className={`font-bold ${isKycVerified ? "text-emerald-700" : "text-amber-700"}`}>
              {isKycVerified ? "Verified" : "Pending"}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-700" />
              <span className="font-medium text-slate-800">Bank Account</span>
            </div>
            <span className="font-bold text-emerald-700">
              {bankLast4 ? `Active (...${bankLast4})` : "Active"}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-slate-700" />
              <span className="font-medium text-slate-800">Merchant Trust</span>
            </div>
            <span className="font-bold text-slate-900">{trustScore}/100</span>
          </div>
        </div>
      </section>

      {/* 3. Storefront Preview Link */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">Storefront Preview</h3>
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-200" />
            <div className="space-y-1">
              <div className="w-20 h-2 bg-slate-300 rounded" />
              <div className="w-12 h-1.5 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="aspect-square bg-slate-200 rounded-lg" />
            <div className="aspect-square bg-slate-200 rounded-lg" />
          </div>
        </div>
        <Link
          href={`/sellers/${sellerId}`}
          target="_blank"
          className="w-full flex items-center justify-center gap-2 text-slate-900 font-bold text-xs border border-slate-900 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
        >
          <span>View Live Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </section>
    </div>
  );
}
