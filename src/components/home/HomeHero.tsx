import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

export default function HomeHero() {
  return (
    <section className="vl-section-shell pt-4 sm:pt-6 lg:pt-8">
      <div className="relative grid overflow-hidden rounded-vl-section bg-vl-ink text-white shadow-vl-medium lg:grid-cols-[1.05fr_0.95fr] lg:min-h-[660px]">
        <div className="relative z-10 flex min-h-[500px] flex-col justify-center p-6 sm:min-h-[580px] sm:p-10 lg:min-h-[660px] lg:p-16">
          <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold tracking-[0.12em] text-white/80 backdrop-blur-sm">
            <Sparkles aria-hidden="true" className="h-4 w-4 text-vl-accent" />
            THE NEW MINIBRANDS EDIT
          </div>
          <h1 className="max-w-[420px] font-vl-heading text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Your next favourite look is already here.
          </h1>
          <p className="mt-6 max-w-[420px] text-sm leading-6 text-white/70 sm:text-base">
            Discover independent labels, expressive pieces, and everyday staples curated for the way you move now.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="group inline-flex min-h-12 items-center gap-2 rounded-vl-control bg-vl-primary px-5 text-sm font-semibold text-white shadow-vl-medium transition duration-vl-standard ease-vl-out hover:-translate-y-1 hover:bg-vl-primary-strong hover:shadow-vl-large"
            >
              Shop the edit
              <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform duration-vl-fast group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/sellers"
              className="inline-flex min-h-12 items-center rounded-vl-control border border-white/25 px-5 text-sm font-semibold text-white transition duration-vl-fast hover:border-white/60 hover:bg-white/10"
            >
              Meet the labels
            </Link>
          </div>
        </div>
        <div className="absolute inset-0 lg:relative lg:inset-auto lg:min-h-[660px]">
          <Image
            src="https://images.unsplash.com/photo-1624353656309-8be1a6c457be?auto=format&fit=crop&w=1400&q=85"
            alt="Fashion editorial street style portrait by Mikhail Pasynkov on Unsplash"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 48vw"
            className="object-cover object-center opacity-55 lg:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-vl-ink via-vl-ink/35 to-transparent lg:bg-gradient-to-r lg:from-vl-ink/35 lg:to-transparent" />
          <div className="absolute bottom-5 right-5 hidden rounded-vl-control border border-white/25 bg-white/10 px-4 py-3 text-right text-xs backdrop-blur-md sm:block lg:bottom-8 lg:right-8">
            <p className="font-semibold text-white">Independent by design</p>
            <p className="mt-1 text-white/65">New pieces, small labels, big personality.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
