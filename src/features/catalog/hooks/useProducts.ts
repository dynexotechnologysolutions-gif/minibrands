import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../services/catalogApi";
import { Filters } from "../types/Filters";

export function useProducts(filters: Filters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
    placeholderData: (previousData) => previousData, // smooth pagination transitions
    staleTime: 1000 * 30, // 30 seconds
  });
}
