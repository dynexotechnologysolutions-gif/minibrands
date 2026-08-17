import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import ProductCard from "@/components/product/ProductCard";

interface HomeProductSectionProps {
  title: string;
  products: any[];
  href: string;
  isLoggedIn: boolean;
  wishlistIds: string[];
}

export default function HomeProductSection({
  title,
  products,
  href,
  isLoggedIn,
  wishlistIds,
}: HomeProductSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="vl-section-shell mt-10 sm:mt-16 font-sans">
      <SectionHeading title={title} action={{ href, label: "View All" }} />
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isLoggedIn={isLoggedIn}
            isWishlisted={wishlistIds.includes(product.id)}
          />
        ))}
      </div>
    </section>
  );
}
