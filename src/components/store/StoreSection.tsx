import React from "react";
import Link from "next/link";
import StoreCard, { StoreSummary } from "./StoreCard";

interface StoreSectionProps {
  id?: string;
  title: string;
  description?: string;
  href?: string;
  stores: StoreSummary[];
  followedIds: Set<string>;
  favoriteIds: Set<string>;
  onToggleFollow: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  badge?: "NEW" | null;
  emptyState?: React.ReactNode;
}

export default function StoreSection({
  id,
  title,
  description,
  href,
  stores,
  followedIds,
  favoriteIds,
  onToggleFollow,
  onToggleFavorite,
  badge = null,
  emptyState,
}: StoreSectionProps) {
  if (stores.length === 0 && !emptyState) return null;

  return (
    <section id={id} className="mt-8 sm:mt-12">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-vl-heading text-xl font-bold tracking-[-0.03em] text-vl-ink sm:text-2xl">{title}</h2>
          {description ? <p className="mt-1 text-sm text-vl-muted">{description}</p> : null}
        </div>
        {href && stores.length > 0 ? (
          <Link href={href} className="shrink-0 text-sm font-semibold text-vl-primary hover:underline">
            View All →
          </Link>
        ) : null}
      </div>

      {stores.length === 0 ? (
        emptyState
      ) : (
        <div className="-mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-2 hide-scrollbar md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3 xl:grid-cols-4">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              badge={badge}
              isFollowed={followedIds.has(store.id)}
              onToggleFollow={onToggleFollow}
              isFavorite={favoriteIds.has(store.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </section>
  );
}