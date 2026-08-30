"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, SearchX } from "lucide-react";
import StoreSection from "./StoreSection";
import StoreCard, { StoreSummary } from "./StoreCard";
import StoreDiscoveryHero from "./StoreDiscoveryHero";
import StoreEditorialEdit from "./StoreEditorialEdit";
import { followSellerAction, unfollowSellerAction } from "@/actions/seller-follow.action";

type SortOption = "topRated" | "popular" | "newest" | "name";

const SORT_OPTIONS: SortOption[] = ["topRated", "popular", "newest", "name"];

const SORT_LABELS: Record<SortOption, string> = {
  topRated: "Top Rated",
  popular: "Most Popular",
  newest: "Newest",
  name: "Name (A–Z)",
};

interface StoresPageClientProps {
  stores: StoreSummary[];
  isLoggedIn: boolean;
  initialFollowedIds: string[];
}

export default function StoresPageClient({ stores, isLoggedIn, initialFollowedIds }: StoresPageClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("topRated");
  const [followedIds, setFollowedIds] = useState<Set<string>>(() => new Set(initialFollowedIds));
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categories = useMemo(
    () => [...new Set(stores.map((s) => s.category))].sort((a, b) => a.localeCompare(b)),
    [stores],
  );

  const scrollToAllBrands = () => {
    document.getElementById("all-brands")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setSearchQuery(value.trim()), 300);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    scrollToAllBrands();
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setActiveCategory("all");
    setSortBy("topRated");
  };

  const handleToggleFollow = async (storeId: string) => {
    if (!isLoggedIn) {
      router.push(`/login?redirectTo=${encodeURIComponent("/stores")}`);
      return;
    }

    const willFollow = !followedIds.has(storeId);
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (willFollow) next.add(storeId);
      else next.delete(storeId);
      return next;
    });

    try {
      const res = willFollow
        ? await followSellerAction(storeId)
        : await unfollowSellerAction(storeId);
      if (!res.success) throw new Error(res.error || "Failed to update follow");
    } catch (error) {
      console.error("Follow toggle error:", error);
      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (willFollow) next.delete(storeId);
        else next.add(storeId);
        return next;
      });
      alert("Failed to update follow. Please try again.");
    }
  };


  const trendingStores = useMemo(
    () =>
      [...stores]
        .sort((a, b) => b.productCount - a.productCount || b.reviewCount - a.reviewCount || b.rating - a.rating)
        .slice(0, 8),
    [stores],
  );

  const newStores = useMemo(
    () => [...stores].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    [stores],
  );

  const editCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of stores) {
      if (!s.category) continue;
      counts.set(s.category, (counts.get(s.category) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 4)
      .map(([name, count]) => ({ name, count }));
  }, [stores]);

  const allBrandsStores = useMemo(() => {
    let list = stores;
    if (activeCategory !== "all") {
      list = list.filter((s) => s.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    switch (sortBy) {
      case "popular":
        sorted.sort((a, b) => b.productCount - a.productCount || b.reviewCount - a.reviewCount);
        break;
      case "newest":
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount || b.productCount - a.productCount);
        break;
    }
    return sorted;
  }, [stores, activeCategory, searchQuery, sortBy]);

  const hasFilters = searchQuery !== "" || activeCategory !== "all";

  return (
    <>
      <StoreDiscoveryHero
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />


      <StoreSection
        id="trending-labels"
        title="Trending Labels"
        description="Brands shoppers are discovering."
        href="#all-brands"
        stores={trendingStores}
        followedIds={followedIds}
        onToggleFollow={handleToggleFollow}
      />

      <StoreSection
        id="new-labels"
        title="New Labels"
        description="Fresh brands joining MiniBrands."
        href="#all-brands"
        badge="NEW"
        stores={newStores}
        followedIds={followedIds}
        onToggleFollow={handleToggleFollow}
      />

      <StoreEditorialEdit categories={editCategories} onSelect={handleCategoryChange} />

      <section id="all-brands" className="mt-8 scroll-mt-24 sm:mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-vl-heading text-xl font-bold tracking-[-0.03em] text-vl-ink sm:text-2xl">All Brands</h2>
            <p className="mt-1 text-sm text-vl-muted">
              {searchQuery
                ? `${allBrandsStores.length} result${allBrandsStores.length === 1 ? "" : "s"} for “${searchQuery}”`
                : activeCategory !== "all"
                  ? `${allBrandsStores.length} verified ${activeCategory} brand${allBrandsStores.length === 1 ? "" : "s"}`
                  : `${allBrandsStores.length} verified brand${allBrandsStores.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-vl-primary hover:underline"
              >
                Clear
              </button>
            ) : null}
            <div className="relative">
              <ArrowUpDown
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vl-muted"
              />
              <label htmlFor="store-sort" className="sr-only">
                Sort brands
              </label>
              <select
                id="store-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-11 w-full appearance-none rounded-vl-control border border-vl-border bg-white pl-9 pr-8 text-sm font-semibold text-vl-ink outline-none transition-colors duration-200 focus:border-vl-primary"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {SORT_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {hasFilters && (
          <p className="mt-3 text-xs text-vl-muted">
            {searchQuery && <>Searching for “{searchQuery}”</>}
            {searchQuery && activeCategory !== "all" && <> · </>}
            {activeCategory !== "all" && <>{activeCategory}</>}
            <span className="ml-2 font-semibold text-vl-primary">→ filtered via Discover</span>
          </p>
        )}

        {allBrandsStores.length === 0 ? (
          <div className="mt-5 rounded-vl-card border border-dashed border-vl-border bg-vl-card p-10 text-center">
            <SearchX aria-hidden="true" className="mx-auto h-10 w-10 text-vl-muted" />
            <p className="mt-3 text-sm font-semibold text-vl-ink">No brands found</p>
            <p className="mt-1 text-xs text-vl-muted">Try another search or explore a different category.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-5 text-sm font-bold text-white transition-all duration-150 hover:bg-vl-primary/90 active:scale-[0.98]"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {allBrandsStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                isFollowed={followedIds.has(store.id)}
                onToggleFollow={handleToggleFollow}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}