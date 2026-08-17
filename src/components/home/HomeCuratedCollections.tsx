import Link from "next/link";
import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";

const collections = [
  { name: "Wedding Edit", image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80", href: "/products?category=wedding" },
  { name: "Office Wear", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80", href: "/products?category=office" },
  { name: "Festive Vibes", image: "https://images.unsplash.com/photo-1611462987358-307379c2c890?auto=format&fit=crop&w=600&q=80", href: "/products?category=festive" },
  { name: "Casual Daily", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80", href: "/products?category=casual" },
];

export default function HomeCuratedCollections() {
  return (
    <section className="vl-section-shell mt-8 sm:mt-10">
      <SectionHeading title="Shop by Occasion" />
      <div className="mt-6 flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar sm:grid sm:grid-cols-2 md:grid-cols-4 sm:pb-0 sm:mx-0 sm:px-0">
        {collections.map((collection) => (
          <Link key={collection.name} href={collection.href} className="group relative block shrink-0 w-[150px] sm:w-auto overflow-hidden rounded-vl-card">
            <div className="relative aspect-[4/5]">
                <Image src={collection.image} alt={collection.name} fill className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/30" />
            </div>
            <p className="mt-3 text-center text-sm font-semibold text-vl-ink">{collection.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
