import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | MiniBrands",
  description: "Learn about MiniBrands's history, mission, values, and commitment to sustainable premium fashion in Chennai.",
};

export default function AboutPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-6">About MiniBrands</h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-8">
          Welcome to MiniBrands, Chennai's forward-looking premium fashion marketplace. We connect style-conscious buyers with verified, handpicked independent designers and boutique labels.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
          <p className="text-slate-600 leading-relaxed">
            Our mission is to foster local fashion design ecosystems by offering a secure, trust-first marketplace. We believe in sustainable styling, premium craftsmanship, and empowering independent designers with secure tools to build their brands.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Core Values</h2>
          <ul className="space-y-3 text-slate-600">
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">✔</span>
              <span><strong>Trust & Security:</strong> Escrow-protected payment structures guarantee buyer and seller protections for all transactions.</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">✔</span>
              <span><strong>Empowerment:</strong> Supporting local Chennai fashion stores and artisanal tailors.</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">✔</span>
              <span><strong>Quality Curation:</strong> Every boutique undergoes onboarding verification.</span>
            </li>
          </ul>
        </section>

        <section id="careers" className="mb-12 border-t border-slate-200 pt-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Careers</h2>
          <p className="text-slate-600 leading-relaxed">
            Interested in building Chennai's next-generation fashion marketplace? Drop us a note with your resume at <a href="mailto:careers@MiniBrands.in" className="text-indigo-600 hover:underline">careers@MiniBrands.in</a>. We are always looking for software developers, product designers, and creative merchant relations specialists.
          </p>
        </section>

        <section id="blog" className="border-t border-slate-200 pt-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Blog</h2>
          <p className="text-slate-600 leading-relaxed">
            Stay tuned for upcoming styling lookbooks, seasonal fashion guides, and stories spotlighting our local independent designers.
          </p>
        </section>
      </div>
    </div>
  );
}
