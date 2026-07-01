import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "../services/catalogApi";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
