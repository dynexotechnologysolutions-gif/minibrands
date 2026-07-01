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
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Top Navigation / Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/seller/products")}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </button>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Product Editor
        </span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 flex items-center gap-2">
            <span>Edit Product</span>
            {product.isPublished ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Globe className="w-3 h-3" />
                <span>Live</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-100">
                <EyeOff className="w-3 h-3" />
                <span>Draft</span>
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-xs mt-1">ID: {product.id}</p>
        </div>

        {/* Top level actions */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {product.isPublished ? (
            <button
              type="button"
              onClick={() => unpublishMutation.mutate()}
              disabled={unpublishMutation.isPending}
              className="flex-1 md:flex-initial inline-flex justify-center items-center gap-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {unpublishMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              <span>Unpublish</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={!eligibility.eligible || publishMutation.isPending}
              className="flex-1 md:flex-initial inline-flex justify-center items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {publishMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
              <span>Publish</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            title="Delete Product"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Sidebar Nav */}
        <div className="md:w-64 bg-slate-50/50 border-r border-slate-100 p-6 space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "media"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-600 hover:bg-slate-100/80"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Product Photos</span>
            <span className="ml-auto text-[10px] bg-slate-200/50 text-slate-600 group-hover:bg-slate-300 rounded-full px-1.5 py-0.5">
              {watchedImages.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "details"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-600 hover:bg-slate-100/80"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Details & AI Writer</span>
            {errors.name || errors.shortDescription || errors.fullDescription || errors.category || errors.price ? (
              <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "inventory"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-600 hover:bg-slate-100/80"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Inventory & Pricing</span>
            {errors.variants || errors.price ? (
              <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            ) : null}
          </button>

          <div className="pt-8 mt-8 border-t border-slate-100/80 hidden md:block">
            <div className="p-3 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl">
              <h4 className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider mb-1">
                Publish Status
              </h4>
              <p className="text-[11px] text-indigo-900 leading-normal">
                {eligibility.eligible
                  ? "✓ Eligible to publish. You can set this product live in the catalog."
                  : `✗ Not ready: ${eligibility.reason}`}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 p-8 flex flex-col justify-between">
          <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
            {/* MEDIA TAB */}
            {activeTab === "media" && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-display mb-1">
                    Manage Photos
                  </h2>
                  <p className="text-slate-500 text-xs">
                    Add or remove images for your listing. The first image serves as the main catalog cover.
                  </p>
                </div>

                {/* Upload Area */}
                <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 text-center transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 mb-3">
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      {isUploading ? "Uploading photos..." : "Add More Product Photos"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">JPEG, PNG, WebP up to 10MB</p>
                  </div>
                </div>

                {uploadError && (
                  <div className="text-red-600 text-xs font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {uploadError}
                  </div>
                )}

                {/* Image Previews Grid */}
                {watchedImages.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
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
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-400 text-xs">At least one image is required.</p>
                  </div>
                )}

                {/* AI copywriting generation trigger */}
                {watchedImages.length > 0 && (
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Want to completely regenerate names and details using AI?
                    </span>
                    <button
                      type="button"
                      onClick={handleTriggerAi}
                      disabled={aiMutation.isPending}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      {aiMutation.isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Regenerate Details</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* DETAILS TAB */}
            {activeTab === "details" && (
              <div className="space-y-6 animate-fade-in-up">
                {aiError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex items-start gap-2.5 animate-fade-in-up">
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
                  onRegenerate={handleTriggerAi}
                  isAiLoading={aiMutation.isPending}
                />
              </div>
            )}

            {/* INVENTORY & PRICING TAB */}
            {activeTab === "inventory" && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-display mb-1">
                    Pricing & Size Variants
                  </h2>
                  <p className="text-slate-500 text-xs">
                    Specify the listing price and sizes in stock.
                  </p>
                </div>

                {/* Price Input */}
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

                <div className="border-t border-slate-100 pt-6">
                  <VariantStockEditor control={control} register={register} errors={errors} />
                </div>
              </div>
            )}

            {/* Bottom Actions Row */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/seller/products")}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateProductMutation.isPending}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow transition-colors cursor-pointer"
              >
                {updateProductMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
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
