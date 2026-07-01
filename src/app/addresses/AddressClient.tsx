"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddressCreateInput>({
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
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("permission denied") || err.message?.includes("Permission denied")) {
        setLocationStatus("Permission Denied");
      } else {
        setLocationStatus("GPS Error");
      }
      alert(err.message || "GPS detection failed. Please move closer to a window.");
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
    } catch (err: any) {
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
    setValue("latitude", (addr as any).latitude || null);
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
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
    <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col w-full">
      {/* TopNavBar */}
      <HomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      {/* Main Content Canvas */}
      <main className="pt-24 pb-xxl px-base md:px-lg max-w-container-max mx-auto min-h-screen w-full flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start">
          {/* Left Side: Address Selection */}
          <div className={`${isCheckoutFlow ? "lg:col-span-8" : "lg:col-span-12 max-w-4xl mx-auto w-full"} space-y-xl`}>
            <header>
              <h1 className="font-headline-lg text-headline-lg text-primary mb-xs">
                {isCheckoutFlow ? "Select Delivery Address" : "Manage Delivery Addresses"}
              </h1>
              <p className="font-body-md text-secondary">
                {isCheckoutFlow
                  ? "Choose a saved address or add a new one to proceed with your order."
                  : "Add, edit, or delete your shipping addresses below."}
              </p>
            </header>

            {/* Geolocation Detector Card */}
            <div className="bg-surface-container-low border border-border-gray p-base rounded-lg flex flex-col sm:flex-row items-center justify-between gap-base">
              <div className="flex items-center gap-md">
                <span className="material-symbols-outlined text-primary text-[24px]">location_on</span>
                <div>
                  <h3 className="font-label-bold text-primary">Use Current Location</h3>
                  <p className="font-body-sm text-secondary">
                    {locationStatus ? `Status: ${locationStatus}` : "Detect your GPS coordinates to automatically fill address fields."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDetectCurrentLocation}
                disabled={isDetectingLocation}
                className="bg-primary text-on-primary px-lg py-sm rounded font-label-bold text-label-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 select-none whitespace-nowrap"
              >
                {isDetectingLocation ? "Detecting..." : "Detect Location"}
              </button>
            </div>

            {/* Saved Addresses Section */}
            <section className="space-y-base">
              <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-sm">
                <span className="material-symbols-outlined">home</span> Saved Addresses
              </h2>

              {addresses.length === 0 ? (
                <div className="p-base bg-white border border-border-gray rounded-lg text-center text-secondary py-12">
                  <p className="font-body-md">No saved addresses found. Please add a new shipping address below.</p>
                </div>
              ) : (
                <div className="space-y-base">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    const isLoading = isActionLoading === addr.id;
                    return (
                      <div key={addr.id} className="relative radio-card-wrapper">
                        <input
                          checked={isSelected}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="hidden peer radio-card"
                          id={`addr_${addr.id}`}
                          name="address"
                          type="radio"
                        />
                        <label
                          className={`block p-base bg-white border rounded-lg cursor-pointer hover:border-primary transition-all duration-200 ${isSelected
                              ? "border-primary ring-1 ring-primary"
                              : "border-border-gray"
                            }`}
                          htmlFor={`addr_${addr.id}`}
                        >
                          <div className="flex justify-between items-end">
                            <div className="space-y-xs">
                              <div className="flex items-center gap-base">
                                <span className="font-label-bold text-label-bold text-primary">{addr.fullName}</span>
                                {addr.isDefault && (
                                  <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="font-body-md text-secondary">{addr.phone}</p>
                              <p className="font-body-md text-on-surface leading-relaxed">
                                {addr.line1}
                                {addr.line2 && <><br />{addr.line2}</>}
                                <br />
                                {addr.city} - {addr.pincode}
                              </p>
                            </div>

                            <div className="flex items-center gap-base">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleEdit(addr);
                                }}
                                className="text-secondary hover:text-primary transition-colors flex items-center gap-xs font-label-bold text-label-bold cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit</span> Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDelete(addr.id);
                                }}
                                disabled={isLoading}
                                className="text-error-red hover:opacity-85 transition-colors flex items-center gap-xs font-label-bold text-label-bold cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span> Delete
                              </button>
                            </div>
                          </div>
                        </label>
                        {isSelected && (
                          <div className="absolute top-base right-xl pointer-events-none">
                            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                              check_circle
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {!isCheckoutFlow && (
                    <div className="pt-md flex justify-start">
                      <button
                        onClick={handleConfirmAddress}
                        disabled={isSettingDefault}
                        className="bg-primary text-on-primary px-xl py-3 font-label-bold text-label-bold rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                      >
                        {isSettingDefault ? "Updating Profile..." : "Confirm Profile Address"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            <div className="h-px bg-border-gray w-full"></div>

            {/* Add/Edit Address Form Section */}
            <section id="address-form-section" className="space-y-base">
              <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-sm">
                <span className="material-symbols-outlined">{editingAddressId ? "edit_location" : "add_location"}</span>
                {editingAddressId ? "Edit Delivery Address" : "Add New Address"}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-base md:p-xl border border-border-gray rounded-lg space-y-lg">
                {formError && (
                  <div className="p-3 bg-error-container border border-error text-on-error-container rounded text-xs font-bold">
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
                  <div className="space-y-xs">
                    <label className="font-label-bold text-label-bold text-on-surface">Full Name</label>
                    <input
                      {...register("fullName")}
                      className="w-full border-border-gray rounded focus:ring-primary focus:border-primary font-body-md"
                      placeholder="Enter your name"
                      type="text"
                    />
                    {errors.fullName && (
                      <p className="text-error-red text-xs font-semibold">{errors.fullName.message}</p>
                    )}
                  </div>
                  <div className="space-y-xs">
                    <label className="font-label-bold text-label-bold text-on-surface">Mobile Number</label>
                    <input
                      {...register("phone")}
                      className="w-full border-border-gray rounded focus:ring-primary focus:border-primary font-body-md"
                      placeholder="10-digit mobile number"
                      type="tel"
                    />
                    {errors.phone && (
                      <p className="text-error-red text-xs font-semibold">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-xs">
                  <label className="font-label-bold text-label-bold text-on-surface">Address Line 1 (House No, Building, Street)</label>
                  <input
                    {...register("line1")}
                    className="w-full border-border-gray rounded focus:ring-primary focus:border-primary font-body-md"
                    placeholder="Enter address"
                    type="text"
                  />
                  {errors.line1 && (
                    <p className="text-error-red text-xs font-semibold">{errors.line1.message}</p>
                  )}
                </div>

                <div className="space-y-xs">
                  <label className="font-label-bold text-label-bold text-on-surface">Address Line 2 (Locality, Area)</label>
                  <input
                    {...register("line2")}
                    className="w-full border-border-gray rounded focus:ring-primary focus:border-primary font-body-md"
                    placeholder="Enter locality"
                    type="text"
                  />
                  {errors.line2 && (
                    <p className="text-error-red text-xs font-semibold">{errors.line2.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
                  <div className="space-y-xs">
                    <label className="font-label-bold text-label-bold text-on-surface">City / District</label>
                    <select
                      {...register("city")}
                      className="w-full border-border-gray bg-slate-50 rounded focus:ring-primary focus:border-primary font-body-md cursor-not-allowed"
                      disabled
                    >
                      <option value="Chennai">Chennai</option>
                    </select>
                    <p className="text-[10px] text-slate-400 font-medium">Currently delivering across Chennai only.</p>
                  </div>
                  <div className="space-y-xs">
                    <label className="font-label-bold text-label-bold text-on-surface">Pincode</label>
                    <input
                      {...register("pincode")}
                      className="w-full border-border-gray rounded focus:ring-primary focus:border-primary font-body-md"
                      placeholder="6-digit pincode"
                      type="text"
                    />
                    {errors.pincode && (
                      <p className="text-error-red text-xs font-semibold">{errors.pincode.message}</p>
                    )}
                  </div>
                </div>

                <input type="hidden" {...register("latitude", { valueAsNumber: true })} />
                <input type="hidden" {...register("longitude", { valueAsNumber: true })} />

                <div className="flex items-center gap-sm">
                  <input
                    {...register("isDefault")}
                    className="rounded border-border-gray text-primary focus:ring-primary cursor-pointer"
                    id="set_default"
                    type="checkbox"
                  />
                  <label className="font-body-md text-on-surface cursor-pointer select-none" htmlFor="set_default">
                    Make this my default address
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-base pt-md">
                  <button
                    disabled={isSubmitting}
                    className="bg-primary text-on-primary px-xl py-3 font-label-bold text-label-bold rounded-lg hover:opacity-90 transition-opacity flex-1 sm:flex-none min-w-[200px] cursor-pointer disabled:opacity-55"
                    type="submit"
                  >
                    {isSubmitting ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleCancelEdit();
                    }}
                    className="border border-primary text-primary px-xl py-3 font-label-bold text-label-bold rounded-lg hover:bg-surface-container-low transition-colors flex-1 sm:flex-none cursor-pointer"
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          </div>

          {isCheckoutFlow && (
            /* Right Side: Order Summary / Checkout Sticky */
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-lg">
                <div className="bg-white border border-border-gray rounded-lg p-base space-y-base shadow-sm">
                  <h3 className="font-headline-sm text-headline-sm text-primary">Price Details</h3>
                  <div className="space-y-md border-b border-border-gray pb-base">
                    <div className="flex justify-between font-body-md text-secondary">
                      <span>Price ({activeItemsCount} {activeItemsCount === 1 ? "item" : "items"})</span>
                      <span>{formatCurrency(originalPrice)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between font-body-md text-secondary">
                        <span>Discount</span>
                        <span className="text-success-green">-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-body-md text-secondary">
                      <span>Delivery Charges</span>
                      <span className="text-success-green">FREE</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-price-lg text-price-lg text-primary pt-xs">
                    <span>Total Amount</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <p className="font-body-sm text-success-green font-semibold">
                      You will save {formatCurrency(discount)} on this order
                    </p>
                  )}
                  <button
                    onClick={handleDeliverHere}
                    disabled={addresses.length === 0 || !selectedAddressId}
                    className="w-full bg-accent-yellow text-primary py-4 rounded-lg font-label-bold text-label-bold shadow-sm hover:brightness-105 transition-all active:scale-[0.98] mt-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    DELIVER HERE
                  </button>
                  <p className="text-center font-body-sm text-on-surface-variant">Safe and Secure Payments. 100% Authentic products.</p>
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-3 gap-base text-center">
                  <div className="flex flex-col items-center gap-xs">
                    <span className="material-symbols-outlined text-secondary">verified_user</span>
                    <span className="font-body-sm text-on-surface-variant">Secure</span>
                  </div>
                  <div className="flex flex-col items-center gap-xs">
                    <span className="material-symbols-outlined text-secondary">local_shipping</span>
                    <span className="font-body-sm text-on-surface-variant">Fast Delivery</span>
                  </div>
                  <div className="flex flex-col items-center gap-xs">
                    <span className="material-symbols-outlined text-secondary">keyboard_return</span>
                    <span className="font-body-sm text-on-surface-variant">Easy Returns</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-xxl bg-surface-container-high dark:bg-surface-container-high border-t border-border-gray dark:border-outline-variant">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-base px-base py-xl max-w-container-max mx-auto">
          <div className="space-y-md">
            <span className="font-headline-sm text-headline-sm font-bold text-primary dark:text-primary">MINIBRANDS</span>
            <p className="font-body-sm text-on-surface-variant leading-relaxed">
              India's leading destination for curated brands and exclusive collections. Experience the future of commerce.
            </p>
            <div className="flex gap-base">
              <a className="text-secondary hover:text-primary transition-all" href="#"><span className="material-symbols-outlined">public</span></a>
              <a className="text-secondary hover:text-primary transition-all" href="#"><span className="material-symbols-outlined">alternate_email</span></a>
            </div>
          </div>
          <div className="space-y-md">
            <h4 className="font-label-bold text-label-bold text-primary">Company</h4>
            <ul className="space-y-sm">
              <li><a className="font-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">About Us</a></li>
              <li><a className="font-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">Careers</a></li>
              <li><a className="font-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">Terms of Service</a></li>
            </ul>
          </div>
          <div className="space-y-md">
            <h4 className="font-label-bold text-label-bold text-primary">Policies</h4>
            <ul className="space-y-sm">
              <li><a className="font-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">Privacy Policy</a></li>
              <li><a className="font-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">Return Policy</a></li>
              <li><a className="font-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">Refund Policy</a></li>
            </ul>
          </div>
          <div className="space-y-md">
            <h4 className="font-label-bold text-label-bold text-primary">Help & Support</h4>
            <ul className="space-y-sm">
              <li><a className="font-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">Contact Us</a></li>
              <li><a className="font-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">FAQs</a></li>
              <li><a className="font-body-sm text-on-surface-variant hover:underline hover:text-primary transition-all duration-200" href="#">Track Order</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border-gray px-base py-base">
          <div className="max-w-container-max mx-auto flex flex-col md:row justify-between items-center gap-sm">
            <p className="font-body-sm text-on-surface-variant">© 2024 MINIBRANDS India. All rights reserved.</p>
            <div className="flex gap-base grayscale opacity-60">
              <span className="material-symbols-outlined">credit_card</span>
              <span className="material-symbols-outlined">account_balance</span>
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
