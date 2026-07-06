"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductUpdateSchema, ProductUpdateInput } from "@/schemas/product.schema";
import { aiGenerateDescription } from "@/actions/ai-generate-description.action";
import { updateProduct } from "@/actions/product-update.action";
import { publishProduct } from "@/actions/product-publish.action";
import { unpublishProduct } from "@/actions/product-unpublish.action";
import { deleteProduct } from "@/actions/product-delete.action";
import { isEligibleToPublish } from "@/lib/product-validation";
import VariantStockEditor from "@/components/product/VariantStockEditor";
import AIDescriptionForm from "@/components/product/AIDescriptionForm";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Globe,
  Save
} from "lucide-react";

interface EditProductFormProps {
  product: {
    id: string;
    name: string;
    shortDescription: string;
    fullDescription: string;
    category: string;
    subcategory: string | null;
    tags: string[];
    price: number;
    isPublished: boolean;
    aiGenerated: boolean;
    images: {
      url: string;
      cloudinaryPublicId: string;
    }[];
    variants: {
      size: string;
      stockCount: number;
    }[];
  };
}

export default function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [aiData, setAiData] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"media" | "details" | "inventory">("media");

  // Initialize update form with existing product details
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ProductUpdateInput>({
    resolver: zodResolver(ProductUpdateSchema) as any,
    defaultValues: {
      productId: product.id,
      name: product.name,
      shortDescription: product.shortDescription,
      fullDescription: product.fullDescription,
      category: product.category,
      subcategory: product.subcategory || "",
      tags: product.tags,
      price: product.price,
      images: product.images,
      variants: product.variants,
      aiGenerated: product.aiGenerated,
    },
  });

  const watchedImages = watch("images") || [];
  const watchedPrice = watch("price") || 0;
  const watchedVariants = watch("variants") || [];

  // Sync tags input on load
  useEffect(() => {
    const tagsInput = document.getElementById("tagsInput") as HTMLInputElement;
    if (tagsInput && product.tags.length > 0) {
      tagsInput.value = product.tags.join(", ");
    }
  }, [product.tags]);

  // Determine eligibility to publish
  const eligibility = isEligibleToPublish({
    images: watchedImages,
    variants: watchedVariants,
  });

  // Cloudinary Direct Signed Upload Handler
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

        // C. Update form state
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

  // AI Copywriting Mutation
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

      // Set tag input text manually
      const tagsInput = document.getElementById("tagsInput") as HTMLInputElement;
      if (tagsInput) {
        tagsInput.value = data.tags.join(", ");
      }

      setAiData(data);
      setActiveTab("details");
      alert("AI suggestions applied! Please review them in the Details tab.");
    },
    onError: () => {
      setAiError("We couldn't generate description suggestions. Please fill in the details manually.");
      setValue("aiGenerated", false);
    },
  });

  const handleTriggerAi = () => {
    if (watchedImages.length === 0) {
      alert("Upload at least one image to use the AI writer.");
      return;
    }
    const imageUrls = watchedImages.map((img) => img.url);
    aiMutation.mutate(imageUrls);
  };

  // Update Product Mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductUpdateInput) => {
      const res = await updateProduct(data);
      if (!res.success) {
        throw new Error(res.error?.message || "Failed to update product");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellerProducts"] });
      alert("Product updated successfully!");
      router.push("/seller/products");
    },
    onError: (err: any) => {
      alert(`Update failed: ${err.message}`);
    },
  });

  // Actions Mutations
  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await publishProduct({ productId: product.id });
      if (!res.success) throw new Error(res.error?.message || "Failed to publish");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellerProducts"] });
      alert("Product published successfully!");
      router.refresh();
      router.push("/seller/products");
    },
    onError: (err: any) => alert(`Publish failed: ${err.message}`),
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      const res = await unpublishProduct({ productId: product.id });
      if (!res.success) throw new Error(res.error?.message || "Failed to unpublish");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellerProducts"] });
      alert("Product unpublished successfully!");
      router.refresh();
      router.push("/seller/products");
    },
    onError: (err: any) => alert(`Unpublish failed: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await deleteProduct({ productId: product.id });
      if (!res.success) throw new Error(res.error?.message || "Failed to delete");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellerProducts"] });
      alert("Product deleted successfully!");
      router.push("/seller/products");
    },
    onError: (err: any) => alert(`Delete failed: ${err.message}`),
  });

  const handleSave = (data: ProductUpdateInput) => {
    updateProductMutation.mutate(data);
  };

  const handlePublish = () => {
    if (!eligibility.eligible) {
      alert(eligibility.reason || "Product is not eligible to publish.");
      return;
    }
    publishMutation.mutate();
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="space-y-md">
      {/* Top Header Navigation */}
      <div className="flex justify-between items-center border-b border-border-gray/40 pb-sm">
        <button
          type="button"
          onClick={() => router.push("/seller/products")}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-on-surface transition-colors cursor-pointer font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>
        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
          Product Editor
        </span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-base">
        <div>
          <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface flex items-center gap-2">
            <span>Edit {product.name}</span>
            {product.isPublished ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-success-green/10 text-success-green border border-success-green/20 uppercase tracking-wider">
                <Globe className="w-3 h-3" />
                <span>Live</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-surface-container text-text-muted border border-border-gray uppercase tracking-wider">
                <EyeOff className="w-3 h-3" />
                <span>Draft</span>
              </span>
            )}
          </h1>
          <p className="text-body-sm text-text-muted font-mono mt-0.5">Product ID: {product.id}</p>
        </div>

        {/* Top Level Action Controls */}
        <div className="flex items-center gap-sm w-full sm:w-auto">
          {product.isPublished ? (
            <button
              type="button"
              onClick={() => unpublishMutation.mutate()}
              disabled={unpublishMutation.isPending}
              className="flex-1 sm:flex-initial inline-flex justify-center items-center gap-1 px-4 py-2 border border-border-gray hover:bg-surface-container text-on-surface text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {unpublishMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              <span>Unpublish Listing</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={!eligibility.eligible || publishMutation.isPending}
              className="flex-1 sm:flex-initial inline-flex justify-center items-center gap-1 px-4 py-2 bg-success-green text-white text-xs font-bold rounded-xl shadow-xs hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50"
            >
              {publishMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
              <span>Publish Live</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="p-2 border border-border-gray hover:border-error-red hover:bg-error-red/10 text-error-red rounded-xl transition-colors cursor-pointer"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Layout Container */}
      <div className="bg-surface-container-lowest border border-border-gray rounded-2xl shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Sidebar Nav */}
        <div className="md:w-64 bg-surface border-r border-border-gray p-base space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "media"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-text-muted hover:bg-surface-container-low hover:text-on-surface"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Product Photos</span>
            <span className={`ml-auto text-[10px] rounded-full px-2 py-0.5 font-bold ${
              activeTab === "media" ? "bg-white/20 text-white" : "bg-surface-container text-text-muted"
            }`}>
              {watchedImages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "details"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-text-muted hover:bg-surface-container-low hover:text-on-surface"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Details & AI Writer</span>
            {errors.name || errors.shortDescription || errors.fullDescription || errors.category || errors.price ? (
              <span className="ml-auto w-2 h-2 rounded-full bg-error-red animate-pulse" />
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "inventory"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-text-muted hover:bg-surface-container-low hover:text-on-surface"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Inventory & Pricing</span>
            {errors.variants || errors.price ? (
              <span className="ml-auto w-2 h-2 rounded-full bg-error-red animate-pulse" />
            ) : null}
          </button>

          <div className="pt-8 mt-8 border-t border-border-gray hidden md:block">
            <div className="p-3 bg-surface-container-low border border-border-gray rounded-xl">
              <h4 className="text-[10px] font-bold text-on-surface uppercase tracking-wider mb-1">
                Publish Readiness
              </h4>
              <p className="text-[11px] text-text-muted leading-normal">
                {eligibility.eligible
                  ? "✓ Product is ready and eligible to go live."
                  : `✗ Not ready: ${eligibility.reason}`}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 p-base md:p-lg flex flex-col justify-between">
          <form onSubmit={handleSubmit(handleSave)} className="space-y-md">
            {/* MEDIA TAB */}
            {activeTab === "media" && (
              <div className="space-y-md animate-fade-in-up">
                <div>
                  <h2 className="font-headline-sm text-headline-sm font-extrabold text-on-surface mb-1">
                    Manage Product Photos
                  </h2>
                  <p className="text-body-sm text-text-muted">
                    Upload or replace images for your listing. The first image serves as the primary catalog thumbnail.
                  </p>
                </div>

                {/* Upload Dropzone */}
                <div className="relative border-2 border-dashed border-border-gray hover:border-primary rounded-2xl p-lg text-center transition-colors bg-surface/50">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center shadow-xs text-text-muted mb-3">
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-on-surface">
                      {isUploading ? "Uploading photos to Cloudinary CDN..." : "Click or Drag to Add More Photos"}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">JPEG, PNG, WebP up to 10MB</p>
                  </div>
                </div>

                {uploadError && (
                  <div className="text-error-red text-xs font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {uploadError}
                  </div>
                )}

                {/* Image Previews Grid */}
                {watchedImages.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-base">
                    {watchedImages.map((img, idx) => (
                      <div
                        key={img.cloudinaryPublicId}
                        className="group relative aspect-square rounded-xl border border-border-gray overflow-hidden bg-surface shadow-xs"
                      >
                        <img src={img.url} alt="product" className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-primary text-on-primary uppercase">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-error-red text-on-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                          title="Remove image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-border-gray rounded-xl">
                    <p className="text-text-muted text-xs">At least one image is required.</p>
                  </div>
                )}

                {/* AI copywriting generation trigger */}
                {watchedImages.length > 0 && (
                  <div className="pt-4 border-t border-border-gray flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      Want AI to regenerate titles, descriptions, and tags from photos?
                    </span>
                    <button
                      type="button"
                      onClick={handleTriggerAi}
                      disabled={aiMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-md py-2 bg-surface-container hover:bg-surface-container-high border border-border-gray text-primary text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      {aiMutation.isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Regenerate with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* DETAILS TAB */}
            {activeTab === "details" && (
              <div className="space-y-md animate-fade-in-up">
                {aiError && (
                  <div className="p-4 bg-error-red/10 border border-error-red/20 rounded-xl text-error-red text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
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
                  onRegenerate={handleTriggerAi}
                  isAiLoading={aiMutation.isPending}
                />
              </div>
            )}

            {/* INVENTORY & PRICING TAB */}
            {activeTab === "inventory" && (
              <div className="space-y-md animate-fade-in-up">
                <div>
                  <h2 className="font-headline-sm text-headline-sm font-extrabold text-on-surface mb-1">
                    Pricing & Size Variants
                  </h2>
                  <p className="text-body-sm text-text-muted">
                    Set the catalog selling price and specify size variant stock counts.
                  </p>
                </div>

                {/* Price Input Block */}
                <div className="bg-surface-container-low border border-border-gray rounded-2xl p-base space-y-2 w-full max-w-[480px]">
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
                    />
                  </div>
                  <p className="text-[11px] text-text-muted font-medium">
                    This is the public selling price displayed to buyers on Velvet Lane.
                  </p>
                  {errors.price && (
                    <p className="text-error-red text-xs mt-1 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.price.message}</span>
                    </p>
                  )}
                </div>

                <div className="border-t border-border-gray pt-md">
                  <VariantStockEditor control={control} register={register} errors={errors} />
                </div>
              </div>
            )}

            {/* Bottom Save Action Controls */}
            <div className="pt-md border-t border-border-gray flex items-center justify-end gap-base">
              <button
                type="button"
                onClick={() => router.push("/seller/products")}
                className="px-lg py-2.5 border border-border-gray hover:bg-surface-container text-secondary text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={updateProductMutation.isPending}
                className="inline-flex items-center justify-center gap-xs px-xl py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-xs hover:opacity-90 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {updateProductMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
