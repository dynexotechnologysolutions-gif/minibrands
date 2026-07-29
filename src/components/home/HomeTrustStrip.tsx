import { BadgeCheck, CreditCard, RotateCcw, Truck } from "lucide-react";

const trustItems = [
  { title: "Verified sellers", description: "Independent labels checked for trust", Icon: BadgeCheck },
  { title: "Secure checkout", description: "Protected payments at every step", Icon: CreditCard },
  { title: "Fast delivery", description: "Clear updates from label to door", Icon: Truck },
  { title: "Easy returns", description: "Simple support when plans change", Icon: RotateCcw },
];

export default function HomeTrustStrip() {
  return (
    <section className="vl-section-shell mt-16 sm:mt-24">
      <div className="grid gap-px overflow-hidden rounded-vl-card border border-vl-border bg-vl-border sm:grid-cols-2 lg:grid-cols-4">
        {trustItems.map(({ title, description, Icon }) => (
          <div key={title} className="bg-vl-card p-5 sm:p-6">
            <Icon aria-hidden="true" className="h-6 w-6 text-vl-primary" strokeWidth={1.8} />
            <h3 className="mt-4 font-vl-heading text-base font-bold text-vl-ink">{title}</h3>
            <p className="mt-1 text-sm leading-5 text-vl-muted">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
