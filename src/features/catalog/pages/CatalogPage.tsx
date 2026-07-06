"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HomeHeader from "@/components/home/HomeHeader";
import Footer from "@/components/Footer";
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
  <div className="flex flex-col bg-surface-container-lowest border border-border-gray rounded-sm overflow-hidden animate-pulse">
    <div className="aspect-[3/4] bg-surface-container" />
    <div className="px-[10px] pt-[10px] pb-[12px] flex flex-col gap-[6px]">
      <div className="h-[10px] bg-surface-container rounded-full w-1/3" />
      <div className="h-[13px] bg-surface-container rounded w-3/4" />
      <div className="h-[13px] bg-surface-container rounded w-1/2" />
      <div className="h-[10px] bg-surface-container rounded-full w-1/4 mt-[2px]" />
      <div className="h-[15px] bg-surface-container rounded w-2/5 mt-[2px]" />
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
    let title = "Products | MINIBRANDS";
    if (q) {
      title = `Search Results for "${q}" | MINIBRANDS`;
    } else if (category && category !== "All") {
      title = `${category} Products | MINIBRANDS`;
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
    <div className="bg-background text-on-surface font-body-md selection:bg-accent-yellow/30 min-h-screen flex flex-col w-full">
      {/* Shared Platform Header */}
      <HomeHeader
        userProfile={userProfile}
        cartCount={initialCartCount}
        sellerHref={sellerHref}
      />

      {/* Main content block */}
      <main className="max-w-[1440px] mx-auto px-base lg:px-xl py-base flex-1 flex flex-col w-full">
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
        <div className="flex gap-xl items-start flex-1">
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
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-base lg:gap-lg">
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

      {/* Shared Platform Footer */}
      <Footer />

      {/* Toast alert */}
      {alertMsg && (
        <div className="fixed bottom-base right-base z-50 animate-fade-in-up">
          <div
            className={`p-base border rounded shadow-lg flex items-center gap-sm font-label-bold text-label-bold ${
              alertMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <span className="material-symbols-outlined select-none">
              {alertMsg.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{alertMsg.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
