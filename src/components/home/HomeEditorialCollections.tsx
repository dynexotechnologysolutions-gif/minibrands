import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const collections = [
  { title: "Soft power dressing", label: "The 9 to 9 edit", href: "/products?category=western", image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1000&q=80", alt: "Minimal fashion outfit in soft neutral tones" },
  { title: "Weekend, reimagined", label: "Easy layers and loud details", href: "/products?category=streetwear", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=80", alt: "Gen Z street style outfit in the city" },
  { title: "Made for the spotlight", label: "Party looks, independent labels", href: "/products?category=ethnic", image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80", alt: "Fashion editorial look for an evening out" },
];

export default function HomeEditorialCollections() {
  return (
    <section className="vl-section-shell mt-16 sm:mt-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">Curated for you</p>
          <h2 className="font-vl-heading text-2xl font-bold tracking-[-0.04em] text-vl-ink sm:text-3xl">Looks worth saving</h2>
        </div>
        <Link href="/products" className="hidden rounded-vl-control px-3 py-2 text-sm font-semibold text-vl-muted transition hover:bg-vl-card hover:text-vl-primary sm:inline-flex">Explore edits</Link>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
        {collections.map((collection, index) => (
          <Link key={collection.title} href={collection.href} className={`group relative isolate min-h-[280px] overflow-hidden rounded-vl-card bg-vl-ink shadow-vl-soft transition duration-vl-standard ease-vl-out hover:-translate-y-1 hover:shadow-vl-medium ${index === 0 ? "lg:min-h-[440px]" : "lg:min-h-[360px]"}`}>
            <Image src={collection.image} alt={collection.alt} fill sizes="(max-width: 1024px) 100vw, 36vw" className="object-cover transition duration-500 ease-vl-out group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white sm:bottom-6 sm:left-6 sm:right-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">{collection.label}</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <h3 className="max-w-[16rem] font-vl-heading text-2xl font-bold leading-tight tracking-[-0.04em]">{collection.title}</h3>
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-vl-ink transition group-hover:bg-vl-primary group-hover:text-white"><ArrowUpRight aria-hidden="true" className="h-4 w-4" /></span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
