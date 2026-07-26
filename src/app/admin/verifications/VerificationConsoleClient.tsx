"use client";

import React, { useState } from "react";
import {
  Check,
  X,
  FileText,
  Building2,
  UserCheck,
  CreditCard,
  Eye,
  AlertTriangle,
  Loader2,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";

interface SellerItem {
  id: string;
  businessName: string;
  storeName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  city: string;
  state: string;
  pincode: string;
  panNumber: string;
  panDocUrl: string;
  aadhaarDocUrl: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  chequeDocUrl: string;
  status: string;
  adminNotes: string;
  createdAt: string;
}

interface VerificationConsoleClientProps {
  initialSellers: SellerItem[];
}

export default function VerificationConsoleClient({ initialSellers }: VerificationConsoleClientProps) {
  const [sellers, setSellers] = useState<SellerItem[]>(initialSellers);
  const [selectedSeller, setSelectedSeller] = useState<SellerItem | null>(null);
  
  // Modals / Dialog State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [rejectingSellerId, setRejectingSellerId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING_VERIFICATION");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAction = async (sellerId: string, action: "APPROVE" | "REJECT", reason?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process verification.");
      }

      const data = await res.json();
      
      // Update local state status
      setSellers((prev) =>
        prev.map((s) =>
          s.id === sellerId
            ? { ...s, status: action === "APPROVE" ? "APPROVED" : "REJECTED", adminNotes: reason || "" }
            : s
        )
      );

      triggerToast(
        action === "APPROVE"
          ? "Seller approved successfully! All pending products are now live."
          : "Seller application rejected."
      );
      
      // Reset modals
      setRejectingSellerId(null);
      setRejectionReason("");
      
      if (selectedSeller?.id === sellerId) {
        setSelectedSeller((prev) =>
          prev ? { ...prev, status: action === "APPROVE" ? "APPROVED" : "REJECTED", adminNotes: reason || "" } : null
        );
      }
    } catch (err: any) {
      triggerToast(err.message || "An unexpected error occurred.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter logic
  const filteredSellers = sellers.filter((s) => {
    const matchesFilter = statusFilter === "ALL" || s.status === statusFilter;
    const matchesSearch =
      s.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.businessEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in-up border text-xs font-semibold ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Left Pane: Application List & Filters */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-border-gray shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-border-gray flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search store or email..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-outline-variant focus:border-primary focus:ring-primary/20 rounded-xl text-body-sm focus:outline-none focus:ring-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <Filter className="w-4 h-4 text-text-muted" />
            <select
              className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="PENDING_VERIFICATION">Pending Review</option>
              <option value="DRAFT">Draft Profiles</option>
              <option value="APPROVED">Approved Merchant</option>
              <option value="REJECTED">Rejected Application</option>
              <option value="ALL">All Applications</option>
            </select>
          </div>
        </div>

        {/* List of Applications */}
        <div className="divide-y divide-border-gray overflow-y-auto max-h-[640px]">
          {filteredSellers.length === 0 ? (
            <div className="py-16 text-center text-text-muted flex flex-col items-center">
              <Building2 className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
              <p className="text-body-md font-bold">No seller applications found</p>
              <p className="text-xs mt-1">Try changing the filters or search keywords.</p>
            </div>
          ) : (
            filteredSellers.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedSeller(s)}
                className={`p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                  selectedSeller?.id === s.id ? "bg-indigo-50/40 border-l-4 border-primary" : ""
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-on-surface text-body-md">
                      {s.storeName}
                    </h3>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        s.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : s.status === "PENDING_VERIFICATION"
                          ? "bg-amber-100 text-amber-800 animate-pulse"
                          : s.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {s.status === "PENDING_VERIFICATION" ? "Pending Review" : s.status}
                    </span>
                  </div>
                  <p className="text-text-muted text-xs font-semibold">
                    {s.businessEmail} &bull; {s.city}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    Submitted: {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button className="p-2 hover:bg-white rounded-lg border border-border-gray shadow-xs text-text-muted text-xs font-bold hover:text-primary transition-colors flex items-center gap-1.5 shrink-0">
                  <Eye className="w-4 h-4" />
                  <span>Review</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Right Pane: Side-by-Side Review Details */}
      <div className="lg:col-span-5">
        {selectedSeller ? (
          <div className="bg-white rounded-2xl border border-border-gray shadow-xs overflow-hidden p-6 space-y-6 animate-fade-in-up">
            {/* Header info */}
            <div className="border-b border-border-gray pb-4 flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Merchant Review File</span>
                <h2 className="text-xl font-extrabold text-on-surface mt-1">{selectedSeller.storeName}</h2>
                <p className="text-xs text-text-muted font-semibold mt-0.5">{selectedSeller.businessName}</p>
              </div>
              <span
                className={`text-xs font-bold uppercase px-3 py-1 rounded-lg ${
                  selectedSeller.status === "APPROVED"
                    ? "bg-green-100 text-green-800"
                    : selectedSeller.status === "PENDING_VERIFICATION"
                    ? "bg-amber-100 text-amber-800"
                    : selectedSeller.status === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {selectedSeller.status}
              </span>
            </div>

            {/* Business Contact details */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Business Details</span>
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-border-gray">
                <div>
                  <span className="text-text-muted font-semibold block">Email</span>
                  <span className="text-on-surface font-bold break-all">{selectedSeller.businessEmail}</span>
                </div>
                <div>
                  <span className="text-text-muted font-semibold block">Phone</span>
                  <span className="text-on-surface font-bold">{selectedSeller.businessPhone || "N/A"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-text-muted font-semibold block">Address</span>
                  <span className="text-on-surface font-bold">
                    {selectedSeller.businessAddress ? (
                      <>
                        {selectedSeller.businessAddress}, {selectedSeller.city}, {selectedSeller.state} - {selectedSeller.pincode}
                      </>
                    ) : (
                      "N/A"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Side-by-Side Panel */}
            <div className="space-y-4">
              <div className="border-t border-border-gray pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Identity verification */}
                <div className="space-y-3">
                  <h4 className="font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <UserCheck className="w-4 h-4 text-primary" />
                    <span>Identity Documents</span>
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-border-gray space-y-3.5 text-xs">
                    <div>
                      <span className="text-text-muted font-semibold block">PAN Number</span>
                      <span className="text-on-surface font-mono font-bold tracking-wider">{selectedSeller.panNumber || "N/A"}</span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-text-muted font-semibold block">PAN Document</span>
                      {selectedSeller.panDocUrl ? (
                        <button
                          onClick={() => setPreviewImageUrl(selectedSeller.panDocUrl)}
                          className="w-full flex items-center justify-between gap-2 p-2 bg-white hover:bg-slate-100 rounded-lg border border-border-gray shadow-xs font-bold text-[11px] text-primary transition-colors cursor-pointer"
                        >
                          <span className="truncate">View PAN Card</span>
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-text-muted italic block">No document uploaded</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className="text-text-muted font-semibold block">Aadhaar (Front)</span>
                      {selectedSeller.aadhaarDocUrl ? (
                        <button
                          onClick={() => setPreviewImageUrl(selectedSeller.aadhaarDocUrl)}
                          className="w-full flex items-center justify-between gap-2 p-2 bg-white hover:bg-slate-100 rounded-lg border border-border-gray shadow-xs font-bold text-[11px] text-primary transition-colors cursor-pointer"
                        >
                          <span className="truncate">View Aadhaar Front</span>
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-text-muted italic block">No Front uploaded</span>
                      )}
                    </div>

                    {(selectedSeller as any).aadhaarBackUrl && (
                      <div className="space-y-2">
                        <span className="text-text-muted font-semibold block">Aadhaar (Back)</span>
                        <button
                          onClick={() => setPreviewImageUrl((selectedSeller as any).aadhaarBackUrl)}
                          className="w-full flex items-center justify-between gap-2 p-2 bg-white hover:bg-slate-100 rounded-lg border border-border-gray shadow-xs font-bold text-[11px] text-primary transition-colors cursor-pointer"
                        >
                          <span className="truncate">View Aadhaar Back</span>
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Account */}
                <div className="space-y-3">
                  <h4 className="font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span>Bank Details</span>
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-border-gray space-y-3 text-xs">
                    <div>
                      <span className="text-text-muted font-semibold block">Holder Name</span>
                      <span className="text-on-surface font-bold">{selectedSeller.accountHolderName || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-text-muted font-semibold block">Bank Name</span>
                      <span className="text-on-surface font-bold">{selectedSeller.bankName || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-text-muted font-semibold block">Account Number</span>
                      <span className="text-on-surface font-bold">{selectedSeller.accountNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-text-muted font-semibold block">IFSC Code</span>
                      <span className="text-on-surface font-mono font-bold tracking-wider">{selectedSeller.ifscCode || "N/A"}</span>
                    </div>

                    <div className="space-y-2 pt-1.5">
                      <span className="text-text-muted font-semibold block">Cancelled Cheque</span>
                      {selectedSeller.chequeDocUrl ? (
                        <button
                          onClick={() => setPreviewImageUrl(selectedSeller.chequeDocUrl)}
                          className="w-full flex items-center justify-between gap-2 p-2 bg-white hover:bg-slate-100 rounded-lg border border-border-gray shadow-xs font-bold text-[11px] text-primary transition-colors cursor-pointer"
                        >
                          <span className="truncate">View Cheque image</span>
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-text-muted italic block">No cheque uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection Note Display */}
            {selectedSeller.status === "REJECTED" && selectedSeller.adminNotes && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Rejection Reason:</span>
                </p>
                <p className="mt-1 leading-relaxed font-semibold">{selectedSeller.adminNotes}</p>
              </div>
            )}

            {/* Action Panel Buttons */}
            {selectedSeller.status === "PENDING_VERIFICATION" && (
              <div className="border-t border-border-gray pt-6 flex gap-4">
                <button
                  onClick={() => setRejectingSellerId(selectedSeller.id)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 border border-red-200 hover:bg-red-50 text-red-600 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Reject Application</span>
                </button>

                <button
                  onClick={() => handleAction(selectedSeller.id, "APPROVE")}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                  <span>Approve Merchant</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-24 text-center text-text-muted flex flex-col items-center">
            <HelpCircle className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
            <p className="text-body-md font-bold">No application selected</p>
            <p className="text-xs mt-1">Select a merchant from the list on the left to review documents.</p>
          </div>
        )}
      </div>

      {/* Modal image preview */}
      {previewImageUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-fade-in-up">
          <div className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full max-h-[85vh] flex flex-col relative shadow-2xl border border-white/20">
            <div className="p-4 border-b border-border-gray flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-on-surface text-body-md flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                <span>Document Preview</span>
              </h3>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-text-muted hover:text-on-surface transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-slate-900/5 overflow-y-auto flex items-center justify-center h-full min-h-[300px]">
              <img
                src={previewImageUrl}
                alt="Document Verification preview"
                className="max-h-[50vh] max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
            <div className="p-4 border-t border-border-gray flex justify-end gap-2 bg-slate-50">
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 border border-border-gray hover:bg-white rounded-xl shadow-xs text-xs font-bold text-text-muted hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in New Tab</span>
              </a>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="px-4 py-2 bg-primary hover:opacity-90 text-on-primary text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal Input */}
      {rejectingSellerId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-fade-in-up">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-border-gray">
            <div>
              <h3 className="font-extrabold text-on-surface text-lg">Reject Verification Request</h3>
              <p className="text-text-muted text-xs mt-1">
                Provide a detailed compliance reason. The seller will see this in their dashboard.
              </p>
            </div>

            <textarea
              className="w-full p-3 bg-white border border-outline-variant focus:border-primary focus:ring-primary/20 rounded-xl text-body-sm focus:outline-none focus:ring-2 min-h-[100px]"
              placeholder="e.g. Identity check failed. Aadhaar name does not match bank account name or Cheque image is blurred."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setRejectingSellerId(null);
                  setRejectionReason("");
                }}
                disabled={isSubmitting}
                className="px-4 py-2.5 border border-border-gray hover:bg-slate-50 text-text-muted hover:text-on-surface text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(rejectingSellerId, "REJECT", rejectionReason)}
                disabled={isSubmitting || !rejectionReason.trim()}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                <span>Confirm Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
