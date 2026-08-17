import Link from "next/link";
import { Mic, Scan, Search } from "lucide-react";

export default function CategorySearchBar() {
  return (
    <div className="mt-4 md:mt-6">
      <Link
        href="/products"
        aria-label="Search products, brands or stores"
        className="flex h-12 w-full items-center justify-between rounded-vl-control border border-vl-border bg-white px-4 text-slate-400 shadow-vl-soft transition hover:border-vl-primary active:scale-[0.99] md:h-[52px]"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="truncate text-sm font-medium text-slate-500">
            Search products, brands or stores...
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-slate-500">
          <Mic aria-hidden="true" className="h-4 w-4 text-vl-primary" />
          <Scan aria-hidden="true" className="h-4 w-4 text-vl-primary" />
        </div>
      </Link>
    </div>
  );
}