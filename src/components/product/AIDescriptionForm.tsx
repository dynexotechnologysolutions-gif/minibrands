import React from "react";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { Sparkles, AlertCircle } from "lucide-react";

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
  "Men's Wear",
  "Footwear",
  "Jewelry & Craft",
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
      <div className="flex items-center justify-between border-b border-border-gray/60 pb-4">
        <div>
          <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI Copywriting & Product Details</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Review and refine product titles, brand stories, categories, and search tags.
          </p>
        </div>
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isAiLoading}
            className="text-xs font-bold text-primary hover:underline disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isAiLoading ? "Regenerating..." : "Regenerate AI Copy"}
          </button>
        )}
      </div>

      {/* Suggested Price Banner */}
      {aiGeneratedData && (
        <div className="p-4 bg-surface-container-low border border-border-gray rounded-xl flex items-start gap-3 animate-fade-in-up">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-on-surface leading-relaxed">
            <p className="font-bold text-on-surface">AI Recommended Pricing Benchmark</p>
            <p className="mt-0.5 text-text-muted">
              Based on visual analysis and fabric cues, the suggested catalog price is between{" "}
              <strong className="text-on-surface font-bold">₹{minRs}</strong> and{" "}
              <strong className="text-on-surface font-bold">₹{maxRs}</strong>.
            </p>
            {aiGeneratedData.confidenceNote && (
              <p className="text-text-muted italic mt-1 font-medium">
                Note: &ldquo;{aiGeneratedData.confidenceNote}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-5">
        {/* Product Name */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="name" className="block text-xs font-bold text-text-muted uppercase tracking-wider">
              Product Title
            </label>
            {aiGeneratedData && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-success-green/10 text-success-green border border-success-green/20 uppercase">
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI Suggested</span>
              </span>
            )}
          </div>
          <input
            id="name"
            type="text"
            placeholder="e.g. Banarasi Mulberry Silk Handloom Saree"
            className={`block w-full py-2.5 px-4 bg-surface border ${
              errors.name ? "border-error-red focus:ring-error-red" : "border-border-gray focus:ring-primary"
            } rounded-xl shadow-xs focus:outline-none focus:ring-2 text-sm font-bold text-on-surface transition-all`}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-error-red text-xs mt-1 flex items-center gap-1 font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.name.message}</span>
            </p>
          )}
        </div>

        {/* Short Summary Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="shortDescription" className="block text-xs font-bold text-text-muted uppercase tracking-wider">
              Short Catalog Summary
            </label>
            {aiGeneratedData && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-success-green/10 text-success-green border border-success-green/20 uppercase">
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI Suggested</span>
              </span>
            )}
          </div>
          <input
            id="shortDescription"
            type="text"
            placeholder="A concise 1-sentence highlight of the garment (max 150 chars)"
            maxLength={150}
            className={`block w-full py-2.5 px-4 bg-surface border ${
              errors.shortDescription ? "border-error-red focus:ring-error-red" : "border-border-gray focus:ring-primary"
            } rounded-xl shadow-xs focus:outline-none focus:ring-2 text-sm font-medium text-on-surface transition-all`}
            {...register("shortDescription")}
          />
          {errors.shortDescription && (
            <p className="text-error-red text-xs mt-1 flex items-center gap-1 font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.shortDescription.message}</span>
            </p>
          )}
        </div>

        {/* Full Brand Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="fullDescription" className="block text-xs font-bold text-text-muted uppercase tracking-wider">
              Full Garment Details & Wash Care
            </label>
            {aiGeneratedData && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-success-green/10 text-success-green border border-success-green/20 uppercase">
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI Suggested</span>
              </span>
            )}
          </div>
          <textarea
            id="fullDescription"
            rows={5}
            placeholder="Specify details about weave quality, occasion fit, zari work, and dry cleaning instructions..."
            className={`block w-full py-3 px-4 bg-surface border ${
              errors.fullDescription ? "border-error-red focus:ring-error-red" : "border-border-gray focus:ring-primary"
            } rounded-xl shadow-xs focus:outline-none focus:ring-2 text-sm font-medium text-on-surface transition-all leading-relaxed`}
            {...register("fullDescription")}
          />
          {errors.fullDescription && (
            <p className="text-error-red text-xs mt-1 flex items-center gap-1 font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.fullDescription.message}</span>
            </p>
          )}
        </div>

        {/* Category & Subcategory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="category" className="block text-xs font-bold text-text-muted uppercase tracking-wider">
                Primary Category
              </label>
              {aiGeneratedData && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-success-green/10 text-success-green uppercase">
                  AI
                </span>
              )}
            </div>
            <select
              id="category"
              className={`block w-full py-2.5 px-4 bg-surface border ${
                errors.category ? "border-error-red focus:ring-error-red" : "border-border-gray focus:ring-primary"
              } rounded-xl shadow-xs focus:outline-none focus:ring-2 text-sm font-bold text-on-surface transition-all`}
              {...register("category")}
            >
              <option value="">Select Category...</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-error-red text-xs mt-1 flex items-center gap-1 font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.category.message}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="subcategory" className="block text-xs font-bold text-text-muted uppercase tracking-wider">
              Subcategory (Optional)
            </label>
            <input
              id="subcategory"
              type="text"
              placeholder="e.g. Kanchipuram, Kurtas, Jackets"
              className="block w-full py-2.5 px-4 bg-surface border border-border-gray focus:ring-primary rounded-xl shadow-xs focus:outline-none focus:ring-2 text-sm font-medium text-on-surface transition-all"
              {...register("subcategory")}
            />
          </div>
        </div>

        {/* Search Tags */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="tagsInput" className="block text-xs font-bold text-text-muted uppercase tracking-wider">
              Search Tags (Comma Separated)
            </label>
            {aiGeneratedData && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-success-green/10 text-success-green uppercase">
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI Suggested</span>
              </span>
            )}
          </div>
          <input
            id="tagsInput"
            type="text"
            placeholder="e.g. silk, handloom, festive, wedding, banarasi"
            className={`block w-full py-2.5 px-4 bg-surface border ${
              errors.tags ? "border-error-red focus:ring-error-red" : "border-border-gray focus:ring-primary"
            } rounded-xl shadow-xs focus:outline-none focus:ring-2 text-sm font-medium text-on-surface transition-all`}
            onChange={(e) => {
              const val = e.target.value;
              const tagsArray = val
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t.length > 0);
              setValue("tags", tagsArray);
            }}
          />
          <p className="text-[11px] text-text-muted mt-1 font-medium">
            Separate keywords with commas (e.g. silk, handloom, wedding). Max 10 tags.
          </p>
          {errors.tags && (
            <p className="text-error-red text-xs mt-1 flex items-center gap-1 font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.tags.message}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
