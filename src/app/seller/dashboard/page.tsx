import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  Plus, 
  Package, 
  Globe, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  Store,
  TrendingUp,
  Award
} from "lucide-react";

export const metadata = {
  title: "Seller Dashboard | Velvet Lane",
  description: "Manage your independent fashion brand catalog, stock, and verification status on Velvet Lane.",
};

export default async function SellerDashboardPage() {
  // 1. Session verification
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login?role=seller");
  }

  // 2. Fetch User Profile, Seller verification details, and Product statistics
  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      seller: {
        include: {
          verification: true,
          products: {
            where: {
              isDeleted: false,
            },
            include: {
              variants: true,
            },
          },
        },
      },
    },
  });

  if (!userProfile || userProfile.role !== "SELLER" || !userProfile.seller) {
    redirect("/login?role=seller");
  }

  const seller = userProfile.seller;
  const verification = seller.verification;
  const products = seller.products || [];

  // Calculate statistics
  const totalProducts = products.length;
  const activeListings = products.filter((p) => p.isPublished).length;
  const drafts = totalProducts - activeListings;
  const totalInventory = products.reduce(
    (sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.stockCount, 0),
    0
  );

  const trustScore = verification?.trustScore || 0;
  const isKycVerified =
    verification &&
    (verification.kycStatus === "auto_approved" || verification.kycStatus === "approved");
  const isBankVerified = verification?.bankVerified || false;

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto space-y-10">
      {/* Dashboard Greeting Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 id="dashboard-title" className="text-3xl font-extrabold font-display text-slate-950 tracking-tight">
            Welcome back, {seller.businessName}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Brand Category: <span className="font-semibold text-slate-800">{seller.category}</span> &bull; Location: <span className="font-semibold text-slate-800">{seller.city}</span>
          </p>
        </div>

        <Link
          href={`/sellers/${seller.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all shadow-sm"
        >
          <Store className="w-4 h-4" />
          <span>View Public Storefront</span>
        </Link>
      </header>

      {/* Trust & Verification Status Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Trust Score Card */}
        <div className="glass-panel bg-white/80 rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Velvet Trust Score
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{trustScore}</span>
              <span className="text-xs text-slate-400 font-semibold">/ 100</span>
            </div>
          </div>
        </div>

        {/* KYC Verification Card */}
        <div className="glass-panel bg-white/80 rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner shrink-0 ${
            isKycVerified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
          }`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Identity KYC Status
            </span>
            <span className={`text-sm font-extrabold block mt-1 ${
              isKycVerified ? "text-emerald-700" : "text-amber-700"
            }`}>
              {isKycVerified ? "Verified (e-KYC)" : "Pending Review"}
            </span>
          </div>
        </div>

        {/* Bank Account Verification Card */}
        <div className="glass-panel bg-white/80 rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner shrink-0 ${
            isBankVerified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
          }`}>
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Settlements Bank
            </span>
            <span className={`text-sm font-extrabold block mt-1 ${
              isBankVerified ? "text-emerald-700" : "text-amber-700"
            }`}>
              {isBankVerified ? `Linked Account (...${verification?.bankAccountLast4})` : "Bank Account Not Linked"}
            </span>
          </div>
        </div>
      </section>

      {/* Catalog Quick Stats */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Background Decorative Gradients */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-lg font-bold font-display text-slate-100">Catalog Summary</h2>
            <p className="text-slate-400 text-xs mt-0.5">Stock summary and active listing tracking.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 pt-4">
            <div className="border-l-2 border-indigo-500 pl-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Products</span>
              <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">{totalProducts}</span>
            </div>
            <div className="border-l-2 border-emerald-500 pl-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live Listings</span>
              <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">{activeListings}</span>
            </div>
            <div className="border-l-2 border-amber-500 pl-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Draft Items</span>
              <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">{drafts}</span>
            </div>
            <div className="border-l-2 border-pink-500 pl-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Inventory Stock</span>
              <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">{totalInventory}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Action Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manage Products Card */}
        <Link
          href="/seller/products"
          className="group glass-panel bg-white hover:bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex justify-between items-start"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Package className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="font-extrabold font-display text-slate-900 group-hover:text-indigo-600 transition-colors text-base sm:text-lg">
                Manage Catalog List
              </h3>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed max-w-sm">
                View, publish, unpublish, edit size-variant inventory, or soft-delete products in your brand store catalog.
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Add Product Card */}
        <Link
          href="/seller/products/new"
          className="group glass-panel bg-white hover:bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex justify-between items-start"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Plus className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="font-extrabold font-display text-slate-900 group-hover:text-indigo-600 transition-colors text-base sm:text-lg">
                Add New Product
              </h3>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed max-w-sm">
                Onboard images directly to Cloudinary and use our Claude/Llama vision copywriting wizard to suggest name, tags, and pricing.
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </section>
    </main>
  );
}
