import { Filters } from "../types/Filters";
import { Product } from "../types/Product";

export interface ProductsResponse {
  products: Product[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function fetchProducts(filters: Filters): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.set("page", filters.page.toString());
  if (filters.limit) params.set("limit", filters.limit.toString());
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);

  if (filters.priceRange) {
    params.set("priceRange", `${filters.priceRange[0]}-${filters.priceRange[1]}`);
  }
  if (filters.rating) {
    params.set("rating", filters.rating.toString());
  }
  if (filters.discount) {
    params.set("discount", filters.discount.toString());
  }

  const queryStr = params.toString();
  const url = "/api/products";
  
  const res = await fetch(queryStr ? `${url}?${queryStr}` : url);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}
