import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

interface CategoryHeaderProps {
  category: string;
  query: string;
  totalProducts: number;
}

const categoryMeta: Record<string, { image: string; description: string }> = {
  "home-decor": {
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    description: "Beautiful products to make your home feel more personal.",
  },
  kitchen: {
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=80",
    description: "Everything you need to cook, store and organize your space.",
  },
  spiritual: {
    image: "https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=800&q=80",
    description: "Sacred essentials for your daily rituals and spaces.",
  },
  bottles: {
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    description: "Premium drinkware and reusable bottles for every day.",
  },
  beauty: {
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
    description: "Skincare and beauty essentials for every routine.",
  },
  "heart-pulse": {
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
    description: "Wellness products to support your daily routine.",
  },
  wellness: {
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
    description: "Wellness products to support your daily routine.",
  },
  fashion: {
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80",
    description: "Trending fashion and everyday wear for every occasion.",
  },
  gifts: {
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
    description: "Thoughtful gifts for every occasion.",
  },
};

const fallbackMeta = {
  image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=80",
  description: "Beautiful products to make your life feel more personal.",
};

const formatCategoryName = (raw: string) => {
  if (raw.includes("-")) {
    return raw
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return raw;
};

export default function CategoryHeader({
  category,
  query,
  totalProducts,
}: CategoryHeaderProps) {
  const isCategory = !!category && category !== "All";
  const heading = query
    ? `Results for "${query}"`
    : isCategory
      ? formatCategoryName(category)
      : "Products";
  const meta = isCategory
    ? categoryMeta[category.toLowerCase().trim()] ?? fallbackMeta
    : null;
  const countText = `${totalProducts.toLocaleString("en-IN")} ${totalProducts === 1 ? "Product" : "Products"}`;

  return (
    <div className="mb-5 sm:mb-6">
      {/* Breadcrumb — desktop only */}
      <nav
        aria-label="Breadcrumb"
        className="mb-4 hidden items-center gap-1.5 text-[13px] text-vl-muted md:flex"
      >
        <Link href="/" className="transition-colors hover:text-vl-primary">
          Home
        </Link>
        <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-vl-border" />
        <Link href="/categories" className="transition-colors hover:text-vl-primary">
          Categories
        </Link>
        {isCategory || query ? (
          <>
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-vl-border" />
            <span className="font-semibold text-vl-ink">
              {query ? "Search" : formatCategoryName(category)}
            </span>
          </>
        ) : null}
      </nav>

      {/* Compact header */}
      {isCategory && meta ? (
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-vl-card sm:h-28 sm:w-40">
            <Image
              src={meta.image}
              alt=""
              fill
              sizes="(max-width: 640px) 112px, 160px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-vl-heading break-words text-2xl font-extrabold tracking-[-0.04em] text-vl-ink sm:text-3xl">
              {heading}
            </h1>
            <p className="mt-1 hidden text-sm text-vl-muted sm:block">
              {meta.description}
            </p>
            <p className="mt-1.5 text-[13px] font-semibold text-vl-muted">
              {countText}
            </p>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="font-vl-heading break-words text-2xl font-extrabold tracking-[-0.04em] text-vl-ink sm:text-3xl">
            {heading}
          </h1>
          <p className="mt-1 text-sm text-vl-muted">{countText}</p>
        </div>
      )}
    </div>
  );
}