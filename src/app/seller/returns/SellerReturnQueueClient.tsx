"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ReturnRequestStatus, InspectionResult } from "@prisma/client";
import { updateReturnRequestStatusAction } from "@/modules/returns/actions/return.actions";
import HomeHeader from "@/components/home/HomeHeader";

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
    if (activeTab === "ALL") return true;
    if (activeTab === "PENDING") return r.status === "RETURN_REQUESTED" || r.status === "SELLER_REVIEW";
    if (activeTab === "PICKUP") return ["APPROVED", "PICKUP_SCHEDULED", "PICKED_UP", "IN_TRANSIT"].includes(r.status);
    if (activeTab === "INSPECTION") return r.status === "DELIVERED_TO_SELLER" || r.status === "UNDER_INSPECTION";
    if (activeTab === "COMPLETED") return r.status === "REFUNDED" || r.status === "RETURN_COMPLETED" || r.status === "REFUND_APPROVED";
    if (activeTab === "REJECTED") return r.status === "REJECTED" || r.status === "CANCELLED";
    return true;
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
    } catch (err: any) {
      setActionError("An error occurred executing action.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-lg">
      <HomeHeader />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-border-gray pb-md pt-md">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface">
            Seller Returns & RMA Management
          </h1>
          <p className="text-body-sm text-text-muted">
            Inspect customer return requests, schedule pickups, and approve refunds.
          </p>
        </div>

        <Link
          href="/seller/dashboard"
          className="px-md py-xs border border-border-gray rounded text-body-sm font-bold text-primary hover:bg-surface-container self-start"
        >
          ← Seller Dashboard
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-xs border-b border-border-gray overflow-x-auto pb-xs">
        {[
          { id: "ALL", label: "All Returns", count: returns.length },
          { id: "PENDING", label: "Pending Review", count: returns.filter((r) => r.status === "RETURN_REQUESTED" || r.status === "SELLER_REVIEW").length },
          { id: "PICKUP", label: "Pickup & Transit", count: returns.filter((r) => ["APPROVED", "PICKUP_SCHEDULED", "PICKED_UP", "IN_TRANSIT"].includes(r.status)).length },
          { id: "INSPECTION", label: "Needs Inspection", count: returns.filter((r) => r.status === "DELIVERED_TO_SELLER" || r.status === "UNDER_INSPECTION").length },
          { id: "COMPLETED", label: "Refunded / Complete", count: returns.filter((r) => r.status === "REFUNDED" || r.status === "RETURN_COMPLETED").length },
          { id: "REJECTED", label: "Rejected", count: returns.filter((r) => r.status === "REJECTED").length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-md py-xs font-label-bold text-label-bold rounded-t text-body-sm whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "bg-primary text-on-primary"
                : "text-secondary hover:bg-surface-container-low"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Returns Queue Table */}
      {filteredReturns.length === 0 ? (
        <div className="py-xxl text-center bg-white border border-border-gray rounded p-xl space-y-sm">
          <span className="material-symbols-outlined text-4xl text-border-gray">assignment_turned_in</span>
          <p className="font-headline-sm text-headline-sm text-on-surface">No Return Requests Found</p>
          <p className="text-body-sm text-text-muted">There are currently no return requests matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-md">
          {filteredReturns.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-border-gray rounded p-lg space-y-md shadow-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-border-gray/40 pb-sm">
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface">
                    Return ID: <span className="font-mono">{item.id.slice(0, 8)}</span> • Order #{item.orderId.slice(0, 8)}
                  </p>
                  <p className="text-body-sm text-text-muted">
                    Buyer: <span className="font-bold text-on-surface">{item.buyerName}</span> ({item.buyerEmail}) • Risk Score:{" "}
                    <span className={`font-bold ${item.buyerAbuseScore > 0.4 ? "text-error" : "text-success-green"}`}>
                      {(item.buyerAbuseScore * 100).toFixed(0)}%
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-md">
                  <span
                    className="px-md py-xs rounded-full font-bold text-xs uppercase tracking-wider bg-surface-container text-primary border border-border-gray"
                  >
                    {item.status.replace(/_/g, " ")}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedReturn(item);
                      setActionNotes("");
                      setActionError(null);
                    }}
                    className="px-md py-xs bg-primary text-on-primary font-bold text-body-sm rounded hover:opacity-90 cursor-pointer"
                  >
                    Action Request
                  </button>
                </div>
              </div>

              {/* Items & Reason */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-md items-center">
                <div className="md:col-span-8 space-y-xs">
                  <p className="text-body-sm font-bold text-secondary">
                    Reason: <span className="text-on-surface">{item.reason.replace(/_/g, " ")}</span>
                  </p>
                  {item.comment && <p className="text-body-sm text-text-muted italic">"{item.comment}"</p>}

                  <div className="flex gap-md flex-wrap pt-xs">
                    {item.items.map((i) => (
                      <div key={i.id} className="flex items-center gap-xs text-body-sm border border-border-gray/40 p-xs rounded bg-surface-container-low">
                        <img src={i.image} alt={i.name} className="w-8 h-8 object-cover rounded" />
                        <span className="font-bold">{i.name}</span>
                        <span className="text-text-muted">(Qty: {i.quantity})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-4 text-left md:text-right">
                  <p className="text-body-sm text-text-muted">Refund Amount</p>
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-base overflow-y-auto">
          <div className="bg-white rounded-lg p-lg max-w-2xl w-full space-y-md shadow-xl my-xl">
            <div className="flex items-center justify-between border-b border-border-gray pb-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Action Return Request #{selectedReturn.id.slice(0, 8)}
              </h3>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-text-muted hover:text-on-surface text-xl font-bold"
              >
                ×
              </button>
            </div>

            {actionError && (
              <div className="p-sm bg-error-container text-error rounded font-bold text-body-sm border border-error/20">
                {actionError}
              </div>
            )}

            {/* Buyer Evidence Preview */}
            {selectedReturn.evidence.length > 0 && (
              <div className="space-y-xs">
                <p className="font-label-bold text-label-bold text-secondary">Uploaded Evidence Photos</p>
                <div className="flex gap-sm flex-wrap">
                  {selectedReturn.evidence.map((ev) => (
                    <a key={ev.id} href={ev.url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded border border-border-gray overflow-hidden">
                      <img src={ev.url} alt="Evidence" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Approval Controls */}
            {selectedReturn.status === "RETURN_REQUESTED" && (
              <div className="space-y-md border-t border-border-gray pt-md">
                <p className="font-bold text-body-md text-on-surface">1. Approve Request & Schedule Pickup</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  <div>
                    <label className="block font-bold text-body-sm text-secondary">Courier Partner</label>
                    <input
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full p-sm border border-border-gray rounded text-body-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-body-sm text-secondary">Tracking / AWB Number</label>
                    <input
                      type="text"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      placeholder="e.g. DLV-98765432"
                      className="w-full p-sm border border-border-gray rounded text-body-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-body-sm text-secondary">Approval Notes (Optional)</label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={2}
                    placeholder="Provide pickup instructions to buyer..."
                    className="w-full p-sm border border-border-gray rounded text-body-sm"
                  />
                </div>

                <div className="flex justify-end gap-md pt-sm">
                  <button
                    onClick={() => handleAction(ReturnRequestStatus.REJECTED)}
                    disabled={isProcessing}
                    className="px-lg py-sm bg-error text-on-primary font-bold text-body-sm rounded hover:opacity-90"
                  >
                    Reject Return
                  </button>
                  <button
                    onClick={() => handleAction(ReturnRequestStatus.APPROVED)}
                    disabled={isProcessing}
                    className="px-lg py-sm bg-success-green text-on-primary font-bold text-body-sm rounded hover:opacity-90"
                  >
                    Approve Return & Schedule Pickup
                  </button>
                </div>
              </div>
            )}

            {/* Inspection Controls */}
            {(selectedReturn.status === "DELIVERED_TO_SELLER" || selectedReturn.status === "UNDER_INSPECTION") && (
              <div className="space-y-md border-t border-border-gray pt-md">
                <p className="font-bold text-body-md text-on-surface">2. Warehouse Inspection & Refund Approval</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  <div>
                    <label className="block font-bold text-body-sm text-secondary">Inspection Outcome</label>
                    <select
                      value={inspectionResult}
                      onChange={(e) => setInspectionResult(e.target.value as InspectionResult)}
                      className="w-full p-sm border border-border-gray rounded text-body-sm bg-white font-medium"
                    >
                      <option value={InspectionResult.PASSED}>Inspection Passed (Item Intact)</option>
                      <option value={InspectionResult.FAILED}>Inspection Failed (Damaged / Used)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-body-sm text-secondary">Restock Inventory?</label>
                    <select
                      value={restockDecision ? "yes" : "no"}
                      onChange={(e) => setRestockDecision(e.target.value === "yes")}
                      className="w-full p-sm border border-border-gray rounded text-body-sm bg-white font-medium"
                    >
                      <option value="yes">Yes - Restock +1 to Stock Count</option>
                      <option value="no">No - Item Damaged / Non-sellable</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-body-sm text-secondary">Inspection Remarks</label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={2}
                    placeholder="Inspection verification notes..."
                    className="w-full p-sm border border-border-gray rounded text-body-sm"
                  />
                </div>

                <div className="flex justify-end gap-md pt-sm">
                  <button
                    onClick={() => handleAction(ReturnRequestStatus.REJECTED)}
                    disabled={isProcessing}
                    className="px-lg py-sm bg-error text-on-primary font-bold text-body-sm rounded hover:opacity-90"
                  >
                    Fail Inspection & Reject Refund
                  </button>
                  <button
                    onClick={() => handleAction(ReturnRequestStatus.REFUND_APPROVED)}
                    disabled={isProcessing}
                    className="px-lg py-sm bg-success-green text-on-primary font-bold text-body-sm rounded hover:opacity-90"
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
