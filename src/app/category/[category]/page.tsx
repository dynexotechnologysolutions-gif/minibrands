import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductGrid from "@/components/product/ProductGrid";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const categoryName = decodeURIComponent(resolvedParams.category);
  return {
    title: `${categoryName} | Chennai's Best Local Fashion | Velvet Lane`,
    description: `Shop curated ${categoryName.toLowerCase()} from verified home boutiques and designers in Chennai. Secure escrow payments.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const categoryName = decodeURIComponent(resolvedParams.category);

  // Validate that it's one of our target categories
  const validCategories = ["Women's Ethnic Wear", "Streetwear", "Accessories", "Handloom"];
  if (!validCategories.includes(categoryName)) {
    notFound();
  }

  // Fetch verified products for this category
  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      isPublished: true,
      category: categoryName,
      seller: {
        verification: {
          kycStatus: { in: ["auto_approved", "approved"] },
          bankVerified: true,
        },
      },
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
      {/* Breadcrumb / Back Navigation */}
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
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 tracking-tight">
          {categoryName}
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
          Discover handpicked local {categoryName.toLowerCase()} creations from Chennai's verified boutique sellers.
        </p>
      </header>

      {/* Products Grid */}
      <section className="mb-12">
        {products.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-slate-100 bg-white/70">
            <p className="text-slate-500 text-sm font-semibold">No products found in this category.</p>
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
