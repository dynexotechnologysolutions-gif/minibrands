"use client";

/**
 * AddressClient
 * @redesigned v5.0 — visual redesign only, all callbacks, schemas, geolocation and logic preserved.
 *
 * Purpose:
 *   Premium address selection and management interface. Displays saved delivery cards,
 *   integrates precise geolocation auto-fill controls, embeds a secure add/edit address form,
 *   and provides a vertically sticky pricing summary panel for checkout return flows.
 */

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Loader2,
  Lock,
  ChevronRight,
  ShieldCheck,
  Edit2,
} from "lucide-react";
import { AddressCreateSchema, AddressCreateInput } from "@/schemas/address.schema";
import { createAddress } from "@/actions/address-create.action";
import { updateAddress } from "@/actions/address-update.action";
import { setAddressDefault } from "@/actions/address-set-default.action";
import { deleteAddress } from "@/actions/address-delete.action";
import HomeHeader from "@/components/home/HomeHeader";
import { getPreciseLocation } from "@/lib/geolocation";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: "Chennai";
  pincode: string;
  isDefault: boolean;
}

interface AddressClientProps {
  initialAddresses: Address[];
  checkoutProducts: {
    id: string;
    name: string;
    price: number; // in paise
    quantity: number;
  }[];
  redirectTo?: string;
  sessionId?: string;
  reservationId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userProfile: any;
  cartCount: number;
  sellerHref: string;
}

// Helpers for mock discount calculations matching CartClient.tsx
const getOriginalPrice = (pricePaise: number) => {
  if (pricePaise === 349900) return 499900;
  if (pricePaise === 899900) return 1250000;

  const priceRupees = pricePaise / 100;
  let originalRupees = Math.round(priceRupees * 1.35); // 35% markup
  if (originalRupees > 1000) {
    originalRupees = Math.floor(originalRupees / 100) * 100 + 99;
  } else if (originalRupees > 100) {
    originalRupees = Math.floor(originalRupees / 10) * 10 + 9;
  }
  return originalRupees * 100;
};

