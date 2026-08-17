import { ShieldCheck, BadgeCheck, RefreshCcw, Truck } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

const benefits = [
  { Icon: ShieldCheck, title: "Secure Payments", desc: "100% secure payment options" },
  { Icon: BadgeCheck, title: "Verified Sellers", desc: "Quality products from trusted sellers" },
  { Icon: RefreshCcw, title: "Easy Returns", desc: "Hassle-free returns within 7 days" },
  { Icon: Truck, title: "Fast Delivery", desc: "Quick delivery across India" },
];

export default function HomeWhyShopWithVelvet() {
  return (
    <section className="vl-section-shell mt-10 sm:mt-16">
      <SectionHeading title="Why Shop With Velvet Lane?" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {benefits.map(({ Icon, title, desc }) => (
          <div
            key={title}
            className="flex flex-col items-start gap-3 rounded-vl-card border border-vl-border bg-vl-card p-4 sm:p-5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vl-primary/10">
              <Icon aria-hidden="true" className="h-5 w-5 text-vl-primary" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-vl-ink">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-vl-muted">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}