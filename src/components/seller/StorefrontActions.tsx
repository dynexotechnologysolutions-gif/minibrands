"use client";

import React from "react";
import { Heart, Share2, Check } from "lucide-react";

interface StorefrontActionsProps {
  isFollowing: boolean;
  onToggleFollow: () => void;
  copiedLink: boolean;
  onCopyLink: () => void;
}

export default function StorefrontActions({
  isFollowing,
  onToggleFollow,
  copiedLink,
  onCopyLink,
}: StorefrontActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onToggleFollow}
        aria-pressed={isFollowing}
        aria-label={isFollowing ? "Unfollow store" : "Follow store"}
        className={`flex-1 sm:flex-none inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-vl-control px-6 text-sm font-bold transition-all cursor-pointer active:scale-[0.98] ${
          isFollowing
            ? "bg-vl-card border border-vl-border text-vl-ink hover:bg-vl-surface"
            : "bg-vl-primary text-white hover:bg-vl-primary/90 shadow-sm"
        }`}
      >
        <Heart className={`h-4 w-4 ${isFollowing ? "fill-vl-primary text-vl-primary" : "fill-white/20"}`} />
        <span>{isFollowing ? "Following" : "Follow Store"}</span>
      </button>

      <button
        onClick={onCopyLink}
        aria-label={copiedLink ? "Link copied" : "Share store"}
        className="inline-flex h-11 min-h-[44px] w-11 sm:w-auto sm:px-6 items-center justify-center gap-2 rounded-vl-control border border-vl-border bg-vl-card text-vl-ink font-bold text-sm hover:bg-vl-surface transition-all cursor-pointer active:scale-[0.98] shrink-0"
      >
        {copiedLink ? (
          <>
            <Check className="h-4 w-4 text-vl-success" />
            <span className="hidden sm:inline text-vl-success">Copied</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4 text-vl-secondary" />
            <span className="hidden sm:inline">Share</span>
            <span className="sm:hidden" aria-hidden="true">
              <Share2 className="h-4 w-4" />
            </span>
          </>
        )}
      </button>
      {copiedLink && (
        <span role="status" aria-live="polite" className="sr-only">
          Store link copied to clipboard
        </span>
      )}
    </div>
  );
}