export default function AddressClient({
  initialAddresses,
  checkoutProducts,
  redirectTo,
  sessionId,
  reservationId,
  userProfile,
  cartCount,
  sellerHref,
}: AddressClientProps) {
  const router = useRouter();
  const isCheckoutFlow = !!(redirectTo || sessionId || reservationId);
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || ""
  );

  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  
  // Custom delete confirmation modal state
  const [addressToDeleteId, setAddressToDeleteId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddressCreateInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(AddressCreateSchema) as any,
    defaultValues: {
      fullName: "",
      phone: "",
      line1: "",
      line2: "",
      city: "Chennai",
      pincode: "",
      isDefault: false,
      latitude: null,
      longitude: null,
    },
  });

  const handleDetectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    setLocationStatus("Detecting...");

    try {
      const preciseCoords = await getPreciseLocation((progressMessage) => {
        setLocationStatus(progressMessage);
      });

      const { latitude, longitude, accuracy, confidenceScore } = preciseCoords;
      
      // Indoor handling check
      if (accuracy > 100) {
        setLocationStatus("Poor Signal");
        alert("Accuracy is poor. Move closer to a window or open area for a more accurate location.");
      }

      const res = await fetch(`/api/location/reverse-geocode?lat=${latitude}&lon=${longitude}`);
      if (!res.ok) {
        setLocationStatus("Reverse Geocoding Failed");
        setIsDetectingLocation(false);
        return;
      }
      
      const result = await res.json();
      if (result.success && result.address) {
        // Populate form fields
        setValue("line1", result.address.street || "");
        setValue("line2", result.address.area || "");
        setValue("city", result.address.city === "Chennai" ? "Chennai" : "Chennai");
        setValue("pincode", result.address.pincode || "");
        setValue("latitude", latitude);
        setValue("longitude", longitude);

        setLocationStatus(`Location Found (${confidenceScore}% confident)`);
        
        // Scroll to the Add Address form section smoothly
        document.getElementById("address-form-section")?.scrollIntoView({ behavior: "smooth" });
      } else {
        setLocationStatus("Reverse Geocoding Failed");
      }
    } catch (err) {
      const error = err as Error;
      console.error(error);
      if (error.message?.includes("permission denied") || error.message?.includes("Permission denied")) {
        setLocationStatus("Permission Denied");
      } else {
        setLocationStatus("GPS Error");
      }
      alert(error.message || "GPS detection failed. Please move closer to a window.");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const onSubmit = async (data: AddressCreateInput) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingAddressId) {
        // Edit flow
        const response = await updateAddress({
          ...data,
          addressId: editingAddressId,
        });

        if (response.success && response.data) {
          const updated: Address = {
            id: editingAddressId,
            fullName: data.fullName,
            phone: data.phone,
            line1: data.line1,
            line2: data.line2 || null,
            city: "Chennai",
            pincode: data.pincode,
            isDefault: data.isDefault || false,
          };

          setAddresses((prev) => {
            let list = prev.map((a) => (a.id === editingAddressId ? updated : a));
            if (updated.isDefault) {
              list = list.map((a) => (a.id === editingAddressId ? a : { ...a, isDefault: false }));
            }
            return list;
          });

          setEditingAddressId(null);
          reset();
        } else {
          setFormError(response.error?.message || "Failed to update address.");
        }
      } else {
        // Create flow
        const response = await createAddress(data);
        if (response.success && response.data) {
          const newAddr: Address = {
            id: response.data.addressId,
            fullName: data.fullName,
            phone: data.phone,
            line1: data.line1,
            line2: data.line2 || null,
            city: "Chennai",
            pincode: data.pincode,
            isDefault: addresses.length === 0 ? true : !!data.isDefault,
          };

          setAddresses((prev) => {
            let list = [...prev];
            if (newAddr.isDefault) {
              list = [newAddr, ...list.map((a) => ({ ...a, isDefault: false }))];
            } else {
              list = [...list, newAddr];
            }
            return list;
          });

          // Set as selected if it's the first or default
          if (newAddr.isDefault || !selectedAddressId) {
            setSelectedAddressId(newAddr.id);
          }

          reset();
        } else {
          setFormError(response.error?.message || "Failed to add address.");
        }
      }
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (addr: Address) => {
    setEditingAddressId(addr.id);
    setFormError(null);
    setValue("fullName", addr.fullName);
    setValue("phone", addr.phone);
    setValue("line1", addr.line1);
    setValue("line2", addr.line2 || "");
    setValue("city", "Chennai");
    setValue("pincode", addr.pincode);
    setValue("isDefault", addr.isDefault);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue("latitude", (addr as any).latitude || null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue("longitude", (addr as any).longitude || null);

    // Scroll to form smoothly
    const formElement = document.getElementById("address-form-section");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => {
    setEditingAddressId(null);
    reset();
  };

  const openDeleteModal = (id: string) => {
    setAddressToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!addressToDeleteId) return;
    const id = addressToDeleteId;
    setAddressToDeleteId(null);
    setIsActionLoading(id);
    try {
      const response = await deleteAddress({ addressId: id });
      if (response.success) {
        setAddresses((prev) => {
          const filtered = prev.filter((a) => a.id !== id);
          const wasDefault = prev.find((a) => a.id === id)?.isDefault;
          if (wasDefault && filtered.length > 0) {
            filtered[0].isDefault = true;
          }
          return filtered;
        });

        if (selectedAddressId === id) {
          const remaining = addresses.filter((a) => a.id !== id);
          setSelectedAddressId(remaining.find((a) => a.isDefault)?.id || remaining[0]?.id || "");
        }
      } else {
        alert(response.error?.message || "Failed to delete address.");
      }
    } catch (err) {
      console.error("Failed to delete address:", err);
    } finally {
      setIsActionLoading(null);
    }
  };

  // Re-direct return flow parameters
  const redirectUrlParam = sessionId
    ? `sessionId=${sessionId}`
    : `reservationId=${reservationId}`;

  const handleDeliverHere = async () => {
    if (!selectedAddressId) {
      alert("Please select or add a delivery address.");
      return;
    }

    // Set selected address as default automatically or keep selected
    const selectedObj = addresses.find(a => a.id === selectedAddressId);
    if (selectedObj && !selectedObj.isDefault) {
      // Set default address on backend to ensure consistency
      await setAddressDefault({ addressId: selectedAddressId });
    }

    let targetUrl = "/checkout";
    if (redirectTo) {
      const hasQuery = redirectTo.includes("?");
      targetUrl = `${redirectTo}${hasQuery ? "&" : "?"}addressId=${selectedAddressId}`;
    } else {
      targetUrl = `/checkout?${redirectUrlParam}&addressId=${selectedAddressId}`;
    }

    router.push(targetUrl);
  };

  const handleConfirmAddress = async () => {
    if (!selectedAddressId) {
      alert("Please select an address.");
      return;
    }
    setIsSettingDefault(true);
    try {
      const res = await setAddressDefault({ addressId: selectedAddressId });
      if (res.success) {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a.id === selectedAddressId,
          }))
        );
        alert("Address updated on profile successfully.");
        router.push("/account/profile");
      } else {
        alert(res.error?.message || "Failed to update profile address.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while updating profile address.");
    } finally {
      setIsSettingDefault(false);
    }
  };

  // Total amount calculations for Right side Summary
  const activeItemsCount = checkoutProducts.reduce((acc, p) => acc + p.quantity, 0);
  const subtotal = checkoutProducts.reduce((acc, p) => acc + p.price * p.quantity, 0);
  const originalPrice = checkoutProducts.reduce((acc, p) => acc + getOriginalPrice(p.price) * p.quantity, 0);
  const discount = originalPrice - subtotal;

  const formatCurrency = (amt: number) => {
    return (amt / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-vl-surface font-vl-body text-vl-ink selection:bg-vl-primary/20 pb-20 lg:pb-10">
      <HomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      <main className="vl-section-shell flex w-full flex-grow flex-col py-6 sm:py-8 lg:py-10">
        
        {/* Responsive Stepper progress indicator if in checkout return flow */}
        {isCheckoutFlow && (
          <div className="mb-8 flex items-center justify-center gap-2 border-b border-vl-border pb-5 text-sm font-semibold sm:gap-4 md:justify-start">
            <Link href="/cart" className="flex items-center gap-1 text-vl-muted hover:text-vl-primary transition-colors">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-vl-primary/10 text-[10px] font-bold text-vl-primary">✔</span>
              Cart
            </Link>
            <ChevronRight className="h-4.5 w-4.5 text-vl-border shrink-0" />
            <span className="flex items-center gap-1.5 text-vl-primary font-bold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-vl-primary text-[10px] font-bold text-white">2</span>
              Shipping Address
            </span>
            <ChevronRight className="h-4.5 w-4.5 text-vl-border shrink-0" />
            <span className="flex items-center gap-1.5 text-vl-muted">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-vl-border text-[10px] font-bold text-vl-muted">3</span>
              Secure Checkout
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 items-start">
          
          {/* LEFT COLUMN: Saved addresses & Form */}
          <div className={`${isCheckoutFlow ? "lg:col-span-8" : "lg:col-span-12 max-w-4xl mx-auto w-full"} space-y-8`}>
            
            <header>
              <h1 className="font-vl-heading text-2xl sm:text-3xl font-extrabold tracking-[-0.04em] text-vl-ink mb-1.5">
                {isCheckoutFlow ? "Select Delivery Address" : "Manage Delivery Addresses"}
              </h1>
              <p className="text-sm text-vl-muted leading-relaxed">
                {isCheckoutFlow
                  ? "Choose a saved address or add a new one to proceed with your purchase securely."
                  : "Add, edit, or delete your billing and shipping addresses below."}
              </p>
            </header>

            {/* Geolocation Detector Card */}
            <div className="rounded-vl-card border border-vl-border bg-vl-card p-5 shadow-vl-soft flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Compass className="text-vl-primary h-6 w-6 shrink-0 animate-pulse" strokeWidth={2.2} />
                <div>
                  <h3 className="font-bold text-vl-ink text-sm sm:text-base">Use Current Location</h3>
                  <p className="text-xs text-vl-muted mt-0.5 leading-relaxed">
                    {locationStatus ? `Status: ${locationStatus}` : "Use your browser GPS to auto-detect and populate addresses fields."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDetectCurrentLocation}
                disabled={isDetectingLocation}
                className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-ink px-6 text-sm font-bold text-white hover:bg-vl-ink/90 active:scale-[0.98] transition-all disabled:opacity-55 whitespace-nowrap select-none cursor-pointer"
              >
                {isDetectingLocation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  "Detect Location"
                )}
              </button>
            </div>

            {/* Saved Addresses Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Home aria-hidden="true" className="text-vl-primary h-5 w-5 shrink-0" />
                <h2 className="font-vl-heading text-lg font-bold text-vl-ink">Saved Addresses</h2>
              </div>

              {addresses.length === 0 ? (
                <div className="rounded-vl-card border border-vl-border bg-vl-card text-center py-12 px-6 shadow-vl-soft">
                  <p className="text-sm text-vl-muted">No saved addresses found. Please create a new shipping address below.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    const isLoading = isActionLoading === addr.id;
                    
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`relative rounded-vl-card border p-5 cursor-pointer flex flex-col justify-between transition-all duration-vl-fast ${
                          isSelected
                            ? "border-vl-primary bg-vl-primary/5 shadow-vl-soft"
                            : "border-vl-border bg-vl-card hover:border-vl-primary hover:shadow-vl-soft"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-vl-ink text-sm sm:text-base">{addr.fullName}</span>
                              {addr.isDefault && (
                                <span className="bg-vl-primary/10 text-vl-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Default
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="text-vl-primary h-5 w-5 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs font-semibold text-vl-muted">{addr.phone}</p>
                          <p className="text-xs text-vl-muted leading-relaxed">
                            {addr.line1}
                            {addr.line2 && <><br />{addr.line2}</>}
                            <br />
                            {addr.city} - {addr.pincode}
                          </p>
                        </div>

                        {/* Card CRUD Actions bar */}
                        <div className="mt-5 pt-3 border-t border-vl-border flex items-center justify-end gap-4 text-xs font-bold text-vl-muted">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(addr);
                            }}
                            className="inline-flex items-center gap-1 hover:text-vl-primary transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(addr.id);
                            }}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 hover:text-vl-danger transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isCheckoutFlow && addresses.length > 0 && (
                <div className="pt-4 flex justify-start">
                  <button
                    onClick={handleConfirmAddress}
                    disabled={isSettingDefault || !selectedAddressId}
                    className="inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-8 text-sm font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.25)] transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isSettingDefault ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Profile...
                      </>
                    ) : (
                      "Confirm Profile Address"
                    )}
                  </button>
                </div>
              )}
            </section>

            <div className="h-px bg-vl-border w-full" />

            {/* Add/Edit Address Form Section */}
            <section id="address-form-section" className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Plus aria-hidden="true" className="text-vl-primary h-5 w-5 shrink-0" />
                <h2 className="font-vl-heading text-lg font-bold text-vl-ink">
                  {editingAddressId ? "Edit Delivery Address" : "Add New Address"}
                </h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="rounded-vl-card border border-vl-border bg-vl-card p-6 md:p-8 space-y-6 shadow-vl-soft">
                {formError && (
                  <div className="rounded-vl-control border border-vl-danger/20 bg-vl-danger/10 p-4 text-xs font-bold text-red-950">
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-vl-ink uppercase tracking-wider">Full Name</label>
                    <input
                      {...register("fullName")}
                      className="w-full rounded-vl-control border border-vl-border bg-vl-surface p-3 text-sm text-vl-ink outline-none focus:border-vl-primary focus:ring-0 transition-colors"
                      placeholder="Enter recipient's name"
                      type="text"
                    />
                    {errors.fullName && (
                      <p className="text-vl-danger text-xs font-semibold">{errors.fullName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-vl-ink uppercase tracking-wider">Mobile Number</label>
                    <input
                      {...register("phone")}
                      className="w-full rounded-vl-control border border-vl-border bg-vl-surface p-3 text-sm text-vl-ink outline-none focus:border-vl-primary focus:ring-0 transition-colors"
                      placeholder="10-digit mobile number"
                      type="tel"
                    />
                    {errors.phone && (
                      <p className="text-vl-danger text-xs font-semibold">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-vl-ink uppercase tracking-wider">Address Line 1 (Flat, House no, Building, Street)</label>
                  <input
                    {...register("line1")}
                    className="w-full rounded-vl-control border border-vl-border bg-vl-surface p-3 text-sm text-vl-ink outline-none focus:border-vl-primary focus:ring-0 transition-colors"
                    placeholder="E.g., No. 12, Park View Apartment"
                    type="text"
                  />
                  {errors.line1 && (
                    <p className="text-vl-danger text-xs font-semibold">{errors.line1.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-vl-ink uppercase tracking-wider">Address Line 2 (Locality, Area, Landmark)</label>
                  <input
                    {...register("line2")}
                    className="w-full rounded-vl-control border border-vl-border bg-vl-surface p-3 text-sm text-vl-ink outline-none focus:border-vl-primary focus:ring-0 transition-colors"
                    placeholder="E.g., T. Nagar, near post office"
                    type="text"
                  />
                  {errors.line2 && (
                    <p className="text-vl-danger text-xs font-semibold">{errors.line2.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-vl-ink uppercase tracking-wider">City / District</label>
                    <select
                      {...register("city")}
                      className="w-full rounded-vl-control border border-vl-border bg-vl-surface/40 p-3 text-sm text-vl-muted outline-none cursor-not-allowed select-none"
                      disabled
                    >
                      <option value="Chennai">Chennai</option>
                    </select>
                    <p className="text-[10px] text-vl-muted font-semibold mt-1">Currently delivering across Chennai ZIP codes only.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-vl-ink uppercase tracking-wider">Pincode</label>
                    <input
                      {...register("pincode")}
                      className="w-full rounded-vl-control border border-vl-border bg-vl-surface p-3 text-sm text-vl-ink outline-none focus:border-vl-primary focus:ring-0 transition-colors"
                      placeholder="6-digit pincode"
                      type="text"
                    />
                    {errors.pincode && (
                      <p className="text-vl-danger text-xs font-semibold">{errors.pincode.message}</p>
                    )}
                  </div>
                </div>

                <input type="hidden" {...register("latitude", { valueAsNumber: true })} />
                <input type="hidden" {...register("longitude", { valueAsNumber: true })} />

                <div className="flex items-center gap-2.5">
                  <input
                    {...register("isDefault")}
                    className="rounded border-vl-border text-vl-primary focus:ring-0 cursor-pointer h-4.5 w-4.5 accent-vl-primary"
                    id="set_default"
                    type="checkbox"
                  />
                  <label className="text-sm font-semibold text-vl-ink cursor-pointer select-none" htmlFor="set_default">
                    Make this my default address
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3.5 pt-4">
                  <button
                    disabled={isSubmitting}
                    className="inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-8 text-sm font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.25)] transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98] disabled:opacity-55 cursor-pointer flex-grow sm:flex-grow-0"
                    type="submit"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : editingAddressId ? (
                      "Update Address"
                    ) : (
                      "Save Address"
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleCancelEdit();
                    }}
                    className="inline-flex min-h-11 items-center justify-center rounded-vl-control border border-vl-border bg-vl-card px-8 text-sm font-semibold text-vl-ink transition-all duration-vl-fast hover:border-vl-primary hover:text-vl-primary active:scale-[0.98] cursor-pointer flex-grow sm:flex-grow-0"
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* RIGHT COLUMN: Price checkout return summary (if in checkout return flow) */}
          {isCheckoutFlow && (
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              {/* Escrow Badge */}
              <div className="bg-vl-ink text-white p-5 rounded-vl-card flex gap-4 items-start shadow-vl-soft">
                <ShieldCheck aria-hidden="true" className="h-7 w-7 text-vl-accent shrink-0" />
                <div>
                  <h3 className="font-bold text-sm mb-1 uppercase tracking-wider text-vl-accent">Shield Protection</h3>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Escrow secured payments. Funds are safely held and released only upon confirmed parcel dispatch.
                  </p>
                </div>
              </div>

              {/* Price card */}
              <section className="rounded-vl-card border border-vl-border bg-vl-card overflow-hidden shadow-vl-soft">
                <div className="p-5 border-b border-vl-border bg-vl-surface">
                  <h2 className="font-vl-heading text-base font-bold text-vl-ink">Price Details</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex justify-between text-sm text-vl-muted">
                    <span>Price ({activeItemsCount} {activeItemsCount === 1 ? "item" : "items"})</span>
                    <span className="font-semibold text-vl-ink">{formatCurrency(originalPrice)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-vl-muted">
                      <span>Discount</span>
                      <span className="text-vl-success font-bold">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-vl-muted">
                    <span>Delivery Charges</span>
                    <span className="text-vl-success font-bold uppercase text-xs bg-vl-success/10 px-2 py-0.5 rounded-full">FREE</span>
                  </div>
                  
                  <div className="pt-4 border-t border-dashed border-vl-border">
                    <div className="flex justify-between items-baseline mb-5">
                      <span className="font-vl-heading text-base font-bold text-vl-ink">Total Amount</span>
                      <span className="font-vl-heading text-2xl font-extrabold text-vl-primary">{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <p className="text-xs text-vl-success font-semibold mb-4 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-vl-success inline-block"></span>
                        You save {formatCurrency(discount)} on this purchase
                      </p>
                    )}
                    
                    {/* Deliver here CTA button */}
                    <button
                      onClick={handleDeliverHere}
                      disabled={addresses.length === 0 || !selectedAddressId}
                      className="w-full inline-flex min-h-[52px] items-center justify-center gap-2 rounded-vl-control bg-vl-primary text-sm font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.25)] transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Lock aria-hidden="true" className="h-4 w-4" />
                      <span>DELIVER TO THIS ADDRESS</span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-vl-border bg-vl-surface px-5 py-4 flex justify-around items-center gap-4 text-vl-muted">
                  <div className="flex flex-col items-center gap-1 text-center shrink-0">
                    <Lock aria-hidden="true" className="h-4.5 w-4.5 text-vl-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">SSL Encrypted</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center shrink-0">
                    <ShieldCheck aria-hidden="true" className="h-4.5 w-4.5 text-vl-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Escrow Guard</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center shrink-0">
                    <CheckCircle2 aria-hidden="true" className="h-4.5 w-4.5 text-vl-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Authentic</span>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* MOBILE STICKY CTA BAR (fixed drawer bottom) if in checkout flow */}
      {isCheckoutFlow && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-vl-border p-4 lg:hidden flex items-center justify-between gap-4 shadow-vl-large"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-vl-muted uppercase tracking-wider">Total Payable</span>
            <span className="text-lg font-extrabold text-vl-primary">{formatCurrency(subtotal)}</span>
          </div>
          <button
            type="button"
            onClick={handleDeliverHere}
            disabled={addresses.length === 0 || !selectedAddressId}
            className="flex-1 max-w-[220px] inline-flex min-h-11 items-center justify-center gap-2 rounded-vl-control bg-vl-primary text-xs font-bold text-white shadow-[0_4px_16px_rgb(255_63_108_/_0.25)] transition-all duration-vl-fast hover:bg-vl-primary-strong active:scale-[0.98] disabled:opacity-50"
          >
            <Lock aria-hidden="true" className="h-3.5 w-3.5" />
            <span>DELIVER HERE</span>
          </button>
        </div>
      )}

      {/* CUSTOM REACT DELETE CONFIRMATION MODAL */}
      {addressToDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vl-ink/45 backdrop-blur-sm transition-all duration-vl-fast"
        >
          <div className="w-full max-w-md bg-vl-card border border-vl-border rounded-vl-card p-6 shadow-vl-floating transition-transform duration-vl-fast scale-100">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 rounded-full bg-vl-danger/10 flex items-center justify-center text-vl-danger shrink-0 mt-0.5">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-vl-heading text-lg font-bold text-vl-ink">Delete Shipping Address?</h3>
                <p className="text-xs text-vl-muted leading-relaxed">
                  This action is permanent. This address will be deleted from your saved address directory and cannot be recovered.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-vl-border">
              <button
                type="button"
                onClick={() => setAddressToDeleteId(null)}
                className="inline-flex min-h-11 items-center justify-center rounded-vl-control border border-vl-border bg-vl-card px-5 text-sm font-semibold text-vl-ink hover:border-vl-primary hover:text-vl-primary transition-all active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-danger px-5 text-sm font-bold text-white hover:bg-vl-danger-strong transition-all active:scale-95 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
