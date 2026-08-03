"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";

// Form Validation Schema
const editProfileSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    name: string;
    email: string;
    phone: string;
    image: string;
  };
  onSave: (data: { name: string; phone: string; image: string }) => Promise<void>;
  isSaving: boolean;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  initialData,
  onSave,
  isSaving,
}: EditProfileModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [avatarUrl, setAvatarUrl] = useState(initialData.image || "");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // React Hook Form initialization
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: initialData.name,
      phone: initialData.phone,
    },
  });

  // Sync initialData when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData.name,
        phone: initialData.phone,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvatarUrl(initialData.image || "");
      setUploadError(null);
      setUploadProgress(0);
      setIsDragging(false);
    }
  }, [isOpen, initialData, reset]);

  // Accessibility: Focus Trap and Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        } else if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    
    // Autofocus the first editable field (name input)
    const timer = setTimeout(() => {
      const nameInput = modalRef.current?.querySelector('input[type="text"]') as HTMLInputElement;
      if (nameInput) nameInput.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  // Click Outside to Dismiss Modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Image File Validator
  const validateFile = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Only JPG, PNG, and WEBP formats are supported.");
      return false;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError("Image size must be smaller than 5MB.");
      return false;
    }
    return true;
  };

  // Signed Cloudinary direct upload
  const uploadImageFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // 1. Fetch Cloudinary signature payload
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadType: "profile" }),
      });

      if (!signRes.ok) {
        const errData = await signRes.json();
        throw new Error(errData.error?.message || "Failed to authorize profile image upload.");
      }

      const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

      // 2. Perform direct AJAX post with progress tracking
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

      // Track progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      const uploadPromise = new Promise<{ secure_url: string }>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const resData = JSON.parse(xhr.responseText);
              resolve(resData);
            } catch (err) {
              reject(new Error("Failed to parse Cloudinary response."));
            }
          } else {
            reject(new Error(`Upload failed. Status: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network connection error during upload."));
      });

      xhr.send(formData);
      const data = await uploadPromise;
      
      setAvatarUrl(data.secure_url);
    } catch (err) {
      const error = err as Error;
      console.error("[Avatar Upload Error]:", error);
      setUploadError(error.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      uploadImageFile(file);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      uploadImageFile(file);
    }
  };

  // Form Submit Handler
  const onSubmitForm = async (values: EditProfileFormValues) => {
    if (uploading) return;
    await onSave({
      name: values.name,
      phone: values.phone,
      image: avatarUrl,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        ref={modalRef}
        className="bg-vl-card border border-vl-border rounded-vl-card shadow-vl-large w-full md:min-w-[600px] md:max-w-[720px] max-w-[420px] p-6 md:p-8 space-y-6 relative animate-fade-in-up transition-all duration-vl-standard ease-vl-out"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-vl-muted hover:text-vl-primary transition-colors cursor-pointer p-1.5 rounded-full hover:bg-vl-surface focus-visible:ring-2 focus-visible:ring-vl-primary"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-vl-border pb-4">
          <h2 id="modal-title" className="font-vl-heading text-xl sm:text-2xl font-bold text-vl-ink">
            Edit Profile
          </h2>
          <p id="modal-description" className="text-xs text-vl-muted mt-1">
            Update your account information
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          {/* Profile Photo Section */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-1">
            {/* Image Preview */}
            <div className="relative shrink-0 w-24 h-24 rounded-full overflow-hidden border-2 border-vl-border group bg-vl-surface shadow-sm">
              <img
                src={avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCpvGeNWBUDoqe841o3wofq-HGvzKtAYcEwXFBFheL2teGTF4Tp6bRgKXGUToN7CG2_gYevYtb7_QxE2GAE9CS1Yk2HkEKA2wMpP81AxvtpMDPP4bc2GeMnbSH9vCBT_uC0YbGTvAY-_aEj0_aqCAY94_rg-8OuQY14ze7KJPK8kuAeCsu6H6lsRtwlwmmBw-MW-nl9Y643Hme6794nZ6W-_m3-T1ngfxGG1dAaK6RieIp27aevhAUevgIsfHqKnsfunM9M6wwz2UIz"}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-vl-ink/60 flex items-center justify-center">
                  <span className="text-white text-xs font-bold font-mono">{uploadProgress}%</span>
                </div>
              )}
            </div>

            {/* Drag Drop Upload Controls */}
            <div className="flex-1 w-full flex flex-col justify-center">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-vl-control p-4 text-center cursor-pointer transition-colors duration-vl-fast ${
                  isDragging
                    ? "border-vl-primary bg-vl-primary/5"
                    : "border-vl-border bg-vl-surface hover:border-vl-primary/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-1">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-vl-primary" />
                  ) : (
                    <Upload className="w-5 h-5 text-vl-muted" />
                  )}
                  <p className="text-sm font-bold text-vl-ink">
                    {uploading ? "Uploading..." : "Click or Drag & Drop to Upload"}
                  </p>
                  <p className="text-[10px] text-vl-muted">Supported: JPG, PNG, WEBP (Max 5MB)</p>
                </div>
              </div>

              {/* Progress bar */}
              {uploading && (
                <div className="w-full bg-vl-surface h-1 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-vl-primary h-full rounded-full transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              {/* Upload errors */}
              {uploadError && (
                <p className="text-vl-danger text-[11px] font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{uploadError}</span>
                </p>
              )}
            </div>
          </div>

          <hr className="border-t border-vl-border" />

          {/* Full Name */}
          <div className="space-y-1">
            <label htmlFor="edit-name" className="block font-vl-heading text-xs font-bold text-vl-ink uppercase tracking-wider">
              Full Name
            </label>
            <input
              id="edit-name"
              type="text"
              className={`w-full border rounded-vl-control text-sm outline-none p-3 font-sans transition-all focus:border-vl-primary focus:ring-1 focus:ring-vl-primary focus:ring-vl-primary/40 ${
                errors.name ? "border-vl-danger focus:border-vl-danger" : "border-vl-border focus:border-vl-primary"
              }`}
              placeholder="Enter full name"
              disabled={isSaving}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-vl-danger text-[11px] font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.name.message}</span>
              </p>
            )}
          </div>

          {/* Email Address (Disabled) */}
          <div className="space-y-1">
            <label htmlFor="edit-email" className="block font-vl-heading text-xs font-bold text-vl-ink uppercase tracking-wider">
              Email Address
            </label>
            <input
              id="edit-email"
              type="email"
              className="w-full border border-vl-border rounded-vl-control text-sm bg-vl-surface text-vl-muted cursor-not-allowed p-3 font-sans"
              value={initialData.email}
              disabled
            />
            <p className="text-[10px] text-vl-muted">Email address cannot be changed</p>
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label htmlFor="edit-phone" className="block font-vl-heading text-xs font-bold text-vl-ink uppercase tracking-wider">
              Phone Number
            </label>
            <input
              id="edit-phone"
              type="text"
              className={`w-full border rounded-vl-control text-sm outline-none p-3 font-sans transition-all focus:border-vl-primary focus:ring-1 focus:ring-vl-primary focus:ring-vl-primary/40 ${
                errors.phone ? "border-vl-danger focus:border-vl-danger" : "border-vl-border focus:border-vl-primary"
              }`}
              placeholder="Enter 10-digit mobile number"
              disabled={isSaving}
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-vl-danger text-[11px] font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.phone.message}</span>
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-vl-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 border border-vl-border text-vl-muted rounded-vl-control font-vl-heading font-bold hover:bg-vl-surface hover:text-vl-ink cursor-pointer transition-colors text-xs text-center disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || uploading}
              className="w-full sm:w-auto px-6 py-2.5 bg-vl-primary text-white rounded-vl-control font-vl-heading font-bold hover:bg-vl-primary-strong active:scale-95 cursor-pointer transition-all disabled:opacity-55 text-xs text-center flex items-center justify-center gap-1.5 shadow-md shadow-vl-primary/10"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
