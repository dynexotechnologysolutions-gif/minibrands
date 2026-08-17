import Link from "next/link";

interface PopularCategory {
  label: string;
  href: string;
}

const popularCategories: PopularCategory[] = [
  { label: "Living Room", href: "/products?category=home-decor" },
  { label: "Wall Decor", href: "/products?category=home-decor" },
  { label: "Kitchen Storage", href: "/products?category=kitchen" },
  { label: "Drinkware", href: "/products?category=bottles" },
  { label: "Skincare", href: "/products?category=beauty" },
  { label: "Men's Fashion", href: "/products?category=fashion" },
  { label: "Women's Fashion", href: "/products?category=fashion" },
  { label: "Spiritual Decor", href: "/products?category=spiritual" },
];

export default function CategoryPopularList() {
  return (
    <div className="hide-scrollbar mt-6 flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
      {popularCategories.map((category) => (
        <Link
          key={category.label}
          href={category.href}
          className="min-h-11 shrink-0 whitespace-nowrap rounded-full border border-vl-border bg-vl-card px-4 py-2 text-sm font-semibold text-vl-ink transition duration-vl-fast hover:border-vl-primary hover:text-vl-primary active:scale-[0.97] sm:shrink"
        >
          {category.label}
        </Link>
      ))}
    </div>
  );
}