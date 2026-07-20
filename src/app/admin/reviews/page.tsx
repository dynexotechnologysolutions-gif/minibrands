"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  Search,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export default function ReviewsModerationPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch(`/api/admin/reviews?search=${encodeURIComponent(searchQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch reviews:", err);
        setIsLoading(false);
      });
  }, [searchQuery]);

  const handleAction = async (reviewId: string, action: "HIDE" | "RESTORE" | "DELETE") => {
    if (action === "DELETE") {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } else {
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, isVisible: action === "RESTORE" } : r))
      );
    }

    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, action, reason: `Admin moderation: ${action}` }),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border-gray/70">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
            <Star className="w-4 h-4" />
            <span>Reputation & Content Integrity</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">
            Customer Reviews Moderation
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Moderate product reviews, filter abusive or inappropriate content, toggle visibility, and delete spam.
          </p>
        </div>
      </div>

      <div className="relative w-full">
        <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search review comments, product name, seller business..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border-gray/70 text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
        />
      </div>

      <div className="bg-surface rounded-3xl border border-border-gray/70 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-text-muted text-xs font-medium">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
            <span>Loading reviews moderation...</span>
          </div>
        ) : (
          <div className="divide-y divide-border-gray/40">
            {reviews.map((r) => (
              <div key={r.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= r.rating ? "fill-accent-yellow text-accent-yellow" : "text-border-gray"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-xs text-on-surface">{r.productName}</span>
                    <span className="text-[11px] text-text-muted">by {r.buyerName}</span>
                  </div>
                  <p className="text-xs text-text-muted italic">&quot;{r.comment || "No text provided."}&quot;</p>
                  <p className="text-[10px] text-text-muted">Seller: {r.sellerName}</p>
                </div>

                <div className="flex items-center gap-2">
                  {r.isVisible ? (
                    <button
                      onClick={() => handleAction(r.id, "HIDE")}
                      className="px-3 py-1.5 rounded-lg bg-surface-container text-text-muted text-xs font-bold hover:bg-surface-container-high flex items-center gap-1"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(r.id, "RESTORE")}
                      className="px-3 py-1.5 rounded-lg bg-success-green/10 text-success-green border border-success-green/20 text-xs font-bold hover:bg-success-green hover:text-white flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleAction(r.id, "DELETE")}
                    className="px-3 py-1.5 rounded-lg bg-error-red/10 text-error-red border border-error-red/20 text-xs font-bold hover:bg-error-red hover:text-white flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
