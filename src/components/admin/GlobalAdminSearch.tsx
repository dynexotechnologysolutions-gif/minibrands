"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Store,
  Users,
  Package,
  ShoppingBag,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface SearchResultItem {
  id: string;
  type: "seller" | "buyer" | "product" | "order" | "return" | "kyc";
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
}

interface GlobalAdminSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalAdminSearch({ isOpen, onClose }: GlobalAdminSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/dashboard?search=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.searchResults || []);
        } else {
          // Fallback mock search results if endpoint is pending full backend aggregation
          setResults([
            {
              id: "sel-1",
              type: "seller",
              title: `Seller containing "${query}"`,
              subtitle: "Active Merchant",
              href: `/admin/sellers?search=${encodeURIComponent(query)}`,
              badge: "Seller",
            },
            {
              id: "ord-1",
              type: "order",
              title: `Order matching "${query}"`,
              subtitle: "Order ID search",
              href: `/admin/orders?search=${encodeURIComponent(query)}`,
              badge: "Order",
            },
            {
              id: "prd-1",
              type: "product",
              title: `Product matching "${query}"`,
              subtitle: "Catalog product",
              href: `/admin/products?search=${encodeURIComponent(query)}`,
              badge: "Product",
            },
          ]);
        }
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const getIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "seller":
        return <Store className="w-4 h-4 text-primary" />;
      case "buyer":
        return <Users className="w-4 h-4 text-secondary" />;
      case "product":
        return <Package className="w-4 h-4 text-accent-yellow" />;
      case "order":
        return <ShoppingBag className="w-4 h-4 text-success-green" />;
      case "return":
        return <RotateCcw className="w-4 h-4 text-error-red" />;
      case "kyc":
        return <ShieldCheck className="w-4 h-4 text-primary font-bold" />;
      default:
        return <Search className="w-4 h-4 text-text-muted" />;
    }
  };

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4 animate-fade-in-up">
      <div
        className="w-full max-w-2xl bg-surface border border-border-gray/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Header */}
        <div className="p-4 border-b border-border-gray/40 flex items-center gap-3 bg-surface-container-lowest">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sellers, buyers, products, orders, returns, KYC requests... (Press Esc to close)"
            className="flex-1 bg-transparent border-none text-on-surface focus:outline-none text-sm placeholder:text-text-muted font-medium"
            autoFocus
          />
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-container-low text-text-muted hover:text-on-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {query.trim().length < 2 ? (
            <div className="p-8 text-center text-text-muted text-xs font-medium">
              Type at least 2 characters to search across the entire marketplace platform.
            </div>
          ) : results.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-text-muted text-xs font-medium">
              No direct matches found for &quot;{query}&quot;. Press enter or select a quick link below.
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.href)}
                className="w-full text-left p-3 rounded-xl flex items-center justify-between hover:bg-surface-container-low transition-all border border-transparent hover:border-border-gray/40 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-surface-container-lowest border border-border-gray/50 shadow-xs">
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <h4 className="text-body-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-text-muted font-medium">{item.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-container text-secondary">
                      {item.badge}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-surface-container-lowest border-t border-border-gray/40 flex items-center justify-between text-[11px] text-text-muted font-medium">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-container border border-border-gray text-[10px] font-mono">
              ESC
            </kbd>
            <span>to close</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-container border border-border-gray text-[10px] font-mono">
              Ctrl + K
            </kbd>
            <span>quick toggle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
