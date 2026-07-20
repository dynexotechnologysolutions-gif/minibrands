"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building,
  CreditCard,
  Loader2,
  Zap,
} from "lucide-react";

export default function FinanceDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/finance")
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Finance fetch error:", err);
        setIsLoading(false);
      });
  }, []);

  const downloadReport = () => {
    if (!data?.transactions) return;
    const headers = ["Order ID", "Date", "Seller", "Buyer", "Gross (₹)", "Commission (₹)", "Net Payout (₹)", "Escrow Status"];
    const rows = data.transactions.map((t: any) => [
      t.orderId,
      t.date,
      `"${t.sellerName}"`,
      `"${t.buyerName}"`,
      t.grossAmount,
      t.commissionAmount,
      t.netPayout,
      t.escrowStatus,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finance_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-text-muted text-xs font-medium">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
        <span>Loading finance ledger & escrow analytics...</span>
      </div>
    );
  }

  const s = data?.summary || {};

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border-gray/70">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Financial Telemetry</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">
            Finance, Escrow Ledger & Settlement Reports
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Commission reconciliation, pending merchant payouts, escrow hold funds, and financial compliance.
          </p>
        </div>

        <button
          onClick={downloadReport}
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-extrabold flex items-center gap-2 hover:bg-primary-hover shadow-md shadow-primary/20 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Download Financial Ledger CSV</span>
        </button>
      </div>

      {/* Summary KPI Cards Grid (7 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase text-text-muted">Total GMV</p>
          <h3 className="font-display font-extrabold text-2xl text-on-surface">
            ₹{(s.totalGmv || 0).toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-text-muted">Gross platform volume</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase text-text-muted">Net Revenue (Commission)</p>
          <h3 className="font-display font-extrabold text-2xl text-success-green">
            ₹{(s.commission || 0).toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-text-muted">Velvet Lane gross margin</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase text-text-muted">Pending Escrow</p>
          <h3 className="font-display font-extrabold text-2xl text-accent-yellow">
            ₹{(s.pendingEscrow || 0).toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-text-muted">Held in escrow accounts</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border-gray/70 shadow-xs space-y-1">
          <p className="text-[10px] font-bold uppercase text-text-muted">Released Escrow</p>
          <h3 className="font-display font-extrabold text-2xl text-indigo-600">
            ₹{(s.releasedEscrow || 0).toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-text-muted">Settled to merchant accounts</p>
        </div>
      </div>

      {/* Payout Queue Table */}
      <div className="p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-extrabold text-base text-on-surface">
              Merchant Payout & Escrow Release Queue
            </h3>
            <p className="text-xs text-text-muted">Automated Razorpay payouts scheduled for verified sellers</p>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-gray/60 text-[11px] font-bold text-text-muted uppercase tracking-wider bg-surface-container-lowest">
                <th className="py-3 px-4">Merchant Business</th>
                <th className="py-3 px-4">Bank Status</th>
                <th className="py-3 px-4">Total Released</th>
                <th className="py-3 px-4">Pending Escrow</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-gray/40 text-xs font-medium">
              {(data?.payoutQueue || []).map((p: any, i: number) => (
                <tr key={i} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-on-surface">{p.businessName}</td>
                  <td className="py-3 px-4">
                    {p.bankVerified ? (
                      <span className="text-success-green font-bold text-[11px]">
                        Verified (Last4: {p.bankLast4})
                      </span>
                    ) : (
                      <span className="text-error-red font-bold text-[11px]">Unverified</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-on-surface">₹{p.totalReleasedAmount.toLocaleString("en-IN")}</td>
                  <td className="py-3 px-4 font-bold text-accent-yellow">₹{p.pendingEscrowAmount.toLocaleString("en-IN")}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface-container text-on-surface">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4">
        <h3 className="font-display font-extrabold text-base text-on-surface">
          Transaction Ledger History
        </h3>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-gray/60 text-[11px] font-bold text-text-muted uppercase tracking-wider bg-surface-container-lowest">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Seller</th>
                <th className="py-3 px-4">Gross Amount</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4 text-right">Escrow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-gray/40 text-xs font-medium">
              {(data?.transactions || []).map((t: any) => (
                <tr key={t.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-primary">#{t.orderId.slice(0, 8)}</td>
                  <td className="py-3 px-4 text-on-surface">{t.sellerName}</td>
                  <td className="py-3 px-4 font-bold text-on-surface">₹{t.grossAmount.toLocaleString("en-IN")}</td>
                  <td className="py-3 px-4 text-success-green font-bold">₹{t.commissionAmount.toLocaleString("en-IN")}</td>
                  <td className="py-3 px-4 text-indigo-600 font-bold">₹{t.netPayout.toLocaleString("en-IN")}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface-container text-on-surface">
                      {t.escrowStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
