"use client";

import React from "react";
import Link from "next/link";

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

interface ReturnHistoryData {
  id: string;
  previousStatus: string;
  newStatus: string;
  actorRole: string;
  comment: string | null;
  createdAt: string;
}

interface RefundData {
  id: string;
  razorpayRefundId: string | null;
  amount: number;
  status: string;
  initiatedAt: string;
  processedAt: string | null;
}

interface ReturnData {
  id: string;
  orderId: string;
  status: string;
  reason: string;
  comment: string | null;
  refundMethod: string;
  refundAmount: number;
  pickupCourier: string | null;
  pickupTrackingId: string | null;
  pickupDate: string | null;
  inspectionNotes: string | null;
  inspectionResult: string;
  createdAt: string;
  sellerName: string;
  items: ReturnItemData[];
  evidence: ReturnEvidenceData[];
  history: ReturnHistoryData[];
  refund: RefundData | null;
}

interface ReturnTrackerClientProps {
  returnData: ReturnData;
}

const STEPS = [
  { key: "RETURN_REQUESTED", label: "Return Requested" },
  { key: "APPROVED", label: "Approved" },
  { key: "PICKUP_SCHEDULED", label: "Pickup Scheduled" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "DELIVERED_TO_SELLER", label: "Received by Seller" },
  { key: "UNDER_INSPECTION", label: "Inspection" },
  { key: "REFUNDED", label: "Refund Processed" },
];

export default function ReturnTrackerClient({ returnData }: ReturnTrackerClientProps) {
  const isRejected = returnData.status === "REJECTED";
  const isCancelled = returnData.status === "CANCELLED";

  const getStepStatus = (stepKey: string) => {
    if (isRejected || isCancelled) return "pending";
    if (returnData.status === "RETURN_COMPLETED" || returnData.status === "REFUNDED") return "completed";
    
    const currentIndex = STEPS.findIndex((s) => s.key === returnData.status);
    const stepIndex = STEPS.findIndex((s) => s.key === stepKey);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="space-y-lg">
      {/* Top Breadcrumb Header */}
      <div className="border-b border-border-gray pb-md flex items-center justify-between">
        <div>
          <Link
            href={`/account/orders/${returnData.orderId}`}
            className="text-body-sm text-secondary hover:underline flex items-center gap-xs mb-xs"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Order Details
          </Link>
          <h1 className="font-headline-md text-headline-md text-on-surface">
            Return Request Status
          </h1>
          <p className="text-body-sm text-text-muted">
            Return ID: <span className="font-bold text-on-surface">{returnData.id.slice(0, 8)}</span> • Order #{returnData.orderId.slice(0, 8)}
          </p>
        </div>

        <span
          className={`px-md py-xs rounded-full font-bold text-xs uppercase tracking-wider ${
            isRejected
              ? "bg-error-container text-error"
              : returnData.status === "RETURN_COMPLETED" || returnData.status === "REFUNDED"
              ? "bg-success-green/20 text-success-green"
              : "bg-accent-yellow/20 text-primary"
          }`}
        >
          {returnData.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Rejection / Cancellation alert */}
      {isRejected && (
        <div className="p-md bg-error-container text-error rounded border border-error/20 space-y-xs">
          <p className="font-bold text-body-md">Return Request Rejected by Seller</p>
          <p className="text-body-sm">
            The seller has rejected this return request. If you believe this is an error, you can escalate a dispute to Velvet Lane support.
          </p>
        </div>
      )}

      {/* Interactive Timeline Tracker */}
      {!isRejected && !isCancelled && (
        <div className="bg-white border border-border-gray rounded p-lg space-y-md shadow-sm">
          <h2 className="font-label-bold text-label-bold text-secondary uppercase tracking-wider">
            Return Progress Timeline
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-sm pt-sm">
            {STEPS.map((step, idx) => {
              const status = getStepStatus(step.key);
              return (
                <div key={idx} className="flex flex-col items-center text-center space-y-xs">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      status === "completed"
                        ? "bg-success-green text-on-primary"
                        : status === "current"
                        ? "bg-primary text-on-primary ring-4 ring-primary/20 animate-pulse"
                        : "bg-surface-container text-text-muted"
                    }`}
                  >
                    {status === "completed" ? "✓" : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-bold leading-tight ${
                      status === "current" ? "text-primary" : "text-text-muted"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Courier & Logistics Info */}
      {returnData.pickupCourier && (
        <div className="bg-white border border-border-gray rounded p-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md shadow-sm">
          <div className="flex items-center gap-md">
            <span className="material-symbols-outlined text-3xl text-secondary">local_shipping</span>
            <div>
              <p className="font-label-bold text-label-bold text-on-surface">Pickup & Transit Details</p>
              <p className="text-body-sm text-text-muted">
                Courier: <span className="font-bold text-on-surface">{returnData.pickupCourier}</span>
                {returnData.pickupTrackingId && (
                  <span> • Tracking ID: <span className="font-bold text-on-surface">{returnData.pickupTrackingId}</span></span>
                )}
              </p>
            </div>
          </div>
          {returnData.pickupDate && (
            <div className="text-right">
              <p className="text-body-sm text-text-muted">Scheduled Date</p>
              <p className="font-bold text-body-md text-primary">
                {new Date(returnData.pickupDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Refund Ledger Overview */}
      {returnData.refund && (
        <div className="bg-white border border-border-gray rounded p-lg space-y-sm shadow-sm border-l-4 border-l-success-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-headline-sm text-headline-sm text-on-surface">Refund Processed</p>
              <p className="text-body-sm text-text-muted">
                Method: <span className="font-bold uppercase text-on-surface">{returnData.refundMethod.replace(/_/g, " ")}</span>
              </p>
            </div>
            <p className="text-2xl font-black text-success-green">
              ₹{(returnData.refund.amount / 100).toLocaleString("en-IN")}
            </p>
          </div>
          {returnData.refund.razorpayRefundId && (
            <p className="text-body-sm text-text-muted pt-xs border-t border-border-gray/30">
              Razorpay Refund Reference ID: <span className="font-mono font-bold text-on-surface">{returnData.refund.razorpayRefundId}</span>
            </p>
          )}
        </div>
      )}

      {/* Returned Items List */}
      <div className="bg-white border border-border-gray rounded p-lg space-y-md shadow-sm">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">
          Returned Items
        </h2>
        <div className="space-y-md">
          {returnData.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b border-border-gray/30 pb-sm last:border-0">
              <div className="flex items-center gap-md">
                <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded border border-border-gray" />
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface">{item.name}</p>
                  <p className="text-body-sm text-text-muted">Size: {item.size} • Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="font-bold text-body-md text-on-surface">
                ₹{((item.unitPrice * item.quantity) / 100).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Audit History Trail */}
      <div className="bg-white border border-border-gray rounded p-lg space-y-md shadow-sm">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">
          Return Status History Audit Log
        </h2>
        <div className="space-y-sm">
          {returnData.history.map((h) => (
            <div key={h.id} className="flex items-start justify-between border-b border-border-gray/30 pb-xs text-body-sm">
              <div>
                <p className="font-bold text-on-surface">
                  {h.newStatus.replace(/_/g, " ")} <span className="font-normal text-text-muted">({h.actorRole})</span>
                </p>
                {h.comment && <p className="text-secondary italic">{h.comment}</p>}
              </div>
              <span className="text-text-muted text-xs">
                {new Date(h.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
