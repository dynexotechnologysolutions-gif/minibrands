"use client";

import React, { useState } from "react";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string | null;
    photoUrls: string[];
    createdAt: string;
    buyer: {
      user: {
        name: string | null;
      };
    };
  };
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const getRatingColorClass = (rating: number) => {
    if (rating >= 4) return "bg-success-green";
    if (rating === 3) return "bg-accent-yellow";
    return "bg-error-red";
  };

  // Derive a review title from first sentence of comment or fallback
  const firstSentence = review.comment
    ? (review.comment.split(/[.,!?\n]/)[0]?.trim() || "")
    : "";
  const title = firstSentence.length > 0
    ? (firstSentence.length > 40 ? firstSentence.slice(0, 37) + "..." : firstSentence)
    : "Verified Purchase";

  return (
    <>
      <div className="border-b border-border-gray pb-lg last:border-0 last:pb-0 space-y-xs">
        {/* Rating Star Badge & Title */}
        <div className="flex items-center gap-md mb-xs">
          <span className={`text-on-primary px-sm py-0.5 rounded text-[10px] font-bold shrink-0 ${getRatingColorClass(review.rating)}`}>
            {review.rating} ★
          </span>
          <span className="font-label-bold text-label-bold text-on-surface">
            {title}
          </span>
        </div>

        {/* Comment Body */}
        {review.comment && (
          <p className="text-body-md font-body-md text-on-surface mb-sm leading-relaxed">
            {review.comment}
          </p>
        )}

        {/* Photo Thumbnails */}
        {review.photoUrls.length > 0 && (
          <div className="flex gap-sm flex-wrap pt-xs">
            {review.photoUrls.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setLightboxUrl(url)}
                className="w-16 h-16 rounded border border-border-gray overflow-hidden hover:opacity-80 transition-opacity cursor-pointer shrink-0"
              >
                <img
                  src={url}
                  alt={`Review photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Reviewer Details & Metadata */}
        <div className="flex items-center gap-sm text-body-sm font-body-sm text-text-muted mt-sm pt-xs">
          <span className="font-bold text-on-surface">
            {review.buyer.user.name || "Anonymous"}
          </span>
          <span className="">
            • Verified Purchase • {relativeTime(review.createdAt)}
          </span>
        </div>
      </div>

      {/* Lightbox for fullscreen image view */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-base"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxUrl}
              alt="Review photo fullscreen"
              className="w-full h-auto rounded shadow-xl"
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-sm right-sm bg-white text-primary rounded-full w-8 h-8 flex items-center justify-center shadow cursor-pointer"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
