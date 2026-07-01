import React from "react";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { Sparkles, AlertCircle } from "lucide-react";
import { ProductCreateInput } from "@/schemas/product.schema";

interface AIDescriptionFormProps {
  register: UseFormRegister<any>;
  errors: any;
  setValue: UseFormSetValue<any>;
  aiGeneratedData: {
    suggestedPriceMin: number;
    suggestedPriceMax: number;
    confidenceNote?: string;
  } | null;
  onRegenerate?: () => void;
  isAiLoading?: boolean;
}

const CATEGORY_OPTIONS = [
  "Women's Ethnic Wear",
  "Streetwear",
  "Accessories",
  "Handloom",
];

export default function AIDescriptionForm({
  register,
  errors,
  setValue,
  aiGeneratedData,
  onRegenerate,
  isAiLoading = false,
}: AIDescriptionFormProps) {
  // Format paise to Rupees for suggested pricing
  const minRs = aiGeneratedData ? Math.round(aiGeneratedData.suggestedPriceMin / 100) : 0;
  const maxRs = aiGeneratedData ? Math.round(aiGeneratedData.suggestedPriceMax / 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600 fill-indigo-50" />
            <span>AI Product Description Suggestion</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and edit the suggestions below. You can override any details.
          </p>
        </div>
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isAiLoading}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-indigo-400 transition-colors cursor-pointer"
          >
            {isAiLoading ? "Regenerating..." : "Regenerate Suggestions"}
          </button>
        )}
      </div>

      {/* Suggested Price Banner */}
      {aiGeneratedData && (
        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-2.5 animate-fade-in-up">
          <Sparkles className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-900 leading-relaxed">
            <p className="font-semibold text-indigo-950">AI Suggested Price Range</p>
            <p className="mt-0.5 text-indigo-800">
              Based on the fabric and product visuals, the suggested listing price is between{" "}
              <strong className="text-indigo-950">₹{minRs}</strong> and{" "}
              <strong className="text-indigo-950">₹{maxRs}</strong>.
            </p>
            {aiGeneratedData.confidenceNote && (
              <p className="text-indigo-600/90 italic mt-1.5">
                Note: &ldquo;{aiGeneratedData.confidenceNote}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form Inputs */}
      <div className="space-y-6">
        {/* Product Name */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="name" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Product Name
            </label>
            {aiGeneratedData && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI Suggested</span>
              </span>
            )}
          </div>
          <input
            id="name"
            type="text"
            placeholder="e.g. Mulberry Silk Kanchipuram Saree"
            className={`block w-full py-3 px-4 bg-white border ${
              errors.name ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
            } rounded-xl shadow-sm focus:outline-none focus:ring-2 text-sm transition-all`}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.name.message}</span>
            </p>
          )}
        </div>

        {/* Short Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="shortDescription" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Short Summary Description
            </label>
            {aiGeneratedData && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI Suggested</span>
              </span>
            )}
          </div>
          <input
            id="shortDescription"
            type="text"
            placeholder="A brief 1-sentence description of the product (max 150 chars)"
            maxLength={150}
            className={`block w-full py-3 px-4 bg-white border ${
              errors.shortDescription ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
            } rounded-xl shadow-sm focus:outline-none focus:ring-2 text-sm transition-all`}
            {...register("shortDescription")}
          />
          {errors.shortDescription && (
            <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.shortDescription.message}</span>
            </p>
          )}
        </div>

        {/* Full Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="fullDescription" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Full Description & Styling Details
            </label>
            {aiGeneratedData && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI Suggested</span>
              </span>
            )}
          </div>
          <textarea
            id="fullDescription"
            rows={5}
            placeholder="Specify details about the fabric, occasion, fit guidelines, design details, and wash care instructions..."
            className={`block w-full py-3 px-4 bg-white border ${
              errors.fullDescription ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
            } rounded-xl shadow-sm focus:outline-none focus:ring-2 text-sm transition-all resize-none`}
            {...register("fullDescription")}
          />
          {errors.fullDescription && (
            <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.fullDescription.message}</span>
            </p>
          )}
        </div>

        {/* Category Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="category" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Category
              </label>
              {aiGeneratedData && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>AI Suggested</span>
                </span>
              )}
            </div>
            <select
              id="category"
              className={`block w-full py-3 px-4 bg-white border ${
                errors.category ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
              } rounded-xl shadow-sm focus:outline-none focus:ring-2 text-sm transition-all`}
              {...register("category")}
            >
              <option value="">Select category...</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.category.message}</span>
              </p>
            )}
          </div>

          {/* Subcategory */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="subcategory" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Subcategory (Optional)
              </label>
            </div>
            <input
              id="subcategory"
              type="text"
              placeholder="e.g. Sarees, T-Shirts, Necklaces"
              className="block w-full py-3 px-4 bg-white border border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl shadow-sm focus:outline-none focus:ring-2 text-sm transition-all"
              {...register("subcategory")}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="tagsInput" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Product Tags (Comma Separated)
            </label>
            {aiGeneratedData && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI Suggested</span>
              </span>
            )}
          </div>
          <input
            id="tagsInput"
            type="text"
            placeholder="e.g. silk, handloom, festive, wedding"
            className={`block w-full py-3 px-4 bg-white border ${
              errors.tags ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
            } rounded-xl shadow-sm focus:outline-none focus:ring-2 text-sm transition-all`}
            onChange={(e) => {
              const val = e.target.value;
              const tagsArray = val
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t.length > 0);
              setValue("tags", tagsArray);
            }}
          />
          <p className="text-[10px] text-slate-400 mt-1.5">
            Tags help buyers find your products. Separate tags with a comma (e.g. handloom, saree). Max 10 tags.
          </p>
          {errors.tags && (
            <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.tags.message}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
