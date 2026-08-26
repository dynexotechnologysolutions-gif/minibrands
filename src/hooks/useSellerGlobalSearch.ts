"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface SearchResult {
  id: string;
  type: 'product' | 'order' | 'return' | 'inventory';
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  image?: string;
}

interface UseSellerGlobalSearchReturn {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isLoading: boolean;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  searchType: string;
  setSearchType: (type: string) => void;
  openSearch: () => void;
  closeSearch: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function useSellerGlobalSearch(): UseSellerGlobalSearchReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchType, setSearchType] = useState("all");
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openSearch = useCallback(() => {
    setIsOpen(true);
    setSelectedIndex(0);
    document.body.style.overflow = "hidden";
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setSelectedIndex(0);
    document.body.style.overflow = "";
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  const performSearch = useCallback(async (searchQuery: string, searchType: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: searchType,
        limit: "10",
      });
      const res = await fetch(`/api/seller/search?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Search error:", error);
        setResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query, searchType);
    }, 200);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, searchType]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        closeSearch();
        break;
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          window.location.href = results[selectedIndex].href;
          closeSearch();
        }
        break;
      case "Tab":
        // Allow tab to move between results and filter tabs
        break;
      default:
        break;
    }
  }, [isOpen, results, selectedIndex]);

  return {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    results,
    isLoading,
    selectedIndex,
    setSelectedIndex,
    searchType,
    setSearchType,
    openSearch,
    closeSearch,
    handleKeyDown,
  };
}