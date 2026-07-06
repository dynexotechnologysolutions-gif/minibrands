"use client";

import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { UpdateSellerProfileInput } from "@/schemas/seller.schema";
import { AlertCircle, Save, Loader2 } from "lucide-react";

interface BrandInformationCardProps {
  register: UseFormRegister<UpdateSellerProfileInput>;
  errors: FieldErrors<UpdateSellerProfileInput>;
  businessName: string;
  watchedDescription?: string;
  isSubmitting: boolean;
  onSave: () => void;
}

const CATEGORIES = [
  "Women's Apparel",
  "Men's Wear",
  "Ethnic & Occasion Wear",
  "Footwear & Accessories",
  "Jewelry & Craft",
  "Luxury Fashion",
  "Unisex Streetwear",
];

const CITIES = [
  "Mumbai",
  "Delhi NCR",
  "Bengaluru",
  "Hyderabad",
  "Kolkata",
  "Chennai",
  "Ahmedabad",
  "Jaipur",
  "Surat",
  "Varanasi",
  "Pune",
  "Lucknow",
];

export default function BrandInformationCard({
  register,
  errors,
  businessName,
  watchedDescription = "",
  isSubmitting,
  onSave,
}: BrandInformationCardProps) {
  const charCount = watchedDescription.length;

  return (
    <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-extrabold text-xl text-slate-900">Brand Information</h3>
          <p className="text-xs text-slate-500 mt-0.5">Configure your boutique profile and brand story</p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={isSubmitting}
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Registered Business Name (Readonly) */}
          <div className="space-y-1.5">
            <label className="font-bold text-xs uppercase tracking-wider text-slate-600">
              Registered Business Name
            </label>
            <input
              type="text"
              readOnly
              value={businessName}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-medium text-sm text-slate-700 cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-400">Verified during merchant registration</p>
          </div>

          {/* Store Display Name */}
          <div className="space-y-1.5">
            <label htmlFor="storeName" className="font-bold text-xs uppercase tracking-wider text-slate-600">
              Store Display Name
            </label>
            <input
              id="storeName"
              type="text"
              {...register("storeName")}
              className={`w-full border rounded-xl p-3 font-medium text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-black transition-all ${
                errors.storeName ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"
              }`}
              placeholder="Enter public store name"
            />
            {errors.storeName && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.storeName.message}</span>
              </p>
            )}
          </div>

          {/* Primary Category */}
          <div className="space-y-1.5">
            <label htmlFor="category" className="font-bold text-xs uppercase tracking-wider text-slate-600">
              Primary Boutique Category
            </label>
            <select
              id="category"
              {...register("category")}
              className="w-full border border-slate-200 rounded-xl p-3 font-medium text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-black bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* City Location */}
          <div className="space-y-1.5">
            <label htmlFor="city" className="font-bold text-xs uppercase tracking-wider text-slate-600">
              Boutique Location / City
            </label>
            <select
              id="city"
              {...register("city")}
              className="w-full border border-slate-200 rounded-xl p-3 font-medium text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-black bg-white"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Brand Story / Description */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="storeDescription" className="font-bold text-xs uppercase tracking-wider text-slate-600">
              Brand Story & Description
            </label>
            <span className={`text-xs ${charCount > 900 ? "text-red-600 font-bold" : "text-slate-400"}`}>
              {charCount} / 1000 characters
            </span>
          </div>
          <textarea
            id="storeDescription"
            rows={5}
            maxLength={1000}
            {...register("storeDescription")}
            className="w-full border border-slate-200 rounded-xl p-3.5 font-medium text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-black leading-relaxed"
            placeholder="Tell your boutique story, heritage craft, and sizing guidelines..."
          />
        </div>
      </div>
    </section>
  );
}
