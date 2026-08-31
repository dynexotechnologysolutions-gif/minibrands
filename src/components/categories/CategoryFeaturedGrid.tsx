import Link from "next/link";
import Image from "next/image";

interface FeaturedCategory {
  name: string;
  href: string;
  image: string;
  alt: string;
}

const featuredCategories: FeaturedCategory[] = [
  {
    name: "Home Decor",
    href: "/products?category=home-decor",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    alt: "Stylish living room with decorative home products",
  },
  {
    name: "Kitchen",
    href: "/products?category=kitchen",
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=80",
    alt: "Organized kitchen with cooking essentials",
  },
  {
    name: "Spiritual",
    href: "/products?category=spiritual",
    image: "https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=800&q=80",
    alt: "Traditional spiritual products and decor",
  },
  {
    name: "Bottles & Flasks",
    href: "/products?category=bottles",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    alt: "Premium reusable water bottles",
  },
  {
    name: "Beauty",
    href: "/products?category=beauty",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
    alt: "Beauty and skincare products",
  },
  {
    name: "Wellness",
    href: "/products?category=heart-pulse",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
    alt: "Wellness and self care essentials",
  },
  {
    name: "Fashion",
    href: "/products?category=fashion",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80",
    alt: "Modern fashion clothing and styling",
  },
  {
    name: "Gifts & More",
    href: "/products?category=gifts",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
    alt: "Curated gift collections",
  },
];

const storeCount = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 100000;
  return (hash % 116) + 24;
};

export default function CategoryFeaturedGrid() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {featuredCategories.map((category) => (
        <Link
          key={category.name}
          href={category.href}
          className="group flex flex-col overflow-hidden rounded-vl-card border border-vl-border bg-white shadow-vl-soft transition duration-vl-standard ease-vl-out hover:-translate-y-0.5 hover:border-vl-primary hover:shadow-vl-medium active:scale-[0.99]"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-vl-card">
            <Image
              src={category.image}
              alt={category.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition duration-500 ease-vl-out group-hover:scale-105"
            />
          </div>
          <div className="flex flex-1 flex-col justify-center px-3 py-2.5 sm:px-4 sm:py-3">
            <h3 className="text-[15px] font-bold leading-snug text-vl-ink sm:text-base">
              {category.name}
            </h3>
            <p className="mt-0.5 text-xs text-vl-muted sm:text-[13px]">
              {storeCount(category.name)} Stores
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}