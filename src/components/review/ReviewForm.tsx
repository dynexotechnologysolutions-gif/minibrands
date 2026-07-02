"use client";

import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import StarRating from "./StarRating";
import { trackEvent } from "@/lib/posthog";
import { createReviewAction } from "@/actions/review-create.action";

const MAX_COMMENT_LENGTH = 500;
const MAX_PHOTOS = 3;

const FormSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(MAX_COMMENT_LENGTH).optional(),
  photoUrls: z.array(z.string().url()).max(MAX_PHOTOS),
});

type FormValues = z.infer<typeof FormSchema>;

interface ReviewFormProps {
  orderId: string;
  productId: string;
  productName: string;
  buyerId: string;
  onSuccess: (newRating: number, newCount: number) => void;
}

/**
 * Review submission form for delivered orders.
 * Star rating + text comment + Cloudinary photo upload (max 3).
 * Uses React Hook Form + Zod + TanStack Mutation.
 */
export default function ReviewForm({
  orderId,
  productId,
  productName,
  buyerId,
  onSuccess,
}: ReviewFormProps) {
  const hasTrackedStart = useRef(false);

  useEffect(() => {
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true;
      // PostHog tracking — fires once on mount
      // We call posthog directly here on client; posthog-js handles client-side
      console.log("[PostHog] review_started", { orderId, productId });
    }
  }, [orderId, productId]);

  const {
    handleSubmit,
    setValue,
    watch,
    register,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { rating: 5, comment: "", photoUrls: [] },
  });

  const rating = watch("rating");
  const comment = watch("comment") ?? "";
  const photoUrls = watch("photoUrls") ?? [];

  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return createReviewAction({
        orderId,
        productId,
        rating: values.rating,
        comment: values.comment,
        photoUrls: values.photoUrls,
      });
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        setSuccessMessage("Thank you! Your review has been published.");
        onSuccess(res.data.newAverageRating, res.data.newReviewCount);
      } else {
        setErrorMessage(res.error?.message ?? "Failed to submit review.");
      }
    },
    onError: (err: any) => {
      setErrorMessage(err.message ?? "An error occurred.");
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photoUrls.length + files.length > MAX_PHOTOS) {
      setUploadError(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      // Get Cloudinary signature
      const sigRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uploadType: "review" }),
      });
      if (!sigRes.ok) throw new Error("Failed to get upload signature.");
      const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json();

      const newUrls: string[] = [];

      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("signature", signature);
        form.append("timestamp", String(timestamp));
        form.append("api_key", apiKey);
        form.append("folder", folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: form }
        );

        if (!uploadRes.ok) throw new Error("Image upload failed.");
        const uploadData = await uploadRes.json();
        newUrls.push(uploadData.secure_url);
      }

      setValue("photoUrls", [...photoUrls, ...newUrls]);
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removePhoto = (idx: number) => {
    setValue("photoUrls", photoUrls.filter((_, i) => i !== idx));
  };

  if (successMessage) {
    return (
      <div className="p-base bg-emerald-50 border border-emerald-100 rounded flex items-center gap-sm">
        <span className="material-symbols-outlined text-emerald-500">check_circle</span>
        <p className="font-label-bold text-label-bold text-emerald-800">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((v: FormValues) => mutation.mutate(v))} className="space-y-base">
      <div>
        <p className="font-body-sm text-secondary text-xs mb-xs">Reviewing:</p>
        <p className="font-label-bold text-label-bold text-primary truncate">{productName}</p>
      </div>

      {/* Star rating */}
      <div className="space-y-xs">
        <label className="font-label-bold text-label-bold text-on-surface">Your Rating</label>
        <StarRating
          value={rating}
          onChange={(r) => setValue("rating", r)}
          size="lg"
        />
        {errors.rating && (
          <p className="font-body-sm text-xs text-error-red">{errors.rating.message}</p>
        )}
      </div>

      {/* Comment */}
      <div className="space-y-xs">
        <label className="font-label-bold text-label-bold text-on-surface">Comments</label>
        <textarea
          {...register("comment")}
          rows={4}
          maxLength={MAX_COMMENT_LENGTH}
          placeholder="Share your experience with this boutique and product..."
          className="w-full border border-border-gray rounded text-body-sm outline-none focus:border-primary p-sm resize-none transition-colors"
        />
        <div className="flex justify-between">
          {errors.comment && (
            <p className="font-body-sm text-xs text-error-red">{errors.comment.message}</p>
          )}
          <p className="font-body-sm text-[10px] text-secondary ml-auto">
            {comment.length}/{MAX_COMMENT_LENGTH}
          </p>
        </div>
      </div>

      {/* Photo upload */}
      <div className="space-y-xs">
        <label className="font-label-bold text-label-bold text-on-surface">
          Photos (optional, max {MAX_PHOTOS})
        </label>
        <div className="flex gap-sm flex-wrap">
          {photoUrls.map((url, idx) => (
            <div key={idx} className="relative w-16 h-16 rounded border border-border-gray overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute top-0 right-0 bg-black/60 text-white w-5 h-5 flex items-center justify-center rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove photo"
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            </div>
          ))}
          {photoUrls.length < MAX_PHOTOS && (
            <label
              htmlFor="review-photo-upload"
              className={`w-16 h-16 rounded border-2 border-dashed border-border-gray flex items-center justify-center cursor-pointer hover:border-primary transition-colors ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-secondary text-[22px]">add_photo_alternate</span>
              )}
              <input
                id="review-photo-upload"
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handlePhotoUpload}
                disabled={isUploading}
              />
            </label>
          )}
        </div>
        {uploadError && (
          <p className="font-body-sm text-xs text-error-red">{uploadError}</p>
        )}
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="p-sm bg-red-50 border border-red-100 rounded flex items-center gap-xs">
          <span className="material-symbols-outlined text-error-red text-[16px]">error</span>
          <p className="font-body-sm text-xs text-error-red">{errorMessage}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-base justify-end">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-xl py-2.5 bg-primary text-white rounded font-label-bold text-label-bold hover:opacity-90 transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-xs"
        >
          {mutation.isPending ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">send</span>
              Submit Review
            </>
          )}
        </button>
      </div>
    </form>
  );
}
