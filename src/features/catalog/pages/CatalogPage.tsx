"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import HomeHeader from "@/components/home/HomeHeader";
import CategoryHeader from "../components/CategoryHeader";
import CategoryChips from "../components/CategoryChips";
import ProductToolbar from "../components/ProductToolbar";
import FiltersSidebar from "../components/FiltersSidebar";
import FilterDrawer from "../components/FilterDrawer";
import SortSheet from "../components/SortSheet";
import ProductGrid from "../components/ProductGrid";
import Pagination from "../components/Pagination";

import { useCategories } from "../hooks/useCategories";
import { useProducts } from "../hooks/useProducts";
import { useWishlist } from "../hooks/useWishlist";

interface CatalogPageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userProfile?: any;
  initialCartCount: number;
  sellerHref: string;
}

const ProductCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-vl-card border border-vl-border bg-vl-card">
    {/* 1:1 image skeleton matching the redesigned card */}
    <div className="relative aspect-square overflow-hidden bg-vl-surface">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-vl-border via-[#F5F5F8] to-vl-border bg-[length:200%_100%]" />
    </div>
    <div className="flex flex-col gap-2 p-3">
      <div className="h-3 w-1/4 rounded-md animate-pulse bg-gradient-to-r from-vl-border via-[#F5F5F8] to-vl-border bg-[length:200%_100%]" />
      <div className="h-4 w-3/4 rounded-md animate-pulse bg-gradient-to-r from-vl-border via-[#F5F5F8] to-vl-border bg-[length:200%_100%]" />
      <div className="h-3 w-2/4 rounded-md animate-pulse bg-gradient-to-r from-vl-border via-[#F5F5F8] to-vl-border bg-[length:200%_100%]" />
      <div className="mt-1 h-9 w-full rounded-md animate-pulse bg-gradient-to-r from-vl-border via-[#F5F5F8] to-vl-border bg-[length:200%_100%]" />
    </div>
  </div>
);

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex w-full flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-vl-card text-vl-danger">
        <AlertCircle aria-hidden="true" className="h-9 w-9" />
      </div>
      <h2 className="font-vl-heading mb-2 text-xl font-bold tracking-tight text-vl-ink">
        Unable to load products
      </h2>
      <p className="mx-auto mb-6 max-w-[320px] text-sm leading-relaxed text-vl-muted">
        Something went wrong while loading this category.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-vl-control bg-vl-primary px-6 text-sm font-semibold text-white transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98]"
      >
        <RotateCcw aria-hidden="true" className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}

export default function CatalogPage({ userProfile, initialCartCount, sellerHref }: CatalogPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gridTopRef = useRef<HTMLDivElement>(null);

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

  const activeFiltersCount = [priceRange, rating, discount].filter(Boolean).length;

  // State to control mobile filter drawer + sort sheet
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);

  // Listen for the 'open-filter-drawer' event (legacy trigger path)
  useEffect(() => {
    const handler = () => setIsFilterDrawerOpen(true);
    window.addEventListener("open-filter-drawer", handler);
    return () => window.removeEventListener("open-filter-drawer", handler);
  }, []);

  // 2. Dynamic SEO browser titles
  useEffect(() => {
    let title = "Products | MiniBrands";
    if (q) {
      title = `Search Results for "${q}" | MiniBrands`;
    } else if (category && category !== "All") {
      title = `${category} Products | MiniBrands`;
    }
    document.title = title;
  }, [q, category]);

  // 3. React Query hooks
  const { data: categories = [] } = useCategories();
  const { data: productsData, isLoading, isError, refetch } = useProducts(filters);
  const { toggleWishlist } = useWishlist();

  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setAlertMsg({ text, type });
  };

  useEffect(() => {
    if (alertMsg) {
      const t = setTimeout(() => setAlertMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [alertMsg]);

  // 4. Update dynamic parameters in the URL
  const updateUrl = (updated: Record<string, unknown>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset page to 1 on filter changes unless page is explicitly updated
    if (!("page" in updated)) {
      params.set("page", "1");
    } else {
      // Scroll smoothly to top of grid only when page is explicitly updated
      gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update wishlist.";
      triggerToast(msg, "error");
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

  const sidebarAndDrawerProps = {
    priceRange: filters.priceRange,
    onPriceRangeChange: (val: [number, number] | undefined) =>
      updateUrl({ priceRange: val ? `${val[0]}-${val[1]}` : null }),
    rating: filters.rating,
    onRatingChange: (val: number | undefined) => updateUrl({ rating: val }),
    discount: filters.discount,
    onDiscountChange: (val: number | undefined) => updateUrl({ discount: val }),
    onClearAll: handleClearAll,
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink selection:bg-vl-primary/20">
      {/* Shared Platform Header */}
      <HomeHeader
        userProfile={userProfile}
        cartCount={initialCartCount}
        sellerHref={sellerHref}
      />

      {/* Main content block — mobile top offset clears the fixed MobileSearchHeader */}
      <main className="vl-section-shell flex w-full flex-1 flex-col pt-[calc(4.5rem+env(safe-area-inset-top))] pb-6 sm:pt-8 sm:pb-8 lg:py-10">
        {/* Category Header (breadcrumb + title + description + count) */}
        <CategoryHeader
          category={filters.category}
          query={filters.q}
          totalProducts={pagination.totalItems}
        />

        {/* Subcategory Navigation */}
        <CategoryChips
          categories={categories}
          activeCategory={filters.category || "All"}
          onCategoryChange={(val) => updateUrl({ category: val })}
        />

        {/* Product Toolbar — count + filter + sort */}
        <ProductToolbar
          totalProducts={pagination.totalItems}
          activeSort={filters.sort || "popularity"}
          activeFiltersCount={activeFiltersCount}
          onSortChange={(val) => updateUrl({ sort: val })}
          onOpenFilters={() => setIsFilterDrawerOpen(true)}
          onOpenSort={() => setIsSortSheetOpen(true)}
        />

        {/* Layout Row */}
        <div ref={gridTopRef} className="mt-5 flex flex-1 items-start gap-8 scroll-mt-24">
          {/* Desktop Filter Sidebar */}
          <FiltersSidebar {...sidebarAndDrawerProps} />

          {/* Grid View */}
          <div className="flex flex-1 flex-col justify-between h-full">
            {isError ? (
              <ErrorState onRetry={() => refetch()} />
            ) : isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
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
                  onClearFilters={handleClearAll}
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

      {/* Mobile Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        {...sidebarAndDrawerProps}
      />

      {/* Mobile Sort Sheet */}
      <SortSheet
        isOpen={isSortSheetOpen}
        onClose={() => setIsSortSheetOpen(false)}
        activeSort={filters.sort || "popularity"}
        onSortChange={(val) => updateUrl({ sort: val })}
      />

      {/* Toast alert */}
      {alertMsg && (
        <div className="fixed inset-x-4 bottom-24 z-50 animate-fade-in-up sm:inset-x-auto sm:bottom-6 sm:right-6">
          <div
            role="status"
            className={`flex items-center gap-3 rounded-vl-control border px-4 py-3 text-sm font-semibold shadow-vl-floating ${
              alertMsg.type === "success"
                ? "border-vl-success/25 bg-vl-success/10 text-emerald-950"
                : "border-vl-danger/25 bg-vl-danger/10 text-red-950"
            }`}
          >
            {alertMsg.type === "success" ? (
              <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-vl-success" />
            ) : (
              <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0 text-vl-danger" />
            )}
            <span>{alertMsg.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}