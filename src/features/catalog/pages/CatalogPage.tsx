"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import HomeHeader from "@/components/home/HomeHeader";
import SearchToolbar from "../components/SearchToolbar";
import CategoryChips from "../components/CategoryChips";
import FiltersSidebar from "../components/FiltersSidebar";
import ProductGrid from "../components/ProductGrid";
import Pagination from "../components/Pagination";

import { useCategories } from "../hooks/useCategories";
import { useProducts } from "../hooks/useProducts";
import { useWishlist } from "../hooks/useWishlist";

interface CatalogPageProps {
  userProfile?: any;
  initialCartCount: number;
  sellerHref: string;
}

const ProductCardSkeleton = () => (
  <div className="flex animate-pulse flex-col overflow-hidden rounded-vl-card border border-vl-border bg-vl-card">
    <div className="aspect-[3/4] bg-vl-border/60" />
    <div className="flex flex-col gap-2 p-4">
      <div className="h-2.5 w-1/3 rounded-full bg-vl-border" />
      <div className="h-3.5 w-3/4 rounded bg-vl-border" />
      <div className="h-3.5 w-1/2 rounded bg-vl-border" />
      <div className="mt-1 h-2.5 w-1/4 rounded-full bg-vl-border" />
      <div className="mt-1 h-4 w-2/5 rounded bg-vl-border" />
    </div>
  </div>
);

export default function CatalogPage({ userProfile, initialCartCount, sellerHref }: CatalogPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Parse filter conditions from URL query parameters
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "All";
  const sort = searchParams.get("sort") || "popularity";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const rating = searchParams.get("rating") ? parseInt(searchParams.get("rating")!) : undefined;
  const discount = searchParams.get("discount") ? parseInt(searchParams.get("discount")!) : undefined;

  let priceRange: [number, number] | undefined = undefined;
  const priceRangeParam = searchParams.get("priceRange");
  if (priceRangeParam) {
    const parts = priceRangeParam.split("-");
    priceRange = [parseFloat(parts[0] || "499"), parseFloat(parts[1] || "10000")];
  }

  const filters = {
    q,
    category,
    sort,
    page,
    rating,
    discount,
    priceRange,
  };

  // 2. Dynamic SEO browser titles
  useEffect(() => {
    let title = "Products | Velvet Lane";
    if (q) {
      title = `Search Results for "${q}" | Velvet Lane`;
    } else if (category && category !== "All") {
      title = `${category} Products | Velvet Lane`;
    }
    document.title = title;
  }, [q, category]);

  // 3. React Query hooks
  const { data: categories = [] } = useCategories();
  const { data: productsData, isLoading } = useProducts(filters);
  const { toggleWishlist } = useWishlist();

  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const startTimeRef = useRef(Date.now());
  const [searchTime, setSearchTime] = useState(0.42);

  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setAlertMsg({ text, type });
  };

  useEffect(() => {
    if (alertMsg) {
      const t = setTimeout(() => setAlertMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [alertMsg]);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading) {
      const duration = ((Date.now() - startTimeRef.current) / 1000).toFixed(2);
      setSearchTime(parseFloat(duration) || 0.12);
    }
  }, [isLoading]);

  // 4. Update dynamic parameters in the URL
  const updateUrl = (updated: Record<string, any>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset page to 1 on filter changes unless page is explicitly updated
    if (!("page" in updated)) {
      params.set("page", "1");
    }

    Object.entries(updated).forEach(([key, val]) => {
      if (val === undefined || val === null || val === "" || val === "All") {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });

    router.push(`/products?${params.toString()}`);
  };

  const handleWishlistToggle = async (productId: string, isWishlisted: boolean) => {
    try {
      await toggleWishlist(productId, isWishlisted);
      triggerToast(
        isWishlisted
          ? "Removed from wishlist successfully."
          : "Added to wishlist successfully.",
        "success"
      );
    } catch (err: any) {
      triggerToast(err.message || "Failed to update wishlist.", "error");
    }
  };

  const handleClearAll = () => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category && filters.category !== "All") params.set("category", filters.category);
    params.set("page", "1");
    params.set("sort", "popularity");
    router.push(`/products?${params.toString()}`);
  };

  const productsList = productsData?.products || [];
  const pagination = productsData?.pagination || {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 12,
  };

  const isLoggedIn = !!userProfile;

  return (
    <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink selection:bg-vl-primary/20">
      {/* Shared Platform Header */}
      <HomeHeader
        userProfile={userProfile}
        cartCount={initialCartCount}
        sellerHref={sellerHref}
      />

      {/* Main content block */}
      <main className="vl-section-shell flex w-full flex-1 flex-col py-8 sm:py-10 lg:py-12">
        {/* Results Toolbar */}
        <SearchToolbar
          query={filters.q}
          category={filters.category}
          totalProducts={pagination.totalItems}
          searchTime={searchTime}
          sort={filters.sort || "popularity"}
          onSortChange={(val) => updateUrl({ sort: val })}
          breadcrumbs={
            filters.category && filters.category !== "All"
              ? ["Home", "Products", filters.category]
              : ["Home", "Products"]
          }
        />

        {/* Category Pills Strip */}
        <CategoryChips
          categories={categories}
          activeCategory={filters.category || "All"}
          onCategoryChange={(val) => updateUrl({ category: val })}
        />

        {/* Layout Row */}
        <div className="flex flex-1 items-start gap-8">
          {/* Sidebar */}
          <FiltersSidebar
            priceRange={filters.priceRange}
            onPriceRangeChange={(val) =>
              updateUrl({ priceRange: val ? `${val[0]}-${val[1]}` : null })
            }
            rating={filters.rating}
            onRatingChange={(val) => updateUrl({ rating: val })}
            discount={filters.discount}
            onDiscountChange={(val) => updateUrl({ discount: val })}
            onClearAll={handleClearAll}
          />

          {/* Grid View */}
          <div className="flex-1 flex flex-col h-full justify-between">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-5 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <ProductCardSkeleton key={idx} />
                ))}
              </div>
            ) : (
              <>
                <ProductGrid
                  products={productsList}
                  isLoggedIn={isLoggedIn}
                  onWishlistToggle={handleWishlistToggle}
                />
                
                {/* Pagination */}
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(val) => updateUrl({ page: val })}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Toast alert */}
      {alertMsg && (
        <div className="fixed inset-x-4 bottom-24 z-50 animate-fade-in-up sm:inset-x-auto sm:bottom-6 sm:right-6">
          <div
            role="status"
            className={`flex items-center gap-3 rounded-vl-control border px-4 py-3 text-sm font-semibold shadow-vl-floating ${
              alertMsg.type === "success"
                ? "border-vl-success/25 bg-vl-success/10 text-emerald-900"
                : "border-vl-danger/25 bg-vl-danger/10 text-red-900"
            }`}
          >
            {alertMsg.type === "success" ? <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0" /> : <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />}
            <span>{alertMsg.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
