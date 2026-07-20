"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Store,
  User,
  ShieldCheck,
  DollarSign,
  Package,
  ShoppingBag,
  RotateCcw,
  Star,
  Building,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { suspendUserAction } from "@/actions/admin-actions";

export default function SellerDetailPage() {
  const params = useParams();
  const sellerId = params?.sellerId as string;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!sellerId) return;
    fetch(`/api/admin/sellers/${sellerId}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData.seller || null);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Seller detail error:", err);
        setIsLoading(false);
      });
  }, [sellerId]);

  const handleToggleSuspend = async () => {
    if (!data?.ownerDetails?.id) return;
    const currentStatus = data.ownerDetails.isSuspended;

    const res = await suspendUserAction(
      data.ownerDetails.id,
      !currentStatus,
      !currentStatus ? "Suspended via Admin Seller Profile Control." : undefined
    );

    if (res.success) {
      setData((prev: any) => ({
        ...prev,
        ownerDetails: {
          ...prev.ownerDetails,
          isSuspended: !currentStatus,
        },
      }));
      setToast({ type: "success", message: res.data?.message || "Account status updated." });
    } else {
      setToast({ type: "error", message: res.error?.message || "Action failed." });
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-text-muted text-xs font-medium">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
        <span>Loading merchant profile...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-text-muted text-xs font-medium">
        Merchant profile not found.
      </div>
    );
  }

  const s = data.storeInfo;
  const o = data.ownerDetails;
  const v = data.verificationHistory;
  const f = data.financials;

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Toast */}
      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
            toast.type === "success"
              ? "bg-success-green/10 text-success-green border-success-green/30"
              : "bg-error-red/10 text-error-red border-error-red/30"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Back Link */}
      <Link
        href="/admin/sellers"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-on-surface transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Sellers Directory</span>
      </Link>

      {/* Profile Header Banner */}
      <div className="bg-surface p-6 rounded-3xl border border-border-gray/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white font-extrabold flex items-center justify-center text-xl shadow-md">
            {s.businessName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-2xl text-on-surface">
                {s.businessName}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  v?.kycStatus === "approved"
                    ? "bg-success-green/10 text-success-green border-success-green/30"
                    : "bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30"
                }`}
              >
                {v?.kycStatus || "PENDING"}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Store: {s.storeName} • Category: {s.category} • City: {s.city}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSuspend}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              o.isSuspended
                ? "bg-success-green text-white hover:bg-green-700"
                : "bg-error-red/10 text-error-red border border-error-red/30 hover:bg-error-red hover:text-white"
            }`}
          >
            {o.isSuspended ? "Unsuspend Account" : "Suspend Account"}
          </button>
        </div>
      </div>

      {/* Financials & Trust Score Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total GMV</p>
          <h3 className="font-display font-extrabold text-2xl text-on-surface">
            ₹{f.totalGmv.toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-text-muted">Gross sales processed</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Commission Paid</p>
          <h3 className="font-display font-extrabold text-2xl text-success-green">
            ₹{f.totalCommission.toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-text-muted">Platform take-rate earned</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Pending Escrow</p>
          <h3 className="font-display font-extrabold text-2xl text-accent-yellow">
            ₹{f.escrowBalance.toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-text-muted">Held awaiting delivery</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Trust Score</p>
          <h3 className="font-display font-extrabold text-2xl text-primary">
            {v?.trustScore || 0}%
          </h3>
          <p className="text-[11px] text-text-muted">Automated reliability rating</p>
        </div>
      </div>

      {/* Tabs / Multi-Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Owner & Verification Info */}
        <div className="p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4">
          <h3 className="font-display font-extrabold text-base text-on-surface flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span>Owner & Compliance Details</span>
          </h3>

          <div className="text-xs space-y-2 text-on-surface font-medium">
            <div className="p-3 rounded-xl bg-surface-container-low flex justify-between">
              <span className="text-text-muted">Owner Name:</span>
              <span className="font-bold">{o.name}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low flex justify-between">
              <span className="text-text-muted">Owner Email:</span>
              <span className="font-bold">{o.email}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low flex justify-between">
              <span className="text-text-muted">Signzy Reference:</span>
              <span className="font-mono font-bold text-primary">{v?.signzyReferenceId || "MANUAL_VERIFIED"}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low flex justify-between">
              <span className="text-text-muted">Bank Verified:</span>
              <span className={v?.bankVerified ? "text-success-green font-bold" : "text-error-red font-bold"}>
                {v?.bankVerified ? `YES (Last4: ${v.bankAccountLast4})` : "UNVERIFIED"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low flex justify-between">
              <span className="text-text-muted">Razorpay Fund Account:</span>
              <span className="font-mono font-bold text-secondary">{s.razorpayFundAccountId || "NOT_LINKED"}</span>
            </div>
          </div>
        </div>

        {/* Products List Preview */}
        <div className="p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4">
          <h3 className="font-display font-extrabold text-base text-on-surface flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span>Products ({data.products.length})</span>
          </h3>

          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {data.products.map((p: any) => (
              <div key={p.id} className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-on-surface">{p.name}</p>
                  <p className="text-[10px] text-text-muted">Stock: {p.stockCount} • Price: ₹{p.price}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${p.isPublished ? "bg-success-green/10 text-success-green" : "bg-error-red/10 text-error-red"}`}>
                  {p.isPublished ? "Published" : "Draft"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
