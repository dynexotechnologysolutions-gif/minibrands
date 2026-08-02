"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import HomeHeader from "@/components/home/HomeHeader";
import SearchToolbar from "../components/SearchToolbar";
import CategoryChips from "../components/CategoryChips";
import FiltersSidebar from "../components/FiltersSidebar";
import FilterDrawer from "../components/FilterDrawer";
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
    {/* Aspect ratio wrapper for zero CLS with shimmer */}
    <div className="relative aspect-[3/4] overflow-hidden bg-vl-surface">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-vl-border via-[#F5F5F8] to-vl-border bg-[length:200%_100%]" />
    </div>
    <div className="flex flex-col gap-2.5 p-3">
      <div className="h-3 w-1/4 rounded-md animate-pulse bg-gradient-to-r from-vl-border via-[#F5F5F8] to-vl-border bg-[length:200%_100%]" />
      <div className="h-4 w-3/4 rounded-md animate-pulse bg-gradient-to-r from-vl-border via-[#F5F5F8] to-vl-border bg-[length:200%_100%]" />
      <div className="h-3 w-2/4 rounded-md animate-pulse bg-gradient-to-r from-vl-border via-[#F5F5F8] to-vl-border bg-[length:200%_100%]" />
      <div className="mt-1 h-3.5 w-1/3 rounded-md animate-pulse bg-gradient-to-r from-vl-border via-[#F5F5F8] to-vl-border bg-[length:200%_100%]" />
    </div>
  </div>
);

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

  // State to control mobile filter drawer
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

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
  const startTimeRef = useRef<number>(0);
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);
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

      {/* Main content block */}
      <main className="vl-section-shell flex w-full flex-1 flex-col py-6 sm:py-8 lg:py-10">
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
        <div ref={gridTopRef} className="flex flex-1 items-start gap-8 scroll-mt-24">
          {/* Desktop Filter Sidebar */}
          <FiltersSidebar {...sidebarAndDrawerProps} />

          {/* Grid View */}
          <div className="flex-1 flex flex-col h-full justify-between">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-5 xl:grid-cols-4">
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

      {/* Floating Filter Button (Mobile & Tablet only) */}
      <div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 lg:hidden">
        <button
          type="button"
          onClick={() => setIsFilterDrawerOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-vl-ink px-6 text-sm font-bold text-white shadow-vl-floating transition-all duration-vl-fast hover:scale-105 active:scale-95"
        >
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-vl-accent" />
          Filters
          {[filters.priceRange, filters.rating, filters.discount].filter(Boolean).length > 0 && (
            <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-vl-primary text-[10px] font-bold text-white">
              {[filters.priceRange, filters.rating, filters.discount].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        {...sidebarAndDrawerProps}
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
