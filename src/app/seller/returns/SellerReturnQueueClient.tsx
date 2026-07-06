"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ReturnRequestStatus, InspectionResult } from "@prisma/client";
import { updateReturnRequestStatusAction } from "@/modules/returns/actions/return.actions";
import {
  RotateCcw,
  CheckCircle,
  Truck,
  AlertCircle,
  Search,
  CheckCircle2,
  X,
  FileText,
  PackageCheck,
  ShieldCheck,
  DollarSign
} from "lucide-react";

interface ReturnItemData {
  id: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

interface ReturnEvidenceData {
  id: string;
  url: string;
  type: string;
}

interface ReturnRecord {
  id: string;
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  buyerAbuseScore: number;
  status: ReturnRequestStatus;
  reason: string;
  comment: string | null;
  refundMethod: string;
  refundAmount: number;
  pickupCourier: string | null;
  pickupTrackingId: string | null;
  pickupDate: string | null;
  inspectionNotes: string | null;
  inspectionResult: InspectionResult;
  restockDecision: boolean | null;
  createdAt: string;
  items: ReturnItemData[];
  evidence: ReturnEvidenceData[];
  refund: { id: string; razorpayRefundId: string | null; amount: number; status: string } | null;
}

interface SellerReturnQueueClientProps {
  returns: ReturnRecord[];
}

export default function SellerReturnQueueClient({ returns }: SellerReturnQueueClientProps) {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReturn, setSelectedReturn] = useState<ReturnRecord | null>(null);

