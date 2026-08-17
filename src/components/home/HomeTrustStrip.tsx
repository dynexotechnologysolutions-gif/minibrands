import { ShieldCheck, Wallet, Truck, Coins } from "lucide-react";

export default function HomeTrustStrip() {
  const trustItems = [
    {
      Icon: ShieldCheck,
      title: "Secure Payment",
      desc: "100% Safe",
    },
    {
      Icon: Wallet,
      title: "Easy Returns",
      desc: "Hassle Free",
    },
    {
      Icon: Truck,
      title: "Fast Delivery",
      desc: "Across India",
    },
    {
      Icon: Coins,
      title: "COD Available",
      desc: "Pay on Delivery",
    },
  ];

  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 md:px-8 mt-8 mb-10 font-sans" aria-label="Platform trust indicators">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#F7F9F9] p-4 rounded-2xl border border-[#E5E7E7]">
        {trustItems.map(({ Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-3 p-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-[#E5E7E7] shadow-sm">
              <Icon className="h-5 w-5 text-[#0F7F7F]" strokeWidth={2} />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-xs font-bold text-slate-800 truncate">{title}</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">{desc}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
