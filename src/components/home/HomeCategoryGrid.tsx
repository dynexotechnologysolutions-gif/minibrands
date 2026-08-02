import Image from "next/image";
import Link from "next/link";

const categories = [
  { label: "Western", href: "/products?category=western", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80", alt: "Woman in modern premium western wear" },
  { label: "Ethnic", href: "/products?category=ethnic", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=700&q=80", alt: "Elegant contemporary fusion ethnic wear" },
  { label: "Footwear", href: "/products?category=footwear", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=700&q=80", alt: "Minimalist fashion footwear" },
  { label: "Accessories", href: "/products?category=accessories", image: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&w=700&q=80", alt: "Premium designer accessories and bag" },
  { label: "Beauty", href: "/products?category=beauty", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=700&q=80", alt: "High-end organic clean beauty cosmetics" },
];

export default function HomeCategoryGrid() {
  return (
    <section className="vl-section-shell mt-8 sm:mt-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">Start here</p>
          <h2 className="font-vl-heading text-xl sm:text-3xl font-bold tracking-[-0.04em] text-vl-ink">Shop your mood</h2>
        </div>
        <Link href="/products" className="hidden rounded-vl-control px-3 py-2 text-sm font-semibold text-vl-muted transition hover:bg-vl-card hover:text-vl-primary sm:inline-flex">View all</Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
        {categories.map((category, index) => (
          <Link
            key={category.label}
            href={category.href}
            className={`group relative isolate aspect-[16/10] sm:aspect-[4/5] overflow-hidden rounded-xl sm:rounded-[20px] bg-vl-border shadow-vl-soft transition-all duration-vl-standard ease-vl-out hover:-translate-y-1 hover:shadow-vl-medium ${index === 0 ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <Image src={category.image} alt={category.alt} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" className="object-cover transition duration-500 ease-vl-out group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-vl-ink/80 via-vl-ink/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
            <span className="absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5 font-vl-heading text-sm sm:text-xl font-bold text-white tracking-tight">{category.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
