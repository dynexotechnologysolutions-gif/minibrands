"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSellerProducts } from "@/actions/seller-products-get.action";
import { publishProduct } from "@/actions/product-publish.action";
import { unpublishProduct } from "@/actions/product-unpublish.action";
import { deleteProduct } from "@/actions/product-delete.action";
import { 
  PackagePlus, 
  Plus, 
  Edit3, 
  Globe, 
  EyeOff, 
  Trash2, 
  Loader2, 
  AlertCircle,
  MoreVertical,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export default function SellerProductsDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Query to fetch seller's products
  const { data: res, isLoading, isError, error } = useQuery({
    queryKey: ["sellerProducts"],
    queryFn: async () => {
      const response = await getSellerProducts();
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "Failed to fetch products");
      }
      return response.data;
    },
  });

  // 2. Mutation for publishing a product
  const publishMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await publishProduct({ productId });
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to publish product");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellerProducts"] });
      alert("Product published successfully!");
    },
    onError: (err: any) => {
      alert(`Publish failed: ${err.message}`);
    }
  });

  // 3. Mutation for unpublishing a product
  const unpublishMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await unpublishProduct({ productId });
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to unpublish product");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellerProducts"] });
      alert("Product unpublished successfully!");
    },
    onError: (err: any) => {
      alert(`Unpublish failed: ${err.message}`);
    }
  });

  // 4. Mutation for soft-deleting a product
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await deleteProduct({ productId });
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to delete product");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellerProducts"] });
      alert("Product deleted successfully!");
    },
    onError: (err: any) => {
      alert(`Delete failed: ${err.message}`);
    }
  });

  const handlePublishToggle = (productId: string, isPublished: boolean) => {
    if (isPublished) {
      if (confirm("Are you sure you want to unpublish this product? It will be hidden from the public catalog.")) {
        unpublishMutation.mutate(productId);
      }
    } else {
      publishMutation.mutate(productId);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      deleteMutation.mutate(productId);
    }
  };

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm space-y-4 p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3.5 w-24 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-16 bg-slate-100 rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Failed to Load Products</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">{error?.message || "An unexpected error occurred."}</p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["sellerProducts"] })}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow"
        >
          Retry Fetching
        </button>
      </div>
    );
  }

  const products = res || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800">My Product Catalog</h1>
          <p className="text-slate-500 text-xs mt-1">Manage listings, variants, stock, and publishing status.</p>
        </div>
        <Link
          href="/seller/products/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </Link>
      </div>

      {products.length === 0 ? (
        /* Empty State */
        <div className="border border-dashed border-slate-200 rounded-2xl bg-white p-16 text-center max-w-[576px] mx-auto shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <PackagePlus className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">List Your First Product</h2>
          <p className="text-slate-500 text-xs mt-1.5 mb-8 max-w-sm mx-auto leading-relaxed">
            Onboard photos of your sarees, accessories, or streetwear. Use our AI wizard to instantly generate description details.
          </p>
          <Link
            href="/seller/products/new"
            className="inline-flex items-center gap-1 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Product Listing</span>
          </Link>
        </div>
      ) : (
        /* Data Table List */
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Stock Level</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {products.map((prod) => {
                  const primaryImg = prod.images?.[0]?.url || "/placeholder.jpg";
                  const totalStock = prod.variants?.reduce((sum: number, v: any) => sum + v.stockCount, 0) || 0;
                  const priceFormatted = (prod.price / 100).toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  });

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Product details */}
                      <td className="py-4 px-6 flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                          <img src={primaryImg} alt={prod.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 line-clamp-1">{prod.name}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{prod.category}</p>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 font-semibold text-slate-700">{priceFormatted}</td>

                      {/* Stock Summary */}
                      <td className="py-4 px-6">
                        {totalStock > 0 ? (
                          <span className="text-xs text-slate-600 font-medium">
                            {totalStock} in stock ({prod.variants?.length} sizes)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100">
                            Out of Stock
                          </span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="py-4 px-6">
                        {prod.isPublished ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <Globe className="w-3.5 h-3.5" />
                            <span>Published</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-100">
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Draft</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right space-x-1.5">
                        <button
                          onClick={() => router.push(`/seller/products/${prod.id}/edit`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 rounded-lg text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handlePublishToggle(prod.id, prod.isPublished)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 border ${
                            prod.isPublished
                              ? "border-slate-200 hover:bg-slate-50 hover:text-slate-700 text-slate-600"
                              : "border-indigo-100 bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                          } rounded-lg text-xs font-semibold transition-colors cursor-pointer`}
                          disabled={publishMutation.isPending || unpublishMutation.isPending}
                        >
                          {prod.isPublished ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Unpublish</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-3.5 h-3.5" />
                              <span>Publish</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="inline-flex items-center justify-center p-1.5 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition-colors cursor-pointer"
                          title="Delete product"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Collapsible Cards View */}
          <div className="md:hidden divide-y divide-slate-100">
            {products.map((prod) => {
              const primaryImg = prod.images?.[0]?.url || "/placeholder.jpg";
              const totalStock = prod.variants?.reduce((sum: number, v: any) => sum + v.stockCount, 0) || 0;
              const priceFormatted = (prod.price / 100).toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              });

              return (
                <div key={prod.id} className="p-4 space-y-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                      <img src={primaryImg} alt={prod.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{prod.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{prod.category}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="font-bold text-slate-700 text-xs">{priceFormatted}</span>
                        <span className="text-[10px] font-medium text-slate-400">&bull;</span>
                        <span className="text-xs text-slate-500">Stock: {totalStock}</span>
                      </div>
                    </div>
                    <div>
                      {prod.isPublished ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-100">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions mobile */}
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={() => router.push(`/seller/products/${prod.id}/edit`)}
                      className="flex-1 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-center text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handlePublishToggle(prod.id, prod.isPublished)}
                      className={`flex-1 py-2 border ${
                        prod.isPublished
                          ? "border-slate-200 text-slate-600"
                          : "border-indigo-100 bg-indigo-50 text-indigo-700"
                      } rounded-xl text-center text-xs font-semibold cursor-pointer`}
                      disabled={publishMutation.isPending || unpublishMutation.isPending}
                    >
                      {prod.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="px-3 py-2 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 rounded-xl cursor-pointer"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
