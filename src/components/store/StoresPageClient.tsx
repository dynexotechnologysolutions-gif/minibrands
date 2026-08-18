"use client";

import React, { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Heart, SearchX } from "lucide-react";
import StoreSearch from "./StoreSearch";
import StoreCategoryFilter from "./StoreCategoryFilter";
import StoreSection from "./StoreSection";
import StoreCard, { StoreSummary } from "./StoreCard";
import { followSellerAction, unfollowSellerAction } from "@/actions/seller-follow.action";

const RECENT_KEY = "minibrands_recent_stores";

type SortOption = "topRated" | "popular" | "newest" | "name";

const SORT_OPTIONS: SortOption[] = ["topRated", "popular", "newest", "name"];

const SORT_LABELS: Record<SortOption, string> = {
  topRated: "Top Rated",
  popular: "Most Popular",
  newest: "Newest",
  name: "Name (A–Z)",
};

let cachedRecentIds: string[] = [];

function readRecentIds(): string[] {
  if (typeof window === "undefined") return cachedRecentIds;
  let next: string[];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) {
      next = [];
    } else {
      const parsed = JSON.parse(raw);
      next = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    }
  } catch {
    return cachedRecentIds;
  }
  if (next.length !== cachedRecentIds.length || next.some((x, i) => x !== cachedRecentIds[i])) {
    cachedRecentIds = next;
  }
  return cachedRecentIds;
}

function subscribeRecent(callback: () => void) {
  const onStorage = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener("recent-stores-updated", onStorage);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("recent-stores-updated", onStorage);
  };
}

interface StoresPageClientProps {
  stores: StoreSummary[];
  isLoggedIn: boolean;
  initialFollowedIds: string[];
}

function FollowedEmptyState({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="rounded-vl-card border border-dashed border-vl-border bg-vl-card p-10 text-center">
      <Heart aria-hidden="true" className="mx-auto h-10 w-10 text-vl-muted" />
      <p className="mt-3 text-sm font-semibold text-vl-ink">Discover stores you&apos;ll love</p>
      <p className="mt-1 text-xs text-vl-muted">Follow your favorite stores to easily find them here later.</p>
      <button
        type="button"
        onClick={onExplore}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-5 text-sm font-bold text-white transition-all duration-150 hover:bg-vl-primary/90 active:scale-[0.98]"
      >
        Explore Stores
      </button>
    </div>
  );
}

export default function StoresPageClient({ stores, isLoggedIn, initialFollowedIds }: StoresPageClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("topRated");
  const [followedIds, setFollowedIds] = useState<Set<string>>(() => new Set(initialFollowedIds));
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recentIds = useSyncExternalStore(subscribeRecent, readRecentIds, () => cachedRecentIds);

  const recordRecent = (id: string) => {
    const next = [id, ...readRecentIds().filter((x) => x !== id)].slice(0, 8);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      return;
    }
    window.dispatchEvent(new Event("recent-stores-updated"));
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setSearchQuery(value.trim()), 300);
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

  const categories = useMemo(
    () => [...new Set(stores.map((s) => s.category))].sort((a, b) => a.localeCompare(b)),
    [stores],
  );

  const discoverStores = useMemo(() => {
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

  const popularStores = useMemo(
    () =>
      [...stores]
        .sort((a, b) => b.productCount - a.productCount || b.reviewCount - a.reviewCount || b.rating - a.rating)
        .slice(0, 8),
    [stores],
  );

  const followedStores = useMemo(() => stores.filter((s) => followedIds.has(s.id)), [stores, followedIds]);

  const recentStores = useMemo(
    () =>
      recentIds
        .map((id) => stores.find((s) => s.id === id))
        .filter((s): s is StoreSummary => Boolean(s)),
    [recentIds, stores],
  );

  const hasFilters = searchQuery !== "" || activeCategory !== "all";

  return (
    <>
      <div className="mt-6 sm:mt-8">
        <StoreSearch value={searchInput} onChange={handleSearchChange} />
      </div>

      <div className="mt-4">
        <StoreCategoryFilter categories={categories} active={activeCategory} onChange={setActiveCategory} />
      </div>

      <StoreSection
        id="followed-stores"
        title="Your Followed Stores"
        description="Keep up with the stores you love."
        stores={followedStores}
        followedIds={followedIds}
        onToggleFollow={handleToggleFollow}
        onVisit={recordRecent}
        emptyState={
          <FollowedEmptyState
            onExplore={() => document.getElementById("discover-stores")?.scrollIntoView({ behavior: "smooth" })}
          />
        }
      />

      <section id="discover-stores" className="mt-8 scroll-mt-24 sm:mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-vl-heading text-xl font-bold tracking-[-0.03em] text-vl-ink sm:text-2xl">
              Discover Stores
            </h2>
            <p className="mt-1 text-sm text-vl-muted">
              {searchQuery
                ? `${discoverStores.length} result${discoverStores.length === 1 ? "" : "s"} for “${searchQuery}”`
                : activeCategory !== "all"
                  ? `${discoverStores.length} verified ${activeCategory} store${discoverStores.length === 1 ? "" : "s"}`
                  : `${discoverStores.length} verified store${discoverStores.length === 1 ? "" : "s"}`}
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
                Sort stores
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

        {discoverStores.length === 0 ? (
          <div className="mt-5 rounded-vl-card border border-dashed border-vl-border bg-vl-card p-10 text-center">
            <SearchX aria-hidden="true" className="mx-auto h-10 w-10 text-vl-muted" />
            <p className="mt-3 text-sm font-semibold text-vl-ink">No stores found</p>
            <p className="mt-1 text-xs text-vl-muted">Try a different search or category.</p>
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
            {discoverStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                isFollowed={followedIds.has(store.id)}
                onToggleFollow={handleToggleFollow}
                onVisit={recordRecent}
              />
            ))}
          </div>
        )}
      </section>

      <StoreSection
        title="Popular Stores"
        description="Most-loved stores by shoppers."
        stores={popularStores}
        followedIds={followedIds}
        onToggleFollow={handleToggleFollow}
        onVisit={recordRecent}
      />

      {recentStores.length > 0 ? (
        <StoreSection
          title="Recently Viewed Stores"
          description="Pick up where you left off."
          stores={recentStores}
          followedIds={followedIds}
          onToggleFollow={handleToggleFollow}
          onVisit={recordRecent}
          compact={true}
        />
      ) : null}
    </>
  );
}