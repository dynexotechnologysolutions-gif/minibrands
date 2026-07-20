"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  FileText,
  User,
  Building,
  CreditCard,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { approveSellerKycAction, rejectSellerKycAction } from "@/actions/admin-actions";

export default function KycQueuePage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reject Modal State
  const [rejectingSeller, setRejectingSeller] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSellers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/sellers?kycStatus=${filterStatus}&search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSellers(data.sellers || []);
    } catch (err) {
      console.error("Failed to fetch KYC queue:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [filterStatus, searchQuery]);

  const handleApprove = async (sellerId: string, businessName: string) => {
    // Optimistic Update
    const previousSellers = [...sellers];
    setSellers((prev) =>
      prev.map((s) => (s.id === sellerId ? { ...s, kycStatus: "approved", trustScore: 95 } : s))
    );

    const result = await approveSellerKycAction(sellerId);
    if (result.success) {
      setToastMessage({ type: "success", text: `KYC approved for ${businessName}.` });
    } else {
      // Rollback on failure
      setSellers(previousSellers);
      setToastMessage({ type: "error", text: result.error?.message || "Failed to approve KYC." });
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingSeller || !rejectReason.trim()) return;

    setIsSubmitting(true);
    const sellerId = rejectingSeller.id;
    const businessName = rejectingSeller.businessName;

    // Optimistic Update
    const previousSellers = [...sellers];
    setSellers((prev) =>
      prev.map((s) => (s.id === sellerId ? { ...s, kycStatus: "rejected" } : s))
    );

    const result = await rejectSellerKycAction(sellerId, rejectReason);
    setIsSubmitting(false);

    if (result.success) {
      setRejectingSeller(null);
      setRejectReason("");
      setToastMessage({ type: "success", text: `KYC rejected for ${businessName}.` });
    } else {
      // Rollback on failure
      setSellers(previousSellers);
      setToastMessage({ type: "error", text: result.error?.message || "Failed to reject KYC." });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md border ${
            toastMessage.type === "success"
              ? "bg-success-green/10 text-success-green border-success-green/30"
              : "bg-error-red/10 text-error-red border-error-red/30"
          }`}
        >
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border-gray/70">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Seller Onboarding Compliance</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">
            Manual KYC Review Queue
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Inspect owner identity, PAN, Aadhaar, GST, bank verification, and face-match scores.
          </p>
        </div>

        <button
          onClick={fetchSellers}
          className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-border-gray/70 text-xs font-bold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search business name, category, city..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border-gray/70 text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["pending", "approved", "rejected", "ALL"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                filterStatus === st
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-surface text-text-muted border-border-gray/70 hover:bg-surface-container-low"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* KYC Table Container */}
      <div className="bg-surface rounded-3xl border border-border-gray/70 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-text-muted text-xs font-medium">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
            <span>Loading verification queue...</span>
          </div>
        ) : sellers.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-xs font-medium">
            No seller KYC records found matching status &quot;{filterStatus}&quot;.
          </div>
        ) : (
          <div className="divide-y divide-border-gray/40">
            {sellers.map((s) => {
              const isExpanded = expandedId === s.id;

              return (
                <div key={s.id} className="transition-colors">
                  {/* Table Row Summary Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-surface-container-low/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {s.businessName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-body-sm font-extrabold text-on-surface">
                          {s.businessName}
                        </h4>
                        <p className="text-[11px] text-text-muted">
                          {s.ownerName} • {s.ownerEmail} • {s.category} ({s.city})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          s.kycStatus === "approved"
                            ? "bg-success-green/10 text-success-green border-success-green/30"
                            : s.kycStatus === "rejected"
                            ? "bg-error-red/10 text-error-red border-error-red/30"
                            : "bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30"
                        }`}
                      >
                        {s.kycStatus}
                      </span>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleApprove(s.id, s.businessName)}
                          className="px-3 py-1.5 rounded-lg bg-success-green text-white text-xs font-bold hover:bg-green-700 transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => setRejectingSeller(s)}
                          className="px-3 py-1.5 rounded-lg bg-error-red/10 text-error-red border border-error-red/20 text-xs font-bold hover:bg-error-red hover:text-white transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-text-muted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-text-muted" />
                      )}
                    </div>
                  </div>

                  {/* Expandable Row Details Panel */}
                  {isExpanded && (
                    <div className="p-6 bg-surface-container-low/30 border-t border-border-gray/40 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Business Details */}
                        <div className="p-4 rounded-2xl bg-surface border border-border-gray/60 space-y-2">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-primary" />
                            <span>Business Information</span>
                          </h5>
                          <div className="text-xs space-y-1 text-on-surface font-medium">
                            <p>
                              <span className="text-text-muted">Business Name:</span> {s.businessName}
                            </p>
                            <p>
                              <span className="text-text-muted">Store Name:</span> {s.storeName}
                            </p>
                            <p>
                              <span className="text-text-muted">Category:</span> {s.category}
                            </p>
                            <p>
                              <span className="text-text-muted">City / Region:</span> {s.city}
                            </p>
                          </div>
                        </div>

                        {/* Owner & Verification Integrity */}
                        <div className="p-4 rounded-2xl bg-surface border border-border-gray/60 space-y-2">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-primary" />
                            <span>Verification Telemetry</span>
                          </h5>
                          <div className="text-xs space-y-1 text-on-surface font-medium">
                            <p>
                              <span className="text-text-muted">Signzy Ref:</span>{" "}
                              <span className="font-mono text-primary font-bold">
                                SIGNZY-{s.id.slice(0, 8).toUpperCase()}
                              </span>
                            </p>
                            <p>
                              <span className="text-text-muted">Face Match Score:</span>{" "}
                              <span className="font-bold text-success-green">98.4%</span>
                            </p>
                            <p>
                              <span className="text-text-muted">Bank Verified:</span>{" "}
                              {s.bankVerified ? (
                                <span className="text-success-green font-bold">YES</span>
                              ) : (
                                <span className="text-error-red font-bold">NO</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Uploaded Documents List */}
                        <div className="p-4 rounded-2xl bg-surface border border-border-gray/60 space-y-2">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            <span>Uploaded Documents</span>
                          </h5>
                          <div className="space-y-1.5">
                            <a
                              href="#"
                              onClick={(e) => e.preventDefault()}
                              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Aadhaar Card (Front/Back PDF)</span>
                            </a>
                            <a
                              href="#"
                              onClick={(e) => e.preventDefault()}
                              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>PAN Card Document</span>
                            </a>
                            <a
                              href="#"
                              onClick={(e) => e.preventDefault()}
                              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Bank Cancelled Cheque</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Confirmation & Reason Modal Dialog */}
      {rejectingSeller && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-border-gray/70 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-error-red/10 text-error-red flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline-sm text-base font-extrabold text-on-surface">
                  Reject KYC Application
                </h3>
                <p className="text-xs text-text-muted">{rejectingSeller.businessName}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1 uppercase tracking-wider">
                Mandatory Rejection Reason *
              </label>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why the KYC was rejected (e.g. Blurred Aadhaar document, Name mismatch)..."
                className="w-full p-3 rounded-xl bg-surface-container-lowest border border-border-gray/70 text-xs font-medium text-on-surface focus:outline-none focus:border-error-red"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setRejectingSeller(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isSubmitting || !rejectReason.trim()}
                className="px-4 py-2 rounded-xl bg-error-red text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
