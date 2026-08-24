import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | MiniBrands",
  description: "Read the Terms of Service of MiniBrands, governing buyer purchases, seller boutique rules, and escrow release protections.",
};

export default function TermsPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Terms of Service</h1>
        <p className="text-xs text-slate-500 mb-8">Last Updated: July 28, 2026</p>

        <section className="space-y-6 text-slate-600 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">1. Agreement to Terms</h2>
            <p>
              By accessing or using MiniBrands, you agree to be bound by these terms. If you do not agree, please do not use our services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">2. Marketplace Rules</h2>
            <p>
              Buyers must complete payment in full using our secure checkout flow. Sellers are responsible for listing accurate descriptions, fulfilling packaging, and completing courier handovers.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">3. Escrow & Disputes</h2>
            <p>
              All customer funds are held in escrow for 7 days post-delivery. If no return request is filed during this window, funds are released to the seller. In case of disputes, MiniBrands has final discretion to resolve issues.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">4. User Accounts</h2>
            <p>
              You must provide accurate verification details. MiniBrands reserves the right to lock or delete accounts that engage in fraudulent behavior.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
