import SectionHeading from "@/components/ui/SectionHeading";
import ProductCard from "@/components/product/ProductCard";

interface HomeProductSectionProps {
  title: string;
  products: any[];
  href: string;
  isLoggedIn: boolean;
  wishlistIds: string[];
  hideTitleOnMobile?: boolean;
}

export default function HomeProductSection({
  title,
  products,
  href,
  isLoggedIn,
  wishlistIds,
  hideTitleOnMobile = false,
}: HomeProductSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="vl-section-shell mt-10 sm:mt-16 font-sans">
      <SectionHeading
        title={title}
        action={{ href, label: "View All" }}
        className={hideTitleOnMobile ? "hidden sm:flex" : ""}
      />
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
