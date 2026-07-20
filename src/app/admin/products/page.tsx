"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  Star,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function ProductsModerationPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/products?filter=${filterTab}&search=${encodeURIComponent(searchQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
        setIsLoading(false);
      });
  }, [filterTab, searchQuery]);

  const handleApprove = async (productId: string, productName: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isPublished: true } : p))
    );

    const res = await fetch(`/api/admin/products/${productId}/approve`, { method: "PATCH" });
    if (res.ok) {
      setToastMessage(`Product "${productName}" published.`);
    }
  };

  const handleReject = async (productId: string, productName: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isPublished: false } : p))
    );

    const res = await fetch(`/api/admin/products/${productId}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Unpublished by admin moderation." }),
    });
    if (res.ok) {
      setToastMessage(`Product "${productName}" unpublished.`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-success-green/10 text-success-green border border-success-green/30 text-xs font-bold flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border-gray/70">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
            <Package className="w-4 h-4" />
            <span>Catalog Governance</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">
            Product Moderation & Quality Queue
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Approve catalog entries, enforce quality guidelines, toggle visibility, and moderate AI descriptions.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product title, category, merchant name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border-gray/70 text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["ALL", "PUBLISHED", "UNPUBLISHED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                filterTab === tab
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-surface text-text-muted border-border-gray/70 hover:bg-surface-container-low"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-text-muted text-xs font-medium bg-surface rounded-3xl border border-border-gray/70">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
          <span>Loading catalog moderation queue...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center text-text-muted text-xs font-medium bg-surface rounded-3xl border border-border-gray/70">
          No products found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-surface rounded-3xl border border-border-gray/70 p-5 space-y-4 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-surface-container-low text-text-muted">
                      {p.category}
                    </span>
                    <h3 className="font-bold text-sm text-on-surface mt-1 leading-snug">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-text-muted">Merchant: {p.sellerName}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border flex-shrink-0 ${
                      p.isPublished
                        ? "bg-success-green/10 text-success-green border-success-green/30"
                        : "bg-error-red/10 text-error-red border-error-red/30"
                    }`}
                  >
                    {p.isPublished ? "PUBLISHED" : "UNPUBLISHED"}
                  </span>
                </div>

                <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                  {p.shortDescription}
                </p>

                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-border-gray/40">
                  <span className="text-on-surface">₹{p.price.toLocaleString("en-IN")}</span>
                  <span className="text-text-muted">Stock: {p.stockCount} units</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-border-gray/40">
                {p.isPublished ? (
                  <button
                    onClick={() => handleReject(p.id, p.name)}
                    className="flex-1 py-2 rounded-xl bg-error-red/10 text-error-red border border-error-red/20 text-xs font-bold hover:bg-error-red hover:text-white transition-colors flex items-center justify-center gap-1"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Unpublish</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleApprove(p.id, p.name)}
                    className="flex-1 py-2 rounded-xl bg-success-green text-white text-xs font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-1 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Publish</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
