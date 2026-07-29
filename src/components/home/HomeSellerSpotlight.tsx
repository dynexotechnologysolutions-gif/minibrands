import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, UsersRound } from "lucide-react";

export default function HomeSellerSpotlight({ sellers }: { sellers: Array<{ id: string; businessName: string; category: string; logoUrl: string | null; bannerUrl: string; tagline: string; productCount: number }> }) {
  return (
    <section className="vl-section-shell mt-16 sm:mt-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">Independent voices</p>
          <h2 className="font-vl-heading text-2xl font-bold tracking-[-0.04em] text-vl-ink sm:text-3xl">Meet the labels</h2>
        </div>
        <Link href="/sellers" className="hidden rounded-vl-control px-3 py-2 text-sm font-semibold text-vl-muted transition hover:bg-vl-card hover:text-vl-primary sm:inline-flex">View all sellers</Link>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {sellers.map((seller) => (
          <article key={seller.id} className="group overflow-hidden rounded-vl-card border border-vl-border bg-vl-card shadow-vl-soft transition duration-vl-standard ease-vl-out hover:-translate-y-1 hover:shadow-vl-medium">
            <div className="relative aspect-[16/8] overflow-hidden bg-vl-surface">
              <Image src={seller.bannerUrl} alt={`${seller.businessName} editorial banner`} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition duration-500 ease-vl-out group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-vl-ink">Independent label</span>
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-vl-border bg-vl-surface">
                  {seller.logoUrl ? <Image src={seller.logoUrl} alt={`${seller.businessName} logo`} fill sizes="48px" className="object-cover" /> : <span className="flex h-full w-full items-center justify-center font-vl-heading text-lg font-bold text-vl-secondary">{seller.businessName.charAt(0)}</span>}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate font-vl-heading text-lg font-bold text-vl-ink">{seller.businessName}</h3>
                    <BadgeCheck aria-label="Verified seller" className="h-4 w-4 shrink-0 text-vl-success" />
                  </div>
                  <p className="mt-1 truncate text-sm text-vl-muted">{seller.tagline || seller.category}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-vl-muted"><UsersRound aria-hidden="true" className="h-3.5 w-3.5" /> {seller.productCount} pieces to explore</p>
                </div>
              </div>
              <Link href={`/sellers/${seller.id}`} aria-label={`Visit ${seller.businessName}`} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-vl-ink text-white transition duration-vl-fast hover:bg-vl-primary"><ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
