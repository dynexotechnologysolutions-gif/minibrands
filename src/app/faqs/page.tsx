import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQs & Help Center | Velvet Lane",
  description: "Browse frequently asked questions regarding order placement, shipping times, returns, and escrow payment safeties at Velvet Lane.",
};

export default function FAQsPage() {
  const categories = [
    {
      title: "Orders & Shipping",
      questions: [
        {
          q: "Where does Velvet Lane deliver?",
          a: "Delivery is currently restricted to Chennai locations to ensure fast transit times and secure handling."
        },
        {
          q: "How long does shipping take?",
          a: "Most orders are shipped within 24-48 hours. Transit normally takes 2-3 business days within Chennai."
        }
      ]
    },
    {
      title: "Payments & Escrow",
      questions: [
        {
          q: "What is escrow-protected payment?",
          a: "When you purchase an item, your payment is held securely by Velvet Lane. Funds are only disbursed to the seller after delivery verification and the lapse of the return window."
        },
        {
          q: "Which payment options are supported?",
          a: "We support Credit/Debit cards, UPI, Netbanking, and popular digital wallets processed securely via Razorpay."
        }
      ]
    },
    {
      title: "Returns & Refunds",
      questions: [
        {
          q: "What is your return policy?",
          a: "You can request a return within 7 days of delivery. The item must be in its original unused condition, with all tags attached."
        },
        {
          q: "How long do refunds take?",
          a: "Once the seller receives and validates the returned item, your refund is approved and credited back to your original payment method within 5-7 business days."
        }
      ]
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4 text-center">Help Center & FAQs</h1>
        <p className="text-slate-600 text-center mb-12">
          Find answers to frequently asked questions about shopping on Velvet Lane.
        </p>

        <div className="space-y-8">
          {categories.map((cat, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">{cat.title}</h2>
              <div className="space-y-4">
                {cat.questions.map((faq, j) => (
                  <details key={j} className="group border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <summary className="flex justify-between items-center font-semibold text-slate-800 cursor-pointer list-none focus:outline-none focus:text-indigo-600">
                      <span>{faq.q}</span>
                      <span className="transition group-open:rotate-180">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </summary>
                    <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
