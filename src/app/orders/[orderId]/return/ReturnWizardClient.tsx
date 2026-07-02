"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ReturnReason, RefundMethod, EvidenceType } from "@prisma/client";
import { submitReturnRequestAction } from "@/modules/returns/actions/return.actions";

interface OrderItemInfo {
  id: string;
  productId: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  unitPrice: number;
  category: string;
}

interface OrderInfo {
  id: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  sellerName: string;
  items: OrderItemInfo[];
}

interface ReturnWizardClientProps {
  order: OrderInfo;
}

export default function ReturnWizardClient({ order }: ReturnWizardClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1: Selected items
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>(() => {
    // Select all items by default
    const initial: Record<string, number> = {};
    order.items.forEach((item) => {
      initial[item.id] = item.quantity;
    });
    return initial;
  });

  // Step 2: Reason & Comment
  const [reason, setReason] = useState<ReturnReason>(ReturnReason.DAMAGED);
  const [comment, setComment] = useState("");

  // Step 3: Evidence uploads
  const [evidenceList, setEvidenceList] = useState<
    { url: string; type: EvidenceType; cloudinaryPublicId?: string }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  // Step 4: Refund Method
  const [refundMethod, setRefundMethod] = useState<RefundMethod>(RefundMethod.ORIGINAL_PAYMENT);

  // Status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleItemSelection = (itemId: string, maxQty: number) => {
    setSelectedItems((prev) => {
      const copy = { ...prev };
      if (copy[itemId]) {
        delete copy[itemId];
      } else {
        copy[itemId] = maxQty;
      }
      return copy;
    });
  };

  const updateItemQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) return;
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: qty,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // Get Cloudinary signature using existing endpoint
      const sigRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadType: "review" }),
      });

      if (!sigRes.ok) throw new Error("Failed to authorize file upload.");
      const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json();

      const uploaded: { url: string; type: EvidenceType; cloudinaryPublicId?: string }[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("signature", signature);
        formData.append("timestamp", String(timestamp));
        formData.append("api_key", apiKey);
        formData.append("folder", folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: formData }
        );

        if (!uploadRes.ok) throw new Error("Upload failed.");
        const data = await uploadRes.json();
        
        const isVideo = file.type.startsWith("video/");
        uploaded.push({
          url: data.secure_url,
          type: isVideo ? EvidenceType.VIDEO : EvidenceType.IMAGE,
          cloudinaryPublicId: data.public_id,
        });
      }

      setEvidenceList((prev) => [...prev, ...uploaded]);
    } catch (err: any) {
      setErrorMessage(err.message || "File upload failed.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const calculateEstimatedRefund = () => {
    let total = 0;
    Object.entries(selectedItems).forEach(([itemId, qty]) => {
      const item = order.items.find((i) => i.id === itemId);
      if (item) {
        total += item.unitPrice * qty;
      }
    });
    return total;
  };

  const handleSubmitReturn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const itemsPayload = Object.entries(selectedItems).map(([orderItemId, quantity]) => ({
      orderItemId,
      quantity,
    }));

    if (itemsPayload.length === 0) {
      setErrorMessage("Please select at least one item to return.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await submitReturnRequestAction({
        orderId: order.id,
        reason,
        comment,
        refundMethod,
        items: itemsPayload,
        evidence: evidenceList,
      });

      if (response.success) {
        router.push(`/orders/${order.id}/return/track`);
      } else {
        setErrorMessage(response.error?.message || "Failed to submit return request.");
      }
    } catch (err: any) {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-lg">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border-gray pb-md">
        <div>
          <Link
            href={`/account/orders/${order.id}`}
            className="text-body-sm text-secondary hover:underline flex items-center gap-xs mb-xs"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Order Details
          </Link>
          <h1 className="font-headline-md text-headline-md text-on-surface">
            Request Return / Exchange
          </h1>
          <p className="text-body-sm text-text-muted">
            Order #{order.id.slice(0, 8)} • Sold by <span className="font-bold text-on-surface">{order.sellerName}</span>
          </p>
        </div>

        {/* Steps Progress Pills */}
        <div className="hidden md:flex items-center gap-xs">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step === s
                  ? "bg-primary text-on-primary"
                  : step > s
                  ? "bg-success-green text-on-primary"
                  : "bg-surface-container text-text-muted"
              }`}
            >
              {step > s ? "✓" : s}
            </div>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="p-base bg-error-container text-error rounded font-bold text-body-sm border border-error/20">
          {errorMessage}
        </div>
      )}

      {/* Step 1: Select Items */}
      {step === 1 && (
        <div className="bg-white border border-border-gray rounded p-lg space-y-md shadow-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            1. Select Items to Return
          </h2>
          <p className="text-body-sm text-text-muted">
            Choose the items and quantities you would like to return from this order.
          </p>

          <div className="space-y-md">
            {order.items.map((item) => {
              const isSelected = !!selectedItems[item.id];
              const selectedQty = selectedItems[item.id] || item.quantity;

              return (
                <div
                  key={item.id}
                  className={`p-base border rounded flex items-center justify-between gap-md transition-colors ${
                    isSelected ? "border-primary bg-surface-container-low/30" : "border-border-gray"
                  }`}
                >
                  <div className="flex items-center gap-md">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItemSelection(item.id, item.quantity)}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded border border-border-gray shrink-0"
                    />
                    <div>
                      <p className="font-label-bold text-label-bold text-on-surface">{item.name}</p>
                      <p className="text-body-sm text-text-muted">
                        Size: {item.size} • ₹{(item.unitPrice / 100).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-sm">
                      <span className="text-body-sm text-secondary font-bold">Qty:</span>
                      <select
                        value={selectedQty}
                        onChange={(e) => updateItemQuantity(item.id, Number(e.target.value))}
                        className="p-xs border border-border-gray rounded text-body-sm bg-white font-bold"
                      >
                        {[...Array(item.quantity)].map((_, idx) => (
                          <option key={idx + 1} value={idx + 1}>
                            {idx + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-md">
            <button
              onClick={() => {
                if (Object.keys(selectedItems).length === 0) {
                  setErrorMessage("Please select at least one item.");
                  return;
                }
                setErrorMessage(null);
                setStep(2);
              }}
              className="px-xl py-md bg-primary text-on-primary font-bold text-body-sm rounded hover:opacity-90 cursor-pointer"
            >
              Continue to Return Reason →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Return Reason & Comments */}
      {step === 2 && (
        <div className="bg-white border border-border-gray rounded p-lg space-y-md shadow-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            2. Why are you returning this?
          </h2>

          <div className="space-y-sm">
            <label className="block font-label-bold text-label-bold text-on-surface">
              Select Primary Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReturnReason)}
              className="w-full p-md border border-border-gray rounded text-body-md bg-white font-medium"
            >
              <option value={ReturnReason.DAMAGED}>Damaged Product / Broken Package</option>
              <option value={ReturnReason.WRONG_PRODUCT}>Received Wrong Item or Color</option>
              <option value={ReturnReason.SIZE_ISSUE}>Size / Fit Issue</option>
              <option value={ReturnReason.QUALITY_ISSUE}>Quality Not As Expected</option>
              <option value={ReturnReason.NOT_AS_DESCRIBED}>Product Not As Described</option>
              <option value={ReturnReason.CHANGED_MIND}>Changed My Mind</option>
              <option value={ReturnReason.OTHER}>Other Reason</option>
            </select>
          </div>

          <div className="space-y-sm">
            <label className="block font-label-bold text-label-bold text-on-surface">
              Additional Details (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Describe the issue in detail to help the seller process your return faster..."
              className="w-full p-md border border-border-gray rounded text-body-md bg-white font-medium"
            />
          </div>

          <div className="flex justify-between pt-md">
            <button
              onClick={() => setStep(1)}
              className="px-lg py-md border border-border-gray text-primary font-bold text-body-sm rounded hover:bg-surface-container cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-xl py-md bg-primary text-on-primary font-bold text-body-sm rounded hover:opacity-90 cursor-pointer"
            >
              Continue to Evidence Upload →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Evidence Uploads */}
      {step === 3 && (
        <div className="bg-white border border-border-gray rounded p-lg space-y-md shadow-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            3. Upload Evidence (Photos / Videos)
          </h2>
          <p className="text-body-sm text-text-muted">
            Upload clear photos or short videos showing the defect or item condition to speed up approval.
          </p>

          {/* Upload Drop Zone */}
          <div className="border-2 border-dashed border-border-gray p-xl rounded text-center space-y-sm hover:border-primary transition-colors">
            <span className="material-symbols-outlined text-4xl text-text-muted">cloud_upload</span>
            <p className="font-label-bold text-body-md text-on-surface">
              Drag & Drop or Click to Upload Evidence
            </p>
            <p className="text-body-sm text-text-muted">PNG, JPG, MP4 up to 10MB each</p>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
              id="evidence-input"
            />
            <label
              htmlFor="evidence-input"
              className="inline-block px-lg py-sm bg-surface-container text-primary font-bold text-body-sm rounded cursor-pointer hover:bg-border-gray/30"
            >
              {isUploading ? "Uploading..." : "Select Files"}
            </label>
          </div>

          {/* Evidence Previews */}
          {evidenceList.length > 0 && (
            <div className="flex gap-md flex-wrap pt-sm">
              {evidenceList.map((ev, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded border border-border-gray overflow-hidden group">
                  {ev.type === EvidenceType.VIDEO ? (
                    <div className="w-full h-full bg-black/80 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined">play_circle</span>
                    </div>
                  ) : (
                    <img src={ev.url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => setEvidenceList((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-md">
            <button
              onClick={() => setStep(2)}
              className="px-lg py-md border border-border-gray text-primary font-bold text-body-sm rounded hover:bg-surface-container cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-xl py-md bg-primary text-on-primary font-bold text-body-sm rounded hover:opacity-90 cursor-pointer"
            >
              Continue to Refund Preference →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Refund Method & Review */}
      {step === 4 && (
        <div className="bg-white border border-border-gray rounded p-lg space-y-md shadow-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            4. Review & Confirm Return
          </h2>

          {/* Estimated Refund Summary */}
          <div className="p-md bg-surface-container-low rounded-lg flex items-center justify-between border border-border-gray/30">
            <div>
              <p className="font-label-bold text-label-bold text-primary">Estimated Refund Amount</p>
              <p className="text-body-sm text-text-muted">Calculated from selected items</p>
            </div>
            <p className="text-2xl font-black text-success-green">
              ₹{(calculateEstimatedRefund() / 100).toLocaleString("en-IN")}
            </p>
          </div>

          {/* Refund Method Selection */}
          <div className="space-y-sm">
            <label className="block font-label-bold text-label-bold text-on-surface">
              Choose Refund Preference
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <label
                className={`p-md border rounded flex items-start gap-md cursor-pointer ${
                  refundMethod === RefundMethod.ORIGINAL_PAYMENT
                    ? "border-primary bg-surface-container-low/30"
                    : "border-border-gray"
                }`}
              >
                <input
                  type="radio"
                  name="refundMethod"
                  value={RefundMethod.ORIGINAL_PAYMENT}
                  checked={refundMethod === RefundMethod.ORIGINAL_PAYMENT}
                  onChange={() => setRefundMethod(RefundMethod.ORIGINAL_PAYMENT)}
                  className="mt-1 accent-primary"
                />
                <div>
                  <p className="font-bold text-body-md text-on-surface">Original Payment Method</p>
                  <p className="text-body-sm text-text-muted">
                    Refund back to your Razorpay source (UPI / Card / NetBanking) within 3-5 business days.
                  </p>
                </div>
              </label>

              <label
                className={`p-md border rounded flex items-start gap-md cursor-pointer ${
                  refundMethod === RefundMethod.STORE_CREDIT
                    ? "border-primary bg-surface-container-low/30"
                    : "border-border-gray"
                }`}
              >
                <input
                  type="radio"
                  name="refundMethod"
                  value={RefundMethod.STORE_CREDIT}
                  checked={refundMethod === RefundMethod.STORE_CREDIT}
                  onChange={() => setRefundMethod(RefundMethod.STORE_CREDIT)}
                  className="mt-1 accent-primary"
                />
                <div>
                  <p className="font-bold text-body-md text-on-surface">Store Credit / Wallet</p>
                  <p className="text-body-sm text-text-muted">
                    Instant credit to your Velvet Lane account balance upon inspection pass.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-between pt-md">
            <button
              onClick={() => setStep(3)}
              className="px-lg py-md border border-border-gray text-primary font-bold text-body-sm rounded hover:bg-surface-container cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmitReturn}
              disabled={isSubmitting}
              className="px-xl py-md bg-success-green text-on-primary font-bold text-body-sm rounded hover:opacity-90 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Submitting Request..." : "Submit Return Request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
