import React from "react";
import Link from "next/link";
import { MapPin, TrendingUp, Sparkles } from "lucide-react";
import StoreCard, { StoreSummary } from "./StoreCard";

interface StoreSectionProps {
  id?: string;
  title: string;
  description?: string;
  href?: string;
  seeAllLabel?: string;
  stores: StoreSummary[];
  followedIds: Set<string>;
  onToggleFollow: (id: string) => void;
  layout?: "carousel" | "grid";
  compact?: boolean;
  badge?: "NEW" | null;
  emptyState?: React.ReactNode;
}

export default function StoreSection({
  id,
  title,
  description,
  href,
  seeAllLabel = "View All",
  stores,
  followedIds,
  onToggleFollow,
  layout = "carousel",
  compact = false,
  badge = null,
  emptyState,
}: StoreSectionProps) {
  if (stores.length === 0 && !emptyState) return null;
  const toneIcon =
    id === "near-you" ? <MapPin className="h-4 w-4 text-vl-muted" aria-hidden="true" /> :
    id === "trending-labels" ? <TrendingUp className="h-4 w-4 text-vl-primary" aria-hidden="true" /> :
    id === "new-labels" ? <Sparkles className="h-4 w-4 text-vl-accent" aria-hidden="true" /> : null;
  const titleTone = id === "trending-labels" ? "text-vl-ink" : "text-vl-ink";
  const descTone = id === "near-you" ? "flex items-center gap-1.5 text-sm text-vl-muted" : "mt-1 text-sm text-vl-muted";

  return (
    <section id={id} className="mt-8 sm:mt-10">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className={`flex items-center gap-2 font-vl-heading text-xl font-bold tracking-[-0.03em] sm:text-2xl ${titleTone}`}>{toneIcon}{title}</h2>
          {description ? <p className={descTone}>{description}</p> : null}
        </div>
        {href && stores.length > 0 ? (
          <Link href={href} className="shrink-0 text-sm font-semibold text-vl-primary hover:underline">
            {seeAllLabel} →
          </Link>
        ) : null}
      </div>

      {stores.length === 0 ? (
        emptyState
      ) : layout === "grid" ? (
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              isFollowed={followedIds.has(store.id)}
              onToggleFollow={onToggleFollow}
              compact={compact}
              badge={badge}
            />
          ))}
        </div>
      ) : (
        <div className="-mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 hide-scrollbar md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3 xl:grid-cols-4">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              carousel={true}
              isFollowed={followedIds.has(store.id)}
              onToggleFollow={onToggleFollow}
              compact={compact}
              badge={badge}
            />
          ))}
        </div>
      )}
    </section>
  );
}