import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function CategoryDiscoveryBanner() {
  return (
    <section className="overflow-hidden rounded-vl-section border border-vl-border bg-[#F7F9F9] shadow-vl-soft">
      <div className="flex items-center gap-4 p-4 sm:p-6 lg:p-8">
        <div className="min-w-0 flex-1">
          <h2 className="font-vl-heading text-xl font-bold tracking-[-0.03em] text-vl-ink sm:text-2xl">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="mt-1.5 text-sm text-vl-muted sm:text-[15px]">
            Explore thousands of products from trusted sellers.
          </p>
          <Link
            href="/products"
            className="group mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-vl-control bg-vl-primary px-5 text-sm font-semibold text-white transition duration-vl-fast hover:bg-vl-primary-strong hover:shadow-vl-medium active:scale-[0.98]"
          >
            Explore Products
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-vl-fast group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-vl-card sm:h-32 sm:w-40">
          <Image
            src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=600&q=80"
            alt="A selection of products from trusted sellers"
            fill
            sizes="(max-width: 640px) 96px, 160px"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}