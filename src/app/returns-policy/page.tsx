import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Return Policy | MiniBrands",
  description: "Read the Refund & Return Policy of MiniBrands to understand returns, disputes, cancellation conditions, and merchant payout rules.",
};

export default function ReturnsPolicyPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Refund & Return Policy</h1>
        <p className="text-xs text-slate-500 mb-8">Last Updated: July 28, 2026</p>

        <section className="space-y-6 text-slate-600 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">1. 7-Day Return Policy</h2>
            <p>
              Buyers may initiate return requests within 7 days of the courier delivery confirmation. The item must be returned in its original packaging with all labels intact.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">2. Return Inspection</h2>
            <p>
              Once a return request is opened, the item will be shipped back to the seller. If the seller reports damage or alteration of the item, our dispute mediation team will review the claim to finalize the payout decision.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">3. Refund Processing</h2>
            <p>
              Approved refunds are credited to the buyer's original payment method (UPI / Credit Card / Debit Card / Netbanking) via Razorpay/Stripe within 5-7 business days of approval.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">4. Cancellations</h2>
            <p>
              Orders may be cancelled before shipment by clicking the Cancel button in the order details view. Once the order is shipped and an AWB is generated, cancellations are disabled.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
