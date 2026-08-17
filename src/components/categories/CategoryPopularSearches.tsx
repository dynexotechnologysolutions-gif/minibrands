import Link from "next/link";

const popularSearches = [
  "Wall Decor",
  "Water Bottles",
  "Skincare",
  "Pooja Items",
  "Kitchen Organizers",
];

export default function CategoryPopularSearches() {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {popularSearches.map((term) => (
        <Link
          key={term}
          href={`/products?q=${encodeURIComponent(term)}`}
          className="min-h-11 inline-flex items-center rounded-full border border-vl-border bg-white px-3.5 py-2 text-[13px] font-medium text-vl-muted transition duration-vl-fast hover:border-vl-primary hover:text-vl-primary active:scale-[0.97]"
        >
          {term}
        </Link>
      ))}
    </div>
  );
}