"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSellerProducts } from "@/actions/seller-products-get.action";
import { publishProduct } from "@/actions/product-publish.action";
import { unpublishProduct } from "@/actions/product-unpublish.action";
import { deleteProduct } from "@/actions/product-delete.action";
import SellerLayout from "@/components/seller/SellerLayout";
import { 
  PackagePlus, 
  Plus, 
  Edit3, 
  Globe, 
  EyeOff, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Search,
  Package,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

export default function SellerProductsDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");

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

  const handleDeleteProduct = (productId: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This product will be archived.`)) {
      deleteMutation.mutate(productId);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <SellerLayout>
        <div className="space-y-lg animate-pulse">
          <div className="h-12 bg-surface-container rounded-xl w-1/3" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-base">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-surface-container rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-surface-container rounded-xl" />
        </div>
      </SellerLayout>
    );
  }

  // Error state
  if (isError) {
    return (
      <SellerLayout>
        <div className="max-w-3xl mx-auto py-16 text-center space-y-md">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-on-surface">Failed to Load Product Catalog</h2>
          <p className="text-text-muted text-sm">{error?.message || "An unexpected error occurred."}</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["sellerProducts"] })}
            className="px-6 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl shadow cursor-pointer"
          >
            Retry Fetching
          </button>
        </div>
      </SellerLayout>
    );
  }

  const products: any[] = res || [];

  // Filter products by search & tab
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    if (!matchesQuery) return false;

    if (activeFilterTab === "PUBLISHED") return p.isPublished;
    if (activeFilterTab === "DRAFT") return !p.isPublished;
    return true;
  });

  const publishedCount = products.filter((p) => p.isPublished).length;
  const draftCount = products.length - publishedCount;
  const totalStockUnits = products.reduce(
    (sum, p) => sum + (p.variants?.reduce((vSum: number, v: any) => vSum + v.stockCount, 0) || 0),
    0
  );

  return (
    <SellerLayout>
      <div className="space-y-lg">
        {/* Header Title & CTA */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-base border-b border-border-gray/40 pb-md">
          <div>
            <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface">
              My Product Catalog
            </h1>
            <p className="text-body-sm text-text-muted mt-1">
              Manage listings, size variants, stock inventory, and public store visibility.
            </p>
          </div>
          <Link
            href="/seller/products/new"
            className="px-lg py-2.5 bg-primary text-on-primary font-label-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-xs shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>

        {/* Summary Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-base">
          <div className="bg-surface-container-lowest border border-border-gray p-base rounded-xl shadow-xs">
            <span className="text-text-muted font-label-bold text-label-bold uppercase">Total Products</span>
            <p className="font-headline-lg text-2xl font-black text-on-surface mt-1">{products.length}</p>
          </div>

          <div className="bg-surface-container-lowest border border-border-gray p-base rounded-xl shadow-xs">
            <span className="text-text-muted font-label-bold text-label-bold uppercase">Published Live</span>
            <p className="font-headline-lg text-2xl font-black text-success-green mt-1">{publishedCount}</p>
          </div>

          <div className="bg-surface-container-lowest border border-border-gray p-base rounded-xl shadow-xs">
            <span className="text-text-muted font-label-bold text-label-bold uppercase">Draft Items</span>
            <p className="font-headline-lg text-2xl font-black text-text-muted mt-1">{draftCount}</p>
          </div>

          <div className="bg-surface-container-lowest border border-border-gray p-base rounded-xl shadow-xs">
            <span className="text-text-muted font-label-bold text-label-bold uppercase">Stock Units</span>
            <p className="font-headline-lg text-2xl font-black text-on-surface mt-1">{totalStockUnits}</p>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-base bg-surface-container-lowest border border-border-gray p-base rounded-xl shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product title or category..."
              className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border-gray rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              suppressHydrationWarning
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilterTab("ALL")}
              suppressHydrationWarning
              className={`px-4 py-1.5 font-label-bold text-xs rounded-full cursor-pointer transition-colors ${
                activeFilterTab === "ALL"
                  ? "bg-primary text-on-primary font-bold"
                  : "bg-surface border border-border-gray hover:bg-surface-container-low text-text-muted"
              }`}
            >
              All ({products.length})
            </button>

            <button
              onClick={() => setActiveFilterTab("PUBLISHED")}
              suppressHydrationWarning
              className={`px-4 py-1.5 font-label-bold text-xs rounded-full cursor-pointer transition-colors ${
                activeFilterTab === "PUBLISHED"
                  ? "bg-success-green text-white font-bold"
                  : "bg-surface border border-border-gray hover:bg-surface-container-low text-text-muted"
              }`}
            >
              Published ({publishedCount})
            </button>

            <button
              onClick={() => setActiveFilterTab("DRAFT")}
              suppressHydrationWarning
              className={`px-4 py-1.5 font-label-bold text-xs rounded-full cursor-pointer transition-colors ${
                activeFilterTab === "DRAFT"
                  ? "bg-slate-700 text-white font-bold"
                  : "bg-surface border border-border-gray hover:bg-surface-container-low text-text-muted"
              }`}
            >
              Drafts ({draftCount})
            </button>
          </div>
        </div>

        {/* Catalog Table Container */}
        {filteredProducts.length === 0 ? (
          <div className="border border-dashed border-border-gray rounded-2xl bg-surface-container-lowest p-xxl text-center max-w-[540px] w-full mx-auto shadow-xs space-y-md">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
              <PackagePlus className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-on-surface">No Products Match Your View</h2>
              <p className="text-text-muted text-xs mt-1 leading-relaxed">
                Create new product listings or try clearing your search query.
              </p>
            </div>
            <Link
              href="/seller/products/new"
              className="inline-flex items-center gap-xs px-xl py-md bg-primary text-on-primary font-bold text-xs rounded-xl shadow-xs hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              <span>Create Product Listing</span>
            </Link>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-border-gray rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border-gray font-label-bold text-body-sm text-on-surface-variant uppercase tracking-wider">
                    <th className="py-md px-base">Product Item</th>
                    <th className="py-md px-base">Price</th>
                    <th className="py-md px-base">Inventory Stock</th>
                    <th className="py-md px-base">Visibility</th>
                    <th className="py-md px-base text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-gray text-body-sm">
                  {filteredProducts.map((prod) => {
                    const primaryImg = prod.images?.[0]?.url || "/placeholder.jpg";
                    const totalStock = prod.variants?.reduce((sum: number, v: any) => sum + v.stockCount, 0) || 0;
                    const priceFormatted = `₹${(prod.price / 100).toLocaleString("en-IN")}`;

                    return (
                      <tr key={prod.id} className="hover:bg-surface-container-low/30 transition-colors group">
                        {/* Product Image & Details */}
                        <td className="py-md px-base flex items-center gap-md">
                          <img
                            src={primaryImg}
                            alt={prod.name}
                            className="w-12 h-12 rounded-lg bg-surface-container border border-border-gray object-cover shrink-0"
                          />
                          <div className="max-w-[240px]">
                            <p className="font-label-bold text-label-bold truncate text-on-surface">
                              {prod.name}
                            </p>
                            <p className="text-[11px] text-text-muted mt-0.5 font-medium">
                              {prod.category} {prod.subcategory ? `• ${prod.subcategory}` : ""}
                            </p>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-md px-base font-bold text-on-surface">{priceFormatted}</td>

                        {/* Inventory Stock */}
                        <td className="py-md px-base">
                          {totalStock > 0 ? (
                            <span className="font-medium text-on-surface">
                              {totalStock} units ({prod.variants?.length || 0} variants)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-error-red/10 text-error-red border border-error-red/20 uppercase">
                              Out of Stock
                            </span>
                          )}
                        </td>

                        {/* Visibility Status Badge */}
                        <td className="py-md px-base">
                          {prod.isPublished ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-success-green/10 text-success-green border border-success-green/20 uppercase tracking-wider">
                              <Globe className="w-3 h-3" />
                              <span>Published</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-surface-container text-text-muted border border-border-gray uppercase tracking-wider">
                              <EyeOff className="w-3 h-3" />
                              <span>Draft</span>
                            </span>
                          )}
                        </td>

                        {/* Row Action Controls */}
                        <td className="py-md px-base text-right whitespace-nowrap space-x-xs">
                          <button
                            onClick={() => router.push(`/seller/products/${prod.id}/edit`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-border-gray hover:bg-surface-container rounded-lg font-bold text-xs text-on-surface transition-colors cursor-pointer"
                            title="Edit Listing Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handlePublishToggle(prod.id, prod.isPublished)}
                            disabled={publishMutation.isPending || unpublishMutation.isPending}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 border font-bold text-xs rounded-lg transition-colors cursor-pointer ${
                              prod.isPublished
                                ? "border-border-gray text-text-muted hover:bg-surface-container"
                                : "border-primary bg-primary text-on-primary hover:opacity-90"
                            }`}
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
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            disabled={deleteMutation.isPending}
                            className="p-2 border border-border-gray hover:border-error-red hover:bg-error-red/10 text-error-red rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
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
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
