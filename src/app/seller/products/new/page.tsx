"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ProductCreateSchema, ProductCreateInput } from "@/schemas/product.schema";
import { aiGenerateDescription } from "@/actions/ai-generate-description.action";
import { createProduct } from "@/actions/product-create.action";
import { publishProduct } from "@/actions/product-publish.action";
import { isEligibleToPublish } from "@/lib/product-validation";
import VariantStockEditor from "@/components/product/VariantStockEditor";
import AIDescriptionForm from "@/components/product/AIDescriptionForm";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  DollarSign,
  Plus,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function NewProductWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [aiData, setAiData] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Initialize main wizard form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ProductCreateInput>({
    resolver: zodResolver(ProductCreateSchema) as any,
    defaultValues: {
      name: "",
      shortDescription: "",
      fullDescription: "",
      category: "",
      subcategory: "",
      tags: [],
      price: 0,
      images: [],
      variants: [],
      aiGenerated: false,
    },
  });

  const watchedImages = watch("images") || [];
  const watchedPrice = watch("price") || 0;
  const watchedVariants = watch("variants") || [];

  // Determine eligibility to publish
  const eligibility = isEligibleToPublish({
    images: watchedImages,
    variants: watchedVariants,
  });

  // 1. Cloudinary Direct Signed Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (watchedImages.length + files.length > 6) {
      setUploadError("You can upload a maximum of 6 images.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // A. Request signature from Route Handler
        const signRes = await fetch("/api/cloudinary/sign", {
          method: "POST",
        });

        if (!signRes.ok) {
          const errData = await signRes.json();
          throw new Error(errData.error?.message || "Failed to authorize upload");
        }

        const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

        // B. Upload file directly to Cloudinary CDN
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadRes.ok) {
          throw new Error("Direct Cloudinary upload failed.");
        }

        const data = await uploadRes.json();

        // C. Update form state with new image url & public ID
        const currentImages = [...watchedImages];
        currentImages.push({
          url: data.secure_url,
          cloudinaryPublicId: data.public_id,
        });
        setValue("images", currentImages);
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload images.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = watchedImages.filter((_, i) => i !== index);
    setValue("images", updated);
  };

  // 2. AI Copywriting Mutation
  const aiMutation = useMutation({
    mutationFn: async (imageUrls: string[]) => {
      setAiError(null);
      const res = await aiGenerateDescription({ imageUrls });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || "AI description failed");
      }
      return res.data;
    },
    onSuccess: (data) => {
      // Pre-fill fields with AI Suggestions
      setValue("name", data.productName);
      setValue("shortDescription", data.shortDescription);
      setValue("fullDescription", data.fullDescription);
      setValue("category", data.category);
      setValue("subcategory", data.subcategory || "");
      setValue("tags", data.tags);
      setValue("aiGenerated", true);
      
      setAiData(data);
      setStep(2); // Advance to AI Review
    },
    onError: () => {
      // Fallback contract: show empty form instead of blocking workflow
      setAiError("We couldn't generate description suggestions. Please fill in the details manually.");
      setValue("aiGenerated", false);
      setStep(2); // Still advance to Step 2 so they can write manually
    },
  });

  const handleContinueToStep2 = () => {
    if (watchedImages.length === 0) {
      setUploadError("Upload at least one image to continue.");
      return;
    }
    const imageUrls = watchedImages.map((img) => img.url);
    aiMutation.mutate(imageUrls);
  };

  // 3. Create Product Mutation (Save as Draft or Publish directly)
  const createProductMutation = useMutation({
    mutationFn: async ({
      data,
      publish = false,
    }: {
      data: ProductCreateInput;
      publish?: boolean;
    }) => {
      const res = await createProduct(data);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || "Failed to create product");
      }
      const newProdId = res.data.productId;
      if (publish) {
        const pubRes = await publishProduct({ productId: newProdId });
        if (!pubRes.success) {
          throw new Error(pubRes.error?.message || "Product created as draft but failed to publish");
        }
      }
      return newProdId;
    },
    onSuccess: (_, variables) => {
      alert(
        variables.publish
          ? "Product listed and published successfully!"
          : "Product saved as draft successfully!"
      );
      router.push("/seller/products");
    },
    onError: (err: any) => {
      alert(`Action failed: ${err.message}`);
    },
  });

  const onSubmitForm = (data: ProductCreateInput, publish = false) => {
    // Check eligibility if trying to publish directly
    if (publish && !eligibility.eligible) {
      alert(eligibility.reason || "Product is not eligible to publish.");
      return;
    }
    createProductMutation.mutate({ data, publish });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Page Title & Back link */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/seller/products")}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </button>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Step {step} of 3
        </span>
      </div>

      {/* Stepper Header */}
      <div className="mb-10 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-around text-xs font-bold uppercase tracking-wider text-slate-400">
        <div className={`flex items-center gap-2 ${step >= 1 ? "text-indigo-600" : ""}`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-[10px] font-extrabold group-aria-current:bg-indigo-600">
            1
          </span>
          <span>Upload Photos</span>
        </div>
        <div className={`flex items-center gap-2 ${step >= 2 ? "text-indigo-600" : ""}`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-[10px] font-extrabold">
            2
          </span>
          <span>AI Suggestions</span>
        </div>
        <div className={`flex items-center gap-2 ${step >= 3 ? "text-indigo-600" : ""}`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-[10px] font-extrabold">
            3
          </span>
          <span>Inventory Details</span>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-8 shadow-xl bg-white border border-slate-100 min-h-[450px] flex flex-col justify-between">
        <div>
          {/* STEP 1: Cloudinary Photo Upload */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="text-lg font-bold text-slate-800 font-display mb-1 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  <span>Upload Product Photos</span>
                </h2>
                <p className="text-slate-500 text-xs">
                  Upload up to 6 high-quality images. The first image will be the primary cover photo.
                </p>
              </div>

              {/* Upload Drop Zone */}
              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-10 text-center transition-colors bg-slate-50/50">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 mb-4">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    {isUploading ? "Uploading photos..." : "Click or Drag to Upload Images"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">JPEG, PNG, WebP up to 10MB</p>
                </div>
              </div>

              {/* Upload Limit and Errors */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Uploaded: {watchedImages.length} / 6 photos</span>
                {uploadError && (
                  <span className="text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {uploadError}
                  </span>
                )}
              </div>

              {/* Image Previews */}
              {watchedImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 pt-4">
                  {watchedImages.map((img, idx) => (
                    <div
                      key={img.cloudinaryPublicId}
                      className="group relative aspect-square rounded-xl border border-slate-100 overflow-hidden bg-slate-50 shadow-sm"
                    >
                      <img src={img.url} alt="product" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-600 text-white uppercase">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Step Navigation */}
              <div className="pt-8 flex justify-end">
                <button
                  type="button"
                  onClick={handleContinueToStep2}
                  disabled={watchedImages.length === 0 || aiMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow cursor-pointer disabled:cursor-not-allowed"
                >
                  {aiMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Writing description...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate AI Copy</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: AI Review Form */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in-up">
              {aiError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex items-start gap-2.5 animate-fade-in-up mb-4">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">AI Assistant Offline</p>
                    <p className="text-red-600/90 mt-0.5 leading-relaxed">{aiError}</p>
                  </div>
                </div>
              )}

              <AIDescriptionForm
                register={register}
                errors={errors}
                setValue={setValue}
                aiGeneratedData={aiData}
                onRegenerate={() => aiMutation.mutate(watchedImages.map((img) => img.url))}
                isAiLoading={aiMutation.isPending}
              />

              {/* Step Navigation */}
              <div className="pt-8 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Photos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow cursor-pointer"
                >
                  <span>Continue to Inventory</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Pricing & Size-Stock Levels */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="text-lg font-bold text-slate-800 font-display mb-1">
                  Pricing & Size Variants
                </h2>
                <p className="text-slate-500 text-xs">
                  Specify the product price and add sizes with available inventory stock levels.
                </p>
              </div>

              {/* Price Input (seller enters Rupees, stored as paise internally) */}
              <div className="max-w-xs">
                <label htmlFor="priceRs" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Pricing (INR Rupees)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="text-sm font-semibold">₹</span>
                  </div>
                  <input
                    id="priceRs"
                    type="number"
                    min="100"
                    placeholder="2,499"
                    className={`block w-full pl-8 pr-4 py-3 bg-white border ${
                      errors.price ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    } rounded-xl shadow-sm focus:outline-none focus:ring-2 text-sm transition-all`}
                    value={watchedPrice > 0 ? watchedPrice / 100 : ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setValue("price", val * 100); // store in paise
                    }}
                  />
                </div>
                {errors.price && (
                  <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.price.message}</span>
                  </p>
                )}
              </div>

              {/* Variant / Size Stock Editor */}
              <div className="border-t border-slate-100 pt-6">
                <VariantStockEditor control={control} register={register} errors={errors} />
              </div>

              {/* Submit Buttons */}
              <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer w-full sm:w-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Details</span>
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {/* Save Draft */}
                  <button
                    type="button"
                    onClick={handleSubmit((data) => onSubmitForm(data, false))}
                    disabled={createProductMutation.isPending}
                    className="flex-1 sm:flex-initial px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Save as Draft
                  </button>

                  {/* Publish Directly */}
                  <div className="relative group flex-1 sm:flex-initial">
                    <button
                      type="button"
                      onClick={handleSubmit((data) => onSubmitForm(data, true))}
                      disabled={!eligibility.eligible || createProductMutation.isPending}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow cursor-pointer disabled:cursor-not-allowed"
                    >
                      {createProductMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : null}
                      <span>Publish Listing</span>
                    </button>
                    {!eligibility.eligible && (
                      <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg text-center leading-normal z-20">
                        {eligibility.reason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
