import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductGrid from "@/components/product/ProductGrid";
import { Search as SearchIcon, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Results | Velvet Lane",
  robots: {
    index: false,
    follow: false,
  },
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = params.q || "";

  // Query matching products
  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      isPublished: true,
      seller: {
        verification: {
          kycStatus: { in: ["auto_approved", "approved"] },
          bankVerified: true,
        },
      },
      OR: q
        ? [
            { name: { contains: q, mode: "insensitive" } },
            { shortDescription: { contains: q, mode: "insensitive" } },
            { tags: { has: q } },
          ]
        : undefined,
    },
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      variants: true,
      seller: {
        include: {
          verification: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
      {/* Back to Catalog */}
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Page Header */}
      <header className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-3">
          <SearchIcon className="w-8 h-8 text-indigo-600" />
          <span>Search Results</span>
        </h1>
        {q ? (
          <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            Showing results for &ldquo;<span className="font-semibold text-slate-800">{q}</span>&rdquo; in Chennai.
          </p>
        ) : (
          <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            Enter a search term to find unique fashion pieces from local boutiques.
          </p>
        )}
      </header>

      {/* Search Input Form */}
      <section className="mb-8">
        <form action="/search" method="GET" className="relative w-full max-w-md flex items-center">
          <SearchIcon className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="search-page-input"
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search streetwear, sarees, accessories..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-medium focus:outline-none transition-all"
          />
        </form>
      </section>

      {/* Products Grid */}
      <section className="mb-12">
        {products.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-slate-100 bg-white/70">
            <p className="text-slate-500 text-sm font-semibold">
              {q ? `No items found matching "${q}".` : "No products to display."}
            </p>
            <Link
              href="/products"
              className="mt-4 inline-block text-xs font-extrabold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
            >
              Browse all items
            </Link>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </section>
    </main>
  );
}
