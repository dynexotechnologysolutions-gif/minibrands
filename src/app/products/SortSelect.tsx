"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SortSelectProps {
  initialSort: string;
}

export default function SortSelect({ initialSort }: SortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.set("page", "1"); // reset page to 1 on sort change
    router.push(`/products?${params.toString()}`);
  };

  return (
    <select
      id="sort-select"
      defaultValue={initialSort}
      onChange={handleSortChange}
      className="bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-750 font-semibold cursor-pointer text-xs"
    >
      <option value="newest">Newest First</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    </select>
  );
}
