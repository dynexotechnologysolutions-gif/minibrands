export interface Filters {
  priceRange?: [number, number]; // [min, max] in rupees
  rating?: number; // e.g. 4 or 3 (ratings and above)
  discount?: number; // e.g. 50, 30, 10 (percentage and above)
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
}
