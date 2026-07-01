import { useState, useCallback } from "react";
import { Filters } from "../types/Filters";

export function useFilters(initialFilters: Filters = {}) {
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 12,
    sort: "popularity",
    category: "All",
    ...initialFilters,
  });

  const setCategory = useCallback((category: string) => {
    setFilters((prev) => ({ ...prev, category, page: 1 }));
  }, []);

  const setSort = useCallback((sort: string) => {
    setFilters((prev) => ({ ...prev, sort, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const setQ = useCallback((q: string) => {
    setFilters((prev) => ({ ...prev, q, page: 1 }));
  }, []);

  const setPriceRange = useCallback((range: [number, number] | undefined) => {
    setFilters((prev) => ({ ...prev, priceRange: range, page: 1 }));
  }, []);

  const setRating = useCallback((rating: number | undefined) => {
    setFilters((prev) => ({ ...prev, rating, page: 1 }));
  }, []);

  const setDiscount = useCallback((discount: number | undefined) => {
    setFilters((prev) => ({ ...prev, discount, page: 1 }));
  }, []);

  const clearAll = useCallback(() => {
    setFilters((prev) => ({
      page: 1,
      limit: prev.limit,
      sort: prev.sort,
      category: prev.category,
      q: prev.q,
    }));
  }, []);

  return {
    filters,
    setFilters,
    setCategory,
    setSort,
    setPage,
    setQ,
    setPriceRange,
    setRating,
    setDiscount,
    clearAll,
  };
}