  // Modal Action States
  const [actionNotes, setActionNotes] = useState("");
  const [courierName, setCourierName] = useState("Delhivery Logistics");
  const [trackingId, setTrackingId] = useState("");
  const [inspectionResult, setInspectionResult] = useState<InspectionResult>(InspectionResult.PASSED);
  const [restockDecision, setRestockDecision] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredReturns = returns.filter((r) => {
    // Tab filtering
    if (activeTab === "PENDING" && !(r.status === "RETURN_REQUESTED" || r.status === "SELLER_REVIEW")) return false;
    if (activeTab === "PICKUP" && !["APPROVED", "PICKUP_SCHEDULED", "PICKED_UP", "IN_TRANSIT"].includes(r.status)) return false;
    if (activeTab === "INSPECTION" && !(r.status === "DELIVERED_TO_SELLER" || r.status === "UNDER_INSPECTION")) return false;
    if (activeTab === "COMPLETED" && !["REFUNDED", "RETURN_COMPLETED", "REFUND_APPROVED"].includes(r.status)) return false;
    if (activeTab === "REJECTED" && !["REJECTED", "CANCELLED"].includes(r.status)) return false;

    // Search query filtering
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.orderId.toLowerCase().includes(q) ||
      r.buyerName.toLowerCase().includes(q) ||
      r.buyerEmail.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q)
    );
  });

  const handleAction = async (targetStatus: ReturnRequestStatus) => {
    if (!selectedReturn) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const payload: any = {
        returnRequestId: selectedReturn.id,
        status: targetStatus,
        comment: actionNotes,
      };

      if (targetStatus === ReturnRequestStatus.APPROVED) {
        payload.pickupCourier = courierName;
        payload.pickupTrackingId = trackingId || `DLV-${Math.floor(1000000 + Math.random() * 9000000)}`;
      }

      if (targetStatus === ReturnRequestStatus.REFUND_APPROVED) {
        payload.inspectionNotes = actionNotes;
        payload.inspectionResult = inspectionResult;
        payload.restockDecision = restockDecision;
      }

      const response = await updateReturnRequestStatusAction(payload);

      if (response.success) {
        setSelectedReturn(null);
        window.location.reload();
      } else {
        setActionError(response.error?.message || "Failed to execute action.");
      }
    } catch {
      setActionError("An error occurred executing action.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-lg">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-base border-b border-border-gray/40 pb-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface">
            Returns & RMA Queue Management
          </h1>
          <p className="text-body-sm text-text-muted mt-0.5">
            Review customer return requests, inspect evidence, authorize iCarry pickups, and approve Razorpay refunds.
          </p>
        </div>

        <Link
          href="/seller/dashboard"
          className="px-lg py-2 border border-border-gray rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container transition-colors self-start"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-base bg-surface-container-lowest border border-border-gray p-base rounded-xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search return ID, order #, buyer..."
            className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border-gray rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            suppressHydrationWarning
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar w-full sm:w-auto">
          {[
            { id: "ALL", label: "All Returns", count: returns.length },
            { id: "PENDING", label: "Pending Review", count: returns.filter((r) => r.status === "RETURN_REQUESTED" || r.status === "SELLER_REVIEW").length },
            { id: "PICKUP", label: "Pickup & Transit", count: returns.filter((r) => ["APPROVED", "PICKUP_SCHEDULED", "PICKED_UP", "IN_TRANSIT"].includes(r.status)).length },
            { id: "INSPECTION", label: "Needs Inspection", count: returns.filter((r) => r.status === "DELIVERED_TO_SELLER" || r.status === "UNDER_INSPECTION").length },
            { id: "COMPLETED", label: "Refunded / Complete", count: returns.filter((r) => ["REFUNDED", "RETURN_COMPLETED", "REFUND_APPROVED"].includes(r.status)).length },
            { id: "REJECTED", label: "Rejected", count: returns.filter((r) => ["REJECTED", "CANCELLED"].includes(r.status)).length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                suppressHydrationWarning
                className={`px-3 py-1.5 rounded-full font-label-bold text-xs whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-primary text-on-primary font-bold shadow-xs"
                    : "bg-surface border border-border-gray hover:bg-surface-container-low text-text-muted"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-surface-container text-text-muted"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Returns Queue Table */}
      {filteredReturns.length === 0 ? (
        <div className="py-xxl text-center bg-surface-container-lowest border border-border-gray rounded-2xl p-xl max-w-[540px] w-full mx-auto shadow-xs space-y-md">
          <div className="w-16 h-16 bg-surface-container text-text-muted rounded-full flex items-center justify-center mx-auto">
            <RotateCcw className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-on-surface">No Return Requests Found</h2>
            <p className="text-text-muted text-xs mt-1 leading-relaxed">
              There are currently no customer return requests matching this category filter.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-base">
          {filteredReturns.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest border border-border-gray rounded-2xl p-base sm:p-lg space-y-md shadow-xs hover:border-border-gray/80 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-base border-b border-border-gray/50 pb-sm">
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface flex items-center gap-2 flex-wrap">
                    <span>Return ID:</span>
                    <span className="font-mono font-extrabold text-xs">#{item.id.slice(0, 8).toUpperCase()}</span>
                    <span>&bull;</span>
                    <span className="text-text-muted font-normal">Order #{item.orderId.slice(0, 8).toUpperCase()}</span>
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Buyer: <span className="font-bold text-on-surface">{item.buyerName}</span> ({item.buyerEmail}) &bull; Abuse Risk:{" "}
                    <span className={`font-bold ${item.buyerAbuseScore > 0.4 ? "text-error-red" : "text-success-green"}`}>
                      {(item.buyerAbuseScore * 100).toFixed(0)}%
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-md">
                  <span
                    className="px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider bg-surface-container text-on-surface border border-border-gray"
                  >
                    {item.status.replace(/_/g, " ")}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedReturn(item);
                      setActionNotes("");
                      setActionError(null);
                    }}
                    className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    Action Return
                  </button>
                </div>
              </div>

              {/* Items & Reason */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-base items-center">
                <div className="md:col-span-8 space-y-1.5">
                  <p className="text-xs font-bold text-secondary">
                    Reason: <span className="text-on-surface font-semibold">{item.reason.replace(/_/g, " ")}</span>
                  </p>
                  {item.comment && <p className="text-xs text-text-muted italic">&ldquo;{item.comment}&rdquo;</p>}

                  <div className="flex gap-sm flex-wrap pt-xs">
                    {item.items.map((i) => (
                      <div key={i.id} className="flex items-center gap-xs text-xs border border-border-gray/60 p-1.5 rounded-lg bg-surface-container-low">
                        <img src={i.image} alt={i.name} className="w-8 h-8 object-cover rounded-md" />
                        <span className="font-bold text-on-surface">{i.name}</span>
                        <span className="text-text-muted font-medium">(Qty: {i.quantity})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-4 text-left md:text-right">
                  <p className="text-xs text-text-muted font-medium">Refund Amount</p>
                  <p className="text-2xl font-black text-success-green">
                    ₹{(item.refundAmount / 100).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-base overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-2xl p-base sm:p-lg max-w-[640px] w-full space-y-md shadow-2xl my-xl border border-border-gray">
            <div className="flex items-center justify-between border-b border-border-gray pb-sm">
              <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
                Process Return #{selectedReturn.id.slice(0, 8).toUpperCase()}
              </h3>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-text-muted hover:text-on-surface p-1 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-error-red/10 text-error-red rounded-xl font-bold text-xs border border-error-red/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Buyer Evidence Preview */}
            {selectedReturn.evidence.length > 0 && (
              <div className="space-y-1.5">
                <p className="font-bold text-xs uppercase tracking-wider text-text-muted">Uploaded Evidence Photos</p>
                <div className="flex gap-sm flex-wrap">
                  {selectedReturn.evidence.map((ev) => (
                    <a key={ev.id} href={ev.url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-xl border border-border-gray overflow-hidden">
                      <img src={ev.url} alt="Evidence" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Approval Controls */}
            {selectedReturn.status === "RETURN_REQUESTED" && (
              <div className="space-y-md border-t border-border-gray pt-md">
                <p className="font-bold text-sm text-on-surface">1. Approve Request & Authorize Pickup</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-base">
                  <div className="space-y-1">
                    <label className="block font-bold text-xs uppercase tracking-wider text-text-muted">Courier Partner</label>
                    <input
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full p-2.5 border border-border-gray rounded-xl text-body-sm font-bold bg-surface text-on-surface"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-xs uppercase tracking-wider text-text-muted">Tracking / AWB Number</label>
                    <input
                      type="text"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      placeholder="e.g. DLV-98765432"
                      className="w-full p-2.5 border border-border-gray rounded-xl text-body-sm font-bold bg-surface text-on-surface"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-xs uppercase tracking-wider text-text-muted">Approval Notes (Optional)</label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={2}
                    placeholder="Provide pickup instructions to buyer..."
                    className="w-full p-2.5 border border-border-gray rounded-xl text-body-sm bg-surface text-on-surface"
                  />
                </div>

                <div className="flex justify-end gap-base pt-sm border-t border-border-gray">
                  <button
                    onClick={() => handleAction(ReturnRequestStatus.REJECTED)}
                    disabled={isProcessing}
                    className="px-lg py-2 bg-error-red text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Reject Return
                  </button>
                  <button
                    onClick={() => handleAction(ReturnRequestStatus.APPROVED)}
                    disabled={isProcessing}
                    className="px-lg py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    Approve Return & Authorize Pickup
                  </button>
                </div>
              </div>
            )}

            {/* Inspection Controls */}
            {(selectedReturn.status === "DELIVERED_TO_SELLER" || selectedReturn.status === "UNDER_INSPECTION") && (
              <div className="space-y-md border-t border-border-gray pt-md">
                <p className="font-bold text-sm text-on-surface">2. Warehouse Inspection & Refund Trigger</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-base">
                  <div className="space-y-1">
                    <label className="block font-bold text-xs uppercase tracking-wider text-text-muted">Inspection Outcome</label>
                    <select
                      value={inspectionResult}
                      onChange={(e) => setInspectionResult(e.target.value as InspectionResult)}
                      className="w-full p-2.5 border border-border-gray rounded-xl text-body-sm bg-surface font-bold text-on-surface"
                    >
                      <option value={InspectionResult.PASSED}>Inspection Passed (Item Intact)</option>
                      <option value={InspectionResult.FAILED}>Inspection Failed (Damaged / Used)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-xs uppercase tracking-wider text-text-muted">Restock Inventory?</label>
                    <select
                      value={restockDecision ? "yes" : "no"}
                      onChange={(e) => setRestockDecision(e.target.value === "yes")}
                      className="w-full p-2.5 border border-border-gray rounded-xl text-body-sm bg-surface font-bold text-on-surface"
                    >
                      <option value="yes">Yes - Restock +1 to Stock Count</option>
                      <option value="no">No - Item Damaged / Non-sellable</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-xs uppercase tracking-wider text-text-muted">Inspection Remarks</label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={2}
                    placeholder="Inspection verification notes..."
                    className="w-full p-2.5 border border-border-gray rounded-xl text-body-sm bg-surface text-on-surface"
                  />
                </div>

                <div className="flex justify-end gap-base pt-sm border-t border-border-gray">
                  <button
                    onClick={() => handleAction(ReturnRequestStatus.REJECTED)}
                    disabled={isProcessing}
                    className="px-lg py-2 bg-error-red text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Fail Inspection & Reject Refund
                  </button>
                  <button
                    onClick={() => handleAction(ReturnRequestStatus.REFUND_APPROVED)}
                    disabled={isProcessing}
                    className="px-lg py-2 bg-success-green text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    Pass Inspection & Trigger Razorpay Refund
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
