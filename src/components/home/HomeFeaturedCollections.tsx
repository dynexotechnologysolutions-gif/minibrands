import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

const collections = [
  { title: "Festive Edit", href: "/products?category=festive", image: "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?auto=format&fit=crop&w=800&q=80", alt: "Festive edit collection" },
  { title: "Under ₹999", href: "/products?maxPrice=999", image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80", alt: "Affordable finds under 999" },
  { title: "Weekend Looks", href: "/products?category=casual", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80", alt: "Weekend looks collection" },
  { title: "Minimal Essentials", href: "/products?category=minimal", image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=80", alt: "Minimal essentials collection" },
];

export default function HomeFeaturedCollections() {
  return (
    <section className="vl-section-shell mt-10 sm:mt-16">
      <SectionHeading title="Curated Collections" action={{ href: "/products", label: "View All" }} />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {collections.map((collection) => (
          <Link
            key={collection.title}
            href={collection.href}
            className="group relative w-[160px] shrink-0 snap-start overflow-hidden rounded-vl-card bg-vl-card shadow-vl-soft transition duration-vl-standard ease-vl-out hover:-translate-y-1 hover:shadow-vl-medium sm:w-auto"
          >
            <div className="relative aspect-[4/5]">
              <Image
                src={collection.image}
                alt={collection.alt}
                fill
                sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 22vw"
                className="object-cover transition duration-500 ease-vl-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="font-vl-heading text-xl font-bold tracking-[-0.03em]">{collection.title}</h3>
                <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-white/85 transition-colors group-hover:text-white">
                  Shop Now
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform duration-vl-fast group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}