"use client";

import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Search, Loader2 } from "lucide-react";
import { useSellerGlobalSearch } from "@/hooks/useSellerGlobalSearch";
import SellerSearchResult from "./SellerSearchResult";

export default function SellerGlobalSearch() {
  const [mounted, setMounted] = useState(false);
  const {
    isOpen,
    query,
    setQuery,
    results,
    isLoading,
    selectedIndex,
    searchType,
    setSearchType,
    closeSearch,
  } = useSellerGlobalSearch();

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeSearch]);

  // Handle scroll to selected item
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Handle global keyboard shortcuts
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!isOpen) {
          document.dispatchEvent(new CustomEvent("seller-search-open"));
        }
      }
    }
    if (!isOpen) {
      document.addEventListener("keydown", handleGlobalKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSearch();
      }
    }
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, closeSearch]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={closeSearch}
        aria-hidden="true"
      />

      {/* Search Modal */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-2xl mx-4 sm:max-w-3xl lg:max-w-4xl max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-vl-border overflow-hidden flex flex-col animate-fade-in-up"
        role="dialog"
        aria-modal="true"
        aria-label="Seller global search"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-vl-border bg-vl-surface/50 backdrop-blur-sm sticky top-0 z-10 rounded-t-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-vl-muted pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, orders, returns, inventory..."
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className="w-full pl-11 pr-12 py-3 bg-white border border-vl-border rounded-xl text-base font-medium text-vl-ink shadow-sm outline-none transition-colors duration-200 placeholder:text-vl-muted focus:border-vl-primary focus:ring-1 focus:ring-vl-primary/30 sm:h-[52px] sm:text-[15px]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-vl-muted transition-colors hover:bg-vl-surface hover:text-vl-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={closeSearch}
            className="w-9 h-9 flex items-center justify-center rounded-full text-vl-muted hover:bg-vl-surface hover:text-vl-ink transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search type tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-1 flex items-center gap-2 overflow-x-auto border-b border-vl-border">
          {[
            { value: "all", label: "All" },
            { value: "products", label: "Products" },
            { value: "orders", label: "Orders" },
            { value: "returns", label: "Returns" },
            { value: "inventory", label: "Inventory" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSearchType(tab.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 mb-1 ${
                searchType === tab.value
                  ? "bg-vl-primary text-white shadow-sm"
                  : "bg-vl-surface text-vl-muted hover:bg-vl-border hover:text-vl-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[55vh] p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-vl-primary animate-spin" />
              <span className="ml-3 text-vl-muted">Searching...</span>
            </div>
          ) : results.length === 0 && query.length >= 2 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-16 w-16 rounded bg-vl-border/60 flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-semibold text-vl-ink mb-1">No results found</h3>
              <p className="text-sm text-vl-muted mb-4">
                No results found for &quot;<span className="font-medium">{query}</span>&quot;
              </p>
              <p className="text-xs text-vl-muted">Try different keywords or check spelling</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-16 w-16 rounded bg-vl-border/60 flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-semibold text-vl-ink mb-1">Start typing to search</h3>
              <p className="text-sm text-vl-muted">Search across products, orders, returns, and inventory</p>
            </div>
          ) : (
            <div role="listbox" ref={resultsRef} aria-label="Search results">
              {results.map((result, index) => (
                <SellerSearchResult
                  key={result.id}
                  result={result}
                  isSelected={index === selectedIndex}
                  onClick={() => {
                    window.location.href = result.href;
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer - Keyboard hints */}
        <div className="px-4 sm:px-6 py-3 border-t border-vl-border bg-vl-surface/50 rounded-b-2xl">
          <div className="flex items-center justify-center gap-6 text-xs text-vl-muted">
            <kbd className="px-2 py-1 bg-vl-surface border border-vl-border rounded text-[10px]">↑</kbd>
            <kbd className="px-2 py-1 bg-vl-surface border border-vl-border rounded text-[10px]">↓</kbd>
            <span className="text-vl-muted">Navigate</span>
            <kbd className="px-2 py-1 bg-vl-surface border border-vl-border rounded text-[10px]">Enter</kbd>
            <span className="text-vl-muted">Open</span>
            <kbd className="px-2 py-1 bg-vl-surface border border-vl-border rounded text-[10px]">Esc</kbd>
            <span className="text-vl-muted">Close</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}