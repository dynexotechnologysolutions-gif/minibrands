"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, Store } from "lucide-react";
import StoreFilterTabs, { StoreTab } from "./StoreFilterTabs";
import FeaturedStoresBanner from "./FeaturedStoresBanner";
import StoreSection from "./StoreSection";
import { StoreSummary } from "./StoreCard";

const VALID_TABS: StoreTab[] = ["all", "popular", "topRated", "new", "following"];

const TAB_LABELS: Record<StoreTab, string> = {
  all: "Top Stores",
  popular: "Popular Stores",
  topRated: "Top Rated Stores",
  new: "New Stores",
  following: "Stores You Follow",
};

const TAB_DESCRIPTIONS: Record<StoreTab, string> = {
  all: "Every verified store on MiniBrands, highest rated first.",
  popular: "Most-loved stores by shoppers.",
  topRated: "Highest-rated stores from real buyers.",
  new: "Fresh stores recently onboarded.",
  following: "Stores you follow. Follow more to build your feed.",
};

interface StoresPageClientProps {
  stores: StoreSummary[];
  isLoggedIn: boolean;
}

function EmptyGridState() {
  return (
    <div className="rounded-vl-card border border-dashed border-vl-border bg-vl-card p-10 text-center">
      <Store aria-hidden="true" className="mx-auto h-10 w-10 text-vl-muted" />
      <p className="mt-3 text-sm font-semibold text-vl-ink">No stores found</p>
      <p className="mt-1 text-xs text-vl-muted">Try a different filter.</p>
    </div>
  );
}

function FollowingEmptyState({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="rounded-vl-card border border-dashed border-vl-border bg-vl-card p-10 text-center">
      <Heart aria-hidden="true" className="mx-auto h-10 w-10 text-vl-muted" />
      <p className="mt-3 text-sm font-semibold text-vl-ink">Discover stores you may love.</p>
      <p className="mt-1 text-xs text-vl-muted">Follow stores to see them here.</p>
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

function SignInEmptyState() {
  return (
    <div className="rounded-vl-card border border-dashed border-vl-border bg-vl-card p-10 text-center">
      <Heart aria-hidden="true" className="mx-auto h-10 w-10 text-vl-muted" />
      <p className="mt-3 text-sm font-semibold text-vl-ink">Sign in to follow stores</p>
      <p className="mt-1 text-xs text-vl-muted">Create an account to save the stores you love and see them here.</p>
      <Link
        href="/login?role=buyer"
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-5 text-sm font-bold text-white transition-all duration-150 hover:bg-vl-primary/90"
      >
        Sign in
      </Link>
    </div>
  );
}

export default function StoresPageClient({ stores, isLoggedIn }: StoresPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const categoryParam = searchParams.get("category");

  const initialTab: StoreTab =
    tabParam && (VALID_TABS as string[]).includes(tabParam) ? (tabParam as StoreTab) : "all";
  const [activeTab, setActiveTab] = useState<StoreTab>(initialTab);

  if (tabParam && (VALID_TABS as string[]).includes(tabParam) && tabParam !== activeTab) {
    setActiveTab(tabParam as StoreTab);
  }

  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const toggleFollow = (id: string) =>
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleFavorite = (id: string) =>
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleTabChange = (tab: StoreTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "all") params.delete("tab");
    else params.set("tab", tab);
    router.replace(`/stores?${params.toString()}`, { scroll: false });
  };

  const byCategory = useMemo(
    () => (categoryParam ? stores.filter((s) => s.category.toLowerCase() === categoryParam.toLowerCase()) : stores),
    [stores, categoryParam],
  );

  const filtered = useMemo(() => {
    const list = [...byCategory];
    switch (activeTab) {
      case "popular":
        list.sort((a, b) => b.productCount - a.productCount);
        break;
      case "topRated":
        list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        break;
      case "new":
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "following":
        return byCategory.filter((s) => followedIds.has(s.id));
      default:
        list.sort((a, b) => b.rating - a.rating || b.productCount - a.productCount);
        break;
    }
    return list;
  }, [byCategory, activeTab, followedIds]);

  const newStores = useMemo(
    () => [...stores].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    [stores],
  );

  const followedStores = useMemo(() => stores.filter((s) => followedIds.has(s.id)), [stores, followedIds]);

  return (
    <>
      <StoreFilterTabs active={activeTab} onChange={handleTabChange} />
      <FeaturedStoresBanner />

      {categoryParam ? (
        <div className="mt-8 flex items-center justify-between gap-3 rounded-vl-card border border-vl-border bg-vl-card px-4 py-3">
          <p className="text-sm text-vl-ink">
            Showing <span className="font-bold">{categoryParam}</span> stores
          </p>
          <Link href="/stores" className="text-sm font-semibold text-vl-primary hover:underline">
            Clear
          </Link>
        </div>
      ) : null}

      <StoreSection
        id="store-grid"
        title={TAB_LABELS[activeTab]}
        description={TAB_DESCRIPTIONS[activeTab]}
        stores={filtered}
        followedIds={followedIds}
        favoriteIds={favoriteIds}
        onToggleFollow={toggleFollow}
        onToggleFavorite={toggleFavorite}
        emptyState={
          activeTab === "following" ? (
            <FollowingEmptyState onExplore={() => handleTabChange("all")} />
          ) : (
            <EmptyGridState />
          )
        }
      />

      <StoreSection
        title="New Stores"
        description="Just onboarded and ready to explore."
        href="/stores?tab=new"
        stores={newStores}
        badge="NEW"
        followedIds={followedIds}
        favoriteIds={favoriteIds}
        onToggleFollow={toggleFollow}
        onToggleFavorite={toggleFavorite}
      />

      {isLoggedIn ? (
        <StoreSection
          title="Stores You Follow"
          description="Keep up with your favourite sellers."
          href="/stores?tab=following"
          stores={followedStores}
          followedIds={followedIds}
          favoriteIds={favoriteIds}
          onToggleFollow={toggleFollow}
          onToggleFavorite={toggleFavorite}
          emptyState={<FollowingEmptyState onExplore={() => handleTabChange("all")} />}
        />
      ) : (
        <section className="mt-8 sm:mt-12">
          <h2 className="font-vl-heading text-xl font-bold tracking-[-0.03em] text-vl-ink sm:text-2xl">
            Stores You Follow
          </h2>
          <p className="mt-1 text-sm text-vl-muted">Sign in to follow stores and see them here.</p>
          <div className="mt-5">
            <SignInEmptyState />
          </div>
        </section>
      )}
    </>
  );
}