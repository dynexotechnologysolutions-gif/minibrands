import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Velvet Lane",
  description: "Read the Privacy Policy of Velvet Lane to understand how we secure and process user credentials and transaction records.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Privacy Policy</h1>
        <p className="text-xs text-slate-500 mb-8">Last Updated: July 28, 2026</p>

        <section className="space-y-6 text-slate-600 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">1. Information We Collect</h2>
            <p>
              We collect personal data such as your name, email, phone number, and physical shipping address when you register or make purchases on Velvet Lane.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">2. How We Use Your Data</h2>
            <p>
              We use your information to facilitate purchases, process payments via our secure checkout flow, verify identities, coordinate courier pickups, and send transactional email updates.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">3. Payment & Security</h2>
            <p>
              All payment details are handled securely by third-party processors (Razorpay/Stripe). Velvet Lane does not store raw credit card details on our servers.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">4. Your Privacy Rights</h2>
            <p>
              You may request access to, edit, or delete your personal account data by logging into your account settings page or contacting our support team at <a href="mailto:privacy@MiniBrands.in" className="text-indigo-600 hover:underline">privacy@MiniBrands.in</a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
