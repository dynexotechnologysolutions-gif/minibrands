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
  ArrowRight,
  ArrowLeft,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  PackageCheck,
  Layers,
  FileEdit
} from "lucide-react";

import SellerLayout from "@/components/seller/SellerLayout";

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
    trigger,
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

        const signRes = await fetch("/api/cloudinary/sign", {
          method: "POST",
        });

        if (!signRes.ok) {
          const errData = await signRes.json();
          throw new Error(errData.error?.message || "Failed to authorize upload");
        }

        const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

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
      setValue("name", data.productName);
      setValue("shortDescription", data.shortDescription);
      setValue("fullDescription", data.fullDescription);
      setValue("category", data.category);
      setValue("subcategory", data.subcategory || "");
      setValue("tags", data.tags);
      setValue("aiGenerated", true);

      setAiData(data);
      setStep(2);
    },
    onError: () => {
      setAiError("We couldn't generate description suggestions. Please fill in the details manually.");
      setValue("aiGenerated", false);
      setStep(2);
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

  // 3. Create Product Mutation
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

  const handleContinueToStep3 = async () => {
    const isStep2Valid = await trigger([
      "name",
      "shortDescription",
      "fullDescription",
      "category",
    ]);
    if (isStep2Valid) {
      setStep(3);
    }
  };

  const onSubmitForm = (data: ProductCreateInput, publish = false) => {
    if (publish && !eligibility.eligible) {
      alert(eligibility.reason || "Product is not eligible to publish.");
      return;
    }
    createProductMutation.mutate({ data, publish });
  };

  return (
    <SellerLayout>
      <div className="max-w-[800px] mx-auto space-y-md">
        {/* Header Title */}
        <div className="flex justify-between items-center border-b border-border-gray/40 pb-sm">
          <button
            type="button"
            onClick={() => router.push("/seller/products")}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-on-surface transition-colors cursor-pointer font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products Catalog</span>
          </button>
          <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
            Step {step} of 3
          </span>
        </div>

        {/* Stepper Header Bar */}
        <div className="bg-surface-container-lowest border border-border-gray rounded-2xl p-base shadow-xs flex items-center justify-around gap-base flex-wrap text-xs font-bold uppercase tracking-wider text-text-muted">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 cursor-pointer transition-colors ${step >= 1 ? "text-on-surface font-extrabold" : ""}`}
          >
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 1 ? "bg-primary text-on-primary shadow-xs" : "bg-surface-container text-text-muted"
            }`}>
              1
            </span>
            <span className="hidden sm:inline">1. Product Photos</span>
            <span className="sm:hidden">Photos</span>
          </button>

          <span className="text-border-gray font-normal">&rarr;</span>

          <button
            type="button"
            onClick={() => watchedImages.length > 0 && setStep(2)}
            disabled={watchedImages.length === 0}
            className={`flex items-center gap-2 transition-colors ${
              watchedImages.length > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            } ${step >= 2 ? "text-on-surface font-extrabold" : ""}`}
          >
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 2 ? "bg-primary text-on-primary shadow-xs" : "bg-surface-container text-text-muted"
            }`}>
              2
            </span>
            <span className="hidden sm:inline">2. Details & AI Assistant</span>
            <span className="sm:hidden">Details</span>
          </button>

          <span className="text-border-gray font-normal">&rarr;</span>

          <button
            type="button"
            onClick={handleContinueToStep3}
            disabled={watchedImages.length === 0}
            className={`flex items-center gap-2 transition-colors ${
              watchedImages.length > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            } ${step >= 3 ? "text-on-surface font-extrabold" : ""}`}
          >
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 3 ? "bg-primary text-on-primary shadow-xs" : "bg-surface-container text-text-muted"
            }`}>
              3
            </span>
            <span className="hidden sm:inline">3. Variants & Stock</span>
            <span className="sm:hidden">Variants</span>
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-base sm:p-lg border border-border-gray shadow-xs min-h-[460px] flex flex-col justify-between space-y-md">
          <div>
            {/* STEP 1: Cloudinary Photo Upload */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h2 className="text-lg font-extrabold text-on-surface mb-1 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    <span>Upload Product Photos</span>
                  </h2>
                  <p className="text-text-muted text-xs">
                    Upload up to 6 high-resolution product imagery files. The first photo becomes the main catalog cover.
                  </p>
                </div>

                {/* Upload Drop Zone */}
                <div className="relative border-2 border-dashed border-border-gray hover:border-primary/60 rounded-2xl p-8 sm:p-12 text-center transition-all bg-surface/40">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    suppressHydrationWarning
                  />
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-surface-container-lowest border border-border-gray rounded-2xl flex items-center justify-center shadow-xs text-text-muted mb-3">
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      ) : (
                        <Upload className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <p className="text-xs font-extrabold text-on-surface">
                      {isUploading ? "Uploading imagery to Cloudinary..." : "Click or Drag & Drop Product Imagery"}
                    </p>
                    <p className="text-[11px] text-text-muted mt-1">JPEG, PNG, WebP up to 10MB per file</p>
                  </div>
                </div>

                {/* Upload Limit and Errors */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted font-bold">Uploaded Photos: {watchedImages.length} / 6</span>
                  {uploadError && (
                    <span className="text-error-red font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {uploadError}
                    </span>
                  )}
                </div>

                {/* Image Previews */}
                {watchedImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-2">
                    {watchedImages.map((img, idx) => (
                      <div
                        key={img.cloudinaryPublicId}
                        className="group relative aspect-square rounded-xl border border-border-gray overflow-hidden bg-surface shadow-xs"
                      >
                        <img src={img.url} alt="product photo" className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-primary text-on-primary uppercase">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-error-red text-white hover:opacity-90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                          title="Remove image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 1 CTA */}
                <div className="pt-6 flex justify-end border-t border-border-gray/40">
                  <button
                    type="button"
                    onClick={handleContinueToStep2}
                    disabled={watchedImages.length === 0 || aiMutation.isPending}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-xs hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed active:scale-95"
                  >
                    {aiMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI Copywriter Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate AI Copy & Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: AI Details Review Form */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in-up">
                {aiError && (
                  <div className="p-4 bg-error-red/10 border border-error-red/20 rounded-xl text-error-red text-xs flex items-start gap-2.5 animate-fade-in-up mb-4">
                    <AlertCircle className="w-4 h-4 text-error-red shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">AI Assistant Offline</p>
                      <p className="text-error-red/90 mt-0.5 leading-relaxed">{aiError}</p>
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

                {/* Step 2 CTA */}
                <div className="pt-6 flex items-center justify-between border-t border-border-gray/40">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-on-surface font-bold cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Photos</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleContinueToStep3}
                    className="inline-flex items-center gap-1.5 px-6 py-3 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-xs hover:opacity-90 transition-all cursor-pointer active:scale-95"
                  >
                    <span>Continue to Inventory & Pricing</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Pricing & Size-Stock Levels */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h2 className="text-lg font-extrabold text-on-surface mb-1 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    <span>Listing Price & Stock Levels</span>
                  </h2>
                  <p className="text-text-muted text-xs">
                    Specify catalog pricing in Rupees and configure size variant stock quantities.
                  </p>
                </div>

                {/* Price Input */}
                <div className="w-full max-w-[480px] bg-surface-container-low border border-border-gray rounded-2xl p-base space-y-2">
                  <label htmlFor="priceRs" className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                    Listing Price (INR ₹)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface">
                      <span className="text-base font-black">₹</span>
                    </div>
                    <input
                      id="priceRs"
                      type="number"
                      min="100"
                      placeholder="e.g. 2499"
                      className={`block w-full pl-9 pr-4 py-3 bg-surface-container-lowest border ${
                        errors.price ? "border-error-red focus:ring-error-red" : "border-border-gray focus:ring-primary"
                      } rounded-xl shadow-xs focus:outline-none focus:ring-2 text-base font-extrabold text-on-surface transition-all`}
                      value={watchedPrice > 0 ? watchedPrice / 100 : ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setValue("price", val * 100);
                      }}
                      suppressHydrationWarning
                    />
                  </div>
                  {errors.price && (
                    <p className="text-error-red text-xs mt-1 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.price.message}</span>
                    </p>
                  )}
                </div>

                {/* Variant / Size Stock Editor */}
                <div className="border-t border-border-gray/40 pt-4">
                  <VariantStockEditor control={control} register={register} errors={errors} />
                </div>

                {/* Submit Action Buttons */}
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-base border-t border-border-gray/40">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-on-surface font-bold cursor-pointer w-full sm:w-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Product Details</span>
                  </button>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {/* Save Draft */}
                    <button
                      type="button"
                      onClick={handleSubmit((data) => onSubmitForm(data, false))}
                      disabled={createProductMutation.isPending}
                      className="flex-1 sm:flex-initial px-5 py-3 border border-border-gray hover:bg-surface-container text-on-surface text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Save as Draft
                    </button>

                    {/* Publish Directly */}
                    <div className="relative group flex-1 sm:flex-initial">
                      <button
                        type="button"
                        onClick={handleSubmit((data) => onSubmitForm(data, true))}
                        disabled={!eligibility.eligible || createProductMutation.isPending}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-xs hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed active:scale-95"
                      >
                        {createProductMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        <span>Publish Listing</span>
                      </button>
                      {!eligibility.eligible && (
                        <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 hidden group-hover:block w-48 p-2 bg-on-surface text-surface text-[10px] rounded-lg shadow-lg text-center leading-normal z-20 font-medium">
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
    </SellerLayout>
  );
}
