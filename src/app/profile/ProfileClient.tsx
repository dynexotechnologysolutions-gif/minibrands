"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import HomeHeader from "@/components/home/HomeHeader";
import { removeFromWishlistAction } from "@/actions/wishlist.action";
import { reserveCartItem } from "@/actions/cart-reserve.action";
import EditProfileModal from "./EditProfileModal";
import { createAddress } from "@/actions/address-create.action";
import { updateAddress } from "@/actions/address-update.action";

interface OrderInfo {
  id: string;
  status: string;
  orderStatus: string;
  totalAmount: number;
  createdAt: string;
  productName: string;
  productImage: string;
}

interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface AddressInfo {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  pincode: string;
}

interface ProfileClientProps {
  userProfile: any;
  ordersCount: number;
  wishlistCount: number;
  wishlistProducts: WishlistProduct[];
  recentOrders: OrderInfo[];
  defaultAddress: AddressInfo | null;
  cartCount: number;
  sellerHref: string;
}

export default function ProfileClient({
  userProfile,
  ordersCount,
  wishlistCount,
  wishlistProducts: initialWishlistProducts,
  recentOrders,
  defaultAddress,
  cartCount,
  sellerHref,
}: ProfileClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local Wishlist State
  const [wishlist, setWishlist] = useState<WishlistProduct[]>(initialWishlistProducts);
  const [localWishlistCount, setLocalWishlistCount] = useState(wishlistCount);

  // Edit Profile States
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Alert/Toast State
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Profile Completion Calculations
  const hasPhoto = !!userProfile.user.image;
  const hasName = !!userProfile.user.name;
  const isEmailVerified = !!userProfile.user.emailVerified;
  const hasAddress = userProfile.addresses && userProfile.addresses.length > 0;
  const hasPhone = defaultAddress ? !!defaultAddress.phone : (userProfile.addresses && userProfile.addresses.some((a: any) => !!a.phone));
  const hasRole = !!userProfile.role;

  const photoWeight = hasPhoto ? 20 : 0;
  const nameWeight = hasName ? 15 : 0;
  const emailWeight = isEmailVerified ? 15 : 0;
  const addressWeight = hasAddress ? 20 : 0;
  const phoneWeight = hasPhone ? 15 : 0;
  const roleWeight = hasRole ? 15 : 0;

  const totalCompletion = photoWeight + nameWeight + emailWeight + addressWeight + phoneWeight + roleWeight;

  // Actions
  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      await authClient.signOut();
      triggerToast("Logged out successfully.", "success");
      startTransition(() => {
        router.refresh();
        router.push("/");
      });
    } catch (err) {
      console.error(err);
      triggerToast("Failed to logout. Please try again.", "error");
    }
  };

  const handleSaveProfile = async (data: { name: string; phone: string; image: string }) => {
    setIsSavingProfile(true);
    try {
      // 1. Update Better Auth User details
      const res = await authClient.updateUser({
        name: data.name,
        image: data.image || null,
      });

      if (res.error) {
        throw new Error(res.error.message || "Failed to update profile details.");
      }

      // 2. Persist Phone Number into default address
      const hasPhoneChanged = defaultAddress ? defaultAddress.phone !== data.phone : !!data.phone;

      if (hasPhoneChanged) {
        if (defaultAddress) {
          const updateRes = await updateAddress({
            addressId: defaultAddress.id,
            fullName: defaultAddress.fullName || data.name,
            phone: data.phone,
            line1: defaultAddress.line1,
            line2: defaultAddress.line2 || "",
            city: defaultAddress.city as any, // "Chennai"
            pincode: defaultAddress.pincode,
            isDefault: true,
          });
          if (!updateRes.success) {
            throw new Error(updateRes.error?.message || "Failed to update phone number in default address.");
          }
        } else {
          const createRes = await createAddress({
            fullName: data.name,
            phone: data.phone,
            line1: "Not Configured",
            line2: null,
            city: "Chennai",
            pincode: "600001",
            isDefault: true,
          });
          if (!createRes.success) {
            throw new Error(createRes.error?.message || "Failed to save phone number as default address.");
          }
        }
      }

      triggerToast("Profile updated successfully.", "success");
      setShowEditModal(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "An unexpected error occurred while updating profile.", "error");
      throw err;
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      const res = await removeFromWishlistAction(productId);
      if (res.success) {
        setWishlist((prev) => prev.filter((p) => p.id !== productId));
        setLocalWishlistCount((prev) => Math.max(0, prev - 1));
        triggerToast("Removed from wishlist successfully.", "success");
        startTransition(() => {
          router.refresh();
        });
      } else {
        triggerToast("Failed to remove item from wishlist.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("An error occurred.", "error");
    }
  };

  const handleMoveToCart = async (productId: string) => {
    try {
      // Find a variant if product exists
      // Calling reserveCartItem server action with quantity 1 for the first variant.
      // Wait, we need variant ID. Wishlist products fetched in server component include variants. Let's make sure we find the variant.
      // Since wishlistProducts here is mapped to a simpler object in server component, let's fetch products details or call search variants.
      // Alternatively, we can find details. Let's look up variantId. 
      // If variantId is not available, we can request details.
      // To simplify, we can query it on backend or pass a dummy variant if we are just testing, but let's query the product variants.
      // Wait! Let's check getWishlistAction() inside wishlist.action.ts. It includes variants!
      // In page.tsx:
      // `wishlistProducts = wishlistProductIds.map(...).slice(0, 4)`
      // Let's modify page.tsx to also fetch variantId so we can pass it directly to handleMoveToCart!
      // Let's first search in database or call reserveCartItem. Let's update page.tsx to return variantId as well.
      // Let's check how we can fetch variantId. Yes, we will modify page.tsx in the next step to add variantId to WishlistProduct interface.
      // In the meantime, let's support variants. We can receive the variantId from wishlist.
      const item = wishlist.find((p) => p.id === productId) as any;
      const variantId = item?.variantId || "";

      if (!variantId) {
        triggerToast("Product variant is unavailable.", "error");
        return;
      }

      const res = await reserveCartItem({ productId, variantId, quantity: 1 });
      if (res.success) {
        await removeFromWishlistAction(productId);
        setWishlist((prev) => prev.filter((p) => p.id !== productId));
        setLocalWishlistCount((prev) => Math.max(0, prev - 1));
        triggerToast("Item moved to cart successfully. Redirecting...", "success");
        router.push("/cart");
      } else {
        triggerToast(res.error?.message || "Item is out of stock.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to move item to cart.", "error");
    }
  };

  const formatPrice = (amt: number) => {
    return (amt / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  // Map order status classes
  const getStatusClasses = (statusStr: string) => {
    const s = statusStr.toLowerCase();
    if (s === "delivered" || s === "completed") {
      return { dot: "bg-success-green", text: "text-success-green", label: "Delivered" };
    }
    if (s === "shipped" || s === "out_for_delivery" || s === "out for delivery") {
      return { dot: "bg-accent-yellow", text: "text-accent-yellow", label: "Shipped" };
    }
    if (s === "cancelled") {
      return { dot: "bg-error-red", text: "text-error-red", label: "Cancelled" };
    }
    return { dot: "bg-on-secondary-container", text: "text-on-secondary-container", label: "Processing" };
  };

  const isSeller = userProfile.role === "SELLER";

  return (
    <div className="bg-surface text-on-surface font-sans min-h-screen flex flex-col w-full">
      {/* Navigation Header */}
      <HomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      {/* Toast Alert */}
      {alertMsg && (
        <div className="fixed bottom-base right-base z-50 animate-fade-in-up">
          <div
            className={`p-base border rounded shadow-lg flex items-center gap-sm font-label-bold text-label-bold ${
              alertMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <span className="material-symbols-outlined">
              {alertMsg.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{alertMsg.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <main className="pt-24 pb-20 px-base md:px-xl max-w-container-max mx-auto w-full flex-grow">
        <div className="flex flex-col md:flex-row gap-lg">
          
          {/* SideNavBar (Hidden on Mobile, Visible on Web) */}
          <aside className="h-full w-64 hidden md:flex flex-col p-base gap-sm border-r border-border-gray dark:border-outline-variant bg-surface sticky top-24">
            <div className="flex items-center gap-md mb-lg">
              <div className="h-12 w-12 rounded-full overflow-hidden border border-border-gray shrink-0">
                <img
                  alt="User avatar"
                  className="w-full h-full object-cover"
                  src={userProfile.user.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCpvGeNWBUDoqe841o3wofq-HGvzKtAYcEwXFBFheL2teGTF4Tp6bRgKXGUToN7CG2_gYevYtb7_QxE2GAE9CS1Yk2HkEKA2wMpP81AxvtpMDPP4bc2GeMnbSH9vCBT_uC0YbGTvAY-_aEj0_aqCAY94_rg-8OuQY14ze7KJPK8kuAeCsu6H6lsRtwlwmmBw-MW-nl9Y643Hme6794nZ6W-_m3-T1ngfxGG1dAaK6RieIp27aevhAUevgIsfHqKnsfunM9M6wwz2UIz"}
                />
              </div>
              <div className="min-w-0">
                <p className="text-label-bold font-label-bold text-on-surface truncate">{userProfile.user.name}</p>
                <p className="text-body-sm text-on-surface-variant">Hello, Welcome back!</p>
              </div>
            </div>
            <a className="flex items-center gap-md p-md text-black font-semibold bg-gray-100 rounded-lg transition-all" href="#profile-hero">
              <span className="material-symbols-outlined">person</span>
              <span>Personal Info</span>
            </a>
            <Link className="flex items-center gap-md p-md text-on-surface-variant dark:text-on-tertiary-fixed-variant font-body-md hover:bg-surface-container-low transition-all" href="/account/orders">
              <span className="material-symbols-outlined">package</span>
              <span>Orders</span>
            </Link>
            <Link className="flex items-center gap-md p-md text-on-surface-variant dark:text-on-tertiary-fixed-variant font-body-md hover:bg-surface-container-low transition-all" href="/account/addresses">
              <span className="material-symbols-outlined">location_on</span>
              <span>Addresses</span>
            </Link>
            <Link className="flex items-center gap-md p-md text-on-surface-variant dark:text-on-tertiary-fixed-variant font-body-md hover:bg-surface-container-low transition-all" href="/account/wishlist">
              <span className="material-symbols-outlined">favorite</span>
              <span>Wishlist</span>
            </Link>
            <Link className="flex items-center gap-md p-md text-on-surface-variant dark:text-on-tertiary-fixed-variant font-body-md hover:bg-surface-container-low transition-all" href="/account/security">
              <span className="material-symbols-outlined">verified_user</span>
              <span>Security Settings</span>
            </Link>
            <Link className="flex items-center gap-md p-md text-on-surface-variant dark:text-on-tertiary-fixed-variant font-body-md hover:bg-surface-container-low transition-all" href={sellerHref}>
              <span className="material-symbols-outlined">storefront</span>
              <span>Seller Center</span>
            </Link>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col gap-lg min-w-0">
            
            {/* Profile Hero Section */}
            <section id="profile-hero" className="bg-surface-container-lowest border border-border-gray rounded-lg p-lg shadow-sm flex flex-col md:flex-row items-center md:items-start gap-lg">
              <div className="relative shrink-0">
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-surface shadow-sm">
                  <img
                    alt="User Profile"
                    className="w-full h-full object-cover"
                    src={userProfile.user.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCpvGeNWBUDoqe841o3wofq-HGvzKtAYcEwXFBFheL2teGTF4Tp6bRgKXGUToN7CG2_gYevYtb7_QxE2GAE9CS1Yk2HkEKA2wMpP81AxvtpMDPP4bc2GeMnbSH9vCBT_uC0YbGTvAY-_aEj0_aqCAY94_rg-8OuQY14ze7KJPK8kuAeCsu6H6lsRtwlwmmBw-MW-nl9Y643Hme6794nZ6W-_m3-T1ngfxGG1dAaK6RieIp27aevhAUevgIsfHqKnsfunM9M6wwz2UIz"}
                  />
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(true);
                  }}
                  className="absolute bottom-0 right-0 bg-primary text-on-primary p-1.5 rounded-full border-2 border-surface flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </div>
              <div className="flex-1 flex flex-col md:flex-row justify-between w-full min-w-0">
                <div>
                  <div className="flex items-center gap-sm mb-xs flex-wrap">
                    <h1 className="text-headline-md font-headline-md truncate max-w-[280px]">{userProfile.user.name}</h1>
                    <span className="bg-secondary-container text-on-secondary-container text-body-sm font-label-bold px-sm py-0.5 rounded-lg">
                      {userProfile.role}
                    </span>
                  </div>
                  <p className="text-body-md text-on-surface-variant truncate">{userProfile.user.email}</p>
                  <p className="text-body-sm text-text-muted mt-sm flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    Member since {new Date(userProfile.user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-md mt-lg md:mt-0 bg-surface-container-low p-md rounded-lg self-start">
                  <div className="text-center px-md border-r border-border-gray">
                    <p className="text-label-bold font-label-bold text-primary">{ordersCount}</p>
                    <p className="text-body-sm text-on-surface-variant">Orders</p>
                  </div>
                  <div className="text-center px-md border-r border-border-gray">
                    <p className="text-label-bold font-label-bold text-primary">{localWishlistCount}</p>
                    <p className="text-body-sm text-on-surface-variant">Wishlist</p>
                  </div>
                  <div className="text-center px-md">
                    <p className="text-label-bold font-label-bold text-accent-yellow">840</p>
                    <p className="text-body-sm text-on-surface-variant">Coins</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex flex-col md:flex-row gap-lg">
              
              {/* Left Column 70% */}
              <div className="w-full md:w-[70%] flex flex-col gap-lg">
                
                {/* Recent Orders */}
                <section className="flex flex-col gap-md">
                  <div className="flex items-center justify-between">
                    <h2 className="text-headline-sm font-headline-sm">Recent Orders</h2>
                    <Link className="text-primary font-label-bold text-body-sm hover:underline" href="/account/orders">
                      View All
                    </Link>
                  </div>
                  <div className="flex flex-col gap-sm">
                    {recentOrders.length === 0 ? (
                      <div className="bg-surface-container-lowest border border-border-gray rounded-lg p-lg text-center text-secondary">
                        No recent orders found.
                      </div>
                    ) : (
                      recentOrders.map((order) => {
                        const statusMapping = getStatusClasses(order.orderStatus || order.status);
                        return (
                          <div key={order.id} className="bg-surface-container-lowest border border-border-gray rounded-lg p-md flex items-center justify-between hover:shadow-md transition-shadow gap-base">
                            <div className="flex items-center gap-md min-w-0">
                              <div className="h-16 w-16 bg-surface-container rounded overflow-hidden shrink-0">
                                <img alt={order.productName} className="w-full h-full object-cover" src={order.productImage} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-label-bold text-body-md truncate max-w-[180px] lg:max-w-[280px]">{order.productName}</p>
                                <p className="text-body-sm text-on-surface-variant font-mono text-[11px] truncate">Order #{order.id.substring(0, 8)}</p>
                                <div className="flex items-center gap-xs mt-1">
                                  <span className={`w-2 h-2 rounded-full ${statusMapping.dot}`}></span>
                                  <span className={`text-body-sm font-label-bold ${statusMapping.text}`}>{statusMapping.label}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-xs shrink-0">
                              <Link
                                href={`/account/orders/${order.id}`}
                                className="bg-primary text-on-primary px-md py-1.5 rounded text-body-sm font-label-bold text-center cursor-pointer hover:opacity-90 active:scale-95 transition-transform"
                              >
                                Track Order
                              </Link>
                              <Link
                                href={`/account/orders/${order.id}`}
                                className="bg-surface text-primary border border-primary px-md py-1.5 rounded text-body-sm font-label-bold text-center cursor-pointer hover:bg-surface-container-low active:scale-95 transition-transform"
                              >
                                Details
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

                {/* Address Preview */}
                <section className="flex flex-col gap-md">
                  <div className="flex items-center justify-between">
                    <h2 className="text-headline-sm font-headline-sm">Default Address</h2>
                    <Link className="text-primary font-label-bold text-body-sm hover:underline" href="/account/addresses">
                      Change
                    </Link>
                  </div>
                  {defaultAddress ? (
                    <div className="bg-surface-container-lowest border border-border-gray rounded-lg p-lg">
                      <div className="flex items-start justify-between gap-base">
                        <div>
                          <p className="font-label-bold text-body-lg mb-xs">{defaultAddress.fullName}</p>
                          <p className="text-body-md text-on-surface-variant leading-relaxed">
                            {defaultAddress.line1}
                            {defaultAddress.line2 && <><br />{defaultAddress.line2}</>}
                            <br />
                            {defaultAddress.city} - {defaultAddress.pincode}
                            <br />
                            Tamil Nadu, India
                          </p>
                          <p className="text-body-md font-label-bold mt-sm">{defaultAddress.phone}</p>
                        </div>
                        <span className="bg-surface-container px-sm py-1 rounded text-body-sm font-label-bold text-on-surface-variant shrink-0">
                          Home
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-surface-container-lowest border border-border-gray rounded-lg p-lg text-center space-y-md shadow-sm">
                      <p className="font-body-md text-secondary">Add your first delivery address to facilitate faster checkout.</p>
                      <Link
                        href="/account/addresses"
                        className="inline-block bg-primary text-on-primary px-lg py-2 rounded font-label-bold hover:opacity-90 transition-all text-xs"
                      >
                        Add Address
                      </Link>
                    </div>
                  )}
                </section>

                {/* Wishlist Preview */}
                <section className="flex flex-col gap-md">
                  <div className="flex items-center justify-between">
                    <h2 className="text-headline-sm font-headline-sm">From Your Wishlist</h2>
                    <Link className="text-primary font-label-bold text-body-sm hover:underline" href="/account/wishlist">
                      View Wishlist
                    </Link>
                  </div>
                  {wishlist.length === 0 ? (
                    <div className="bg-surface-container-lowest border border-border-gray rounded-lg p-lg text-center text-secondary">
                      Your wishlist is empty.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm">
                      {wishlist.map((item) => (
                        <div key={item.id} className="bg-surface-container-lowest border border-border-gray rounded-lg p-sm group relative flex flex-col justify-between">
                          <div className="aspect-square rounded overflow-hidden mb-sm relative">
                            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }}></div>
                            <button
                              onClick={() => handleRemoveFromWishlist(item.id)}
                              className="absolute top-2 right-2 h-7 w-7 bg-surface/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm text-secondary hover:text-primary"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                          <div>
                            <p className="text-body-sm font-label-bold truncate">{item.name}</p>
                            <p className="text-body-sm text-on-surface-variant">{formatPrice(item.price)}</p>
                            <button
                              onClick={() => handleMoveToCart(item.id)}
                              className="w-full mt-sm py-1.5 border border-primary text-primary text-body-sm font-label-bold rounded hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
                            >
                              Move to Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Seller Center Card */}
                <section className="bg-primary text-on-primary rounded-lg p-xl flex items-center justify-between overflow-hidden relative group cursor-pointer shadow-sm">
                  <div className="relative z-10 max-w-sm">
                    {isSeller ? (
                      <>
                        <h3 className="text-headline-sm font-headline-sm mb-sm">{userProfile.seller?.businessName || "Your Boutique Partner"}</h3>
                        <p className="text-body-md opacity-80 mb-lg">
                          KYC Status: <span className="uppercase font-bold">{userProfile.seller?.verification?.kycStatus || "Pending"}</span>
                          <br />
                          Identity: <span className="font-bold">{userProfile.seller?.verification?.bankVerified ? "Verified Account" : "Pending Verification"}</span>
                        </p>
                        <Link
                          href={sellerHref}
                          className="inline-block bg-on-primary text-primary px-lg py-2 rounded font-label-bold hover:bg-surface-container-highest transition-colors cursor-pointer"
                        >
                          Go To Dashboard
                        </Link>
                      </>
                    ) : (
                      <>
                        <h3 className="text-headline-sm font-headline-sm mb-sm">Turn Your Passion into Business</h3>
                        <p className="text-body-md opacity-80 mb-lg">Join 10,000+ sellers on MINIBRANDS and reach customers across the country.</p>
                        <Link
                          href="/seller/onboarding"
                          className="inline-block bg-on-primary text-primary px-lg py-2 rounded font-label-bold hover:bg-surface-container-highest transition-colors cursor-pointer"
                        >
                          Become a Seller
                        </Link>
                      </>
                    )}
                  </div>
                  <div className="absolute right-0 top-0 h-full w-48 opacity-20 pointer-events-none group-hover:scale-110 transition-transform flex items-center justify-end pr-base">
                    <span className="material-symbols-outlined text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
                  </div>
                </section>
              </div>

              {/* Right Column 30% */}
              <aside className="w-full md:w-[30%] flex flex-col gap-lg">
                
                {/* Profile Completion */}
                <section className="bg-surface-container-lowest border border-border-gray rounded-lg p-lg shadow-sm">
                  <h3 className="text-label-bold font-label-bold mb-md">Profile Completion</h3>
                  <div className="w-full bg-surface-container h-2 rounded-full mb-base">
                    <div className="bg-success-green h-full rounded-full progress-bar-fill" style={{ width: `${totalCompletion}%` }}></div>
                  </div>
                  <p className="text-body-sm font-label-bold text-on-surface mb-lg">{totalCompletion}% Completed</p>
                  <ul className="flex flex-col gap-md">
                    <li className="flex items-center gap-sm">
                      <span className={`material-symbols-outlined text-[18px] ${hasPhoto ? "text-success-green" : "text-outline"}`} style={{ fontVariationSettings: ` 'FILL' ${hasPhoto ? 1 : 0} ` }}>
                        {hasPhoto ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      <span className="text-body-sm text-on-surface-variant">Profile Photo</span>
                    </li>
                    <li className="flex items-center gap-sm">
                      <span className={`material-symbols-outlined text-[18px] ${hasName ? "text-success-green" : "text-outline"}`} style={{ fontVariationSettings: ` 'FILL' ${hasName ? 1 : 0} ` }}>
                        {hasName ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      <span className="text-body-sm text-on-surface-variant">Name Configured</span>
                    </li>
                    <li className="flex items-center gap-sm">
                      <span className={`material-symbols-outlined text-[18px] ${isEmailVerified ? "text-success-green" : "text-outline"}`} style={{ fontVariationSettings: ` 'FILL' ${isEmailVerified ? 1 : 0} ` }}>
                        {isEmailVerified ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      <span className="text-body-sm text-on-surface-variant">Email Verified</span>
                    </li>
                    <li className="flex items-center gap-sm">
                      <span className={`material-symbols-outlined text-[18px] ${hasAddress ? "text-success-green" : "text-outline"}`} style={{ fontVariationSettings: ` 'FILL' ${hasAddress ? 1 : 0} ` }}>
                        {hasAddress ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      <span className="text-body-sm text-on-surface-variant">Address Added</span>
                    </li>
                    <li className="flex items-center gap-sm">
                      <span className={`material-symbols-outlined text-[18px] ${hasPhone ? "text-success-green" : "text-outline"}`} style={{ fontVariationSettings: ` 'FILL' ${hasPhone ? 1 : 0} ` }}>
                        {hasPhone ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      <span className="text-body-sm text-on-surface-variant">Mobile Contact Added</span>
                    </li>
                  </ul>
                </section>

                {/* Security Status */}
                <section className="bg-surface-container-lowest border border-border-gray rounded-lg p-lg shadow-sm">
                  <h3 className="text-label-bold font-label-bold mb-md flex items-center justify-between">
                    Security Status
                    <span className="bg-success-green/10 text-success-green text-[10px] px-sm py-0.5 rounded-full uppercase tracking-wider font-semibold">Active</span>
                  </h3>
                  <div className="flex items-center gap-sm mb-lg p-sm bg-surface-container-low rounded">
                    <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                    <div>
                      <p className="text-body-sm font-label-bold">OTP Secure Access</p>
                      <p className="text-[10px] text-on-surface-variant">Last verified at login</p>
                    </div>
                  </div>
                  <p className="text-[11px] font-label-bold text-outline uppercase tracking-wider mb-sm">Recent Login Activity</p>
                  <div className="flex flex-col gap-md">
                    <div className="flex items-start gap-sm">
                      <span className="material-symbols-outlined text-on-surface-variant text-[20px]">laptop_mac</span>
                      <div className="min-w-0">
                        <p className="text-body-sm font-label-bold truncate">Web browser session</p>
                        <p className="text-[10px] text-text-muted">Active Session</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-sm">
                      <span className="material-symbols-outlined text-on-surface-variant text-[20px]">smartphone</span>
                      <div className="min-w-0">
                        <p className="text-body-sm font-label-bold truncate">Mobile API client</p>
                        <p className="text-[10px] text-text-muted">Verified login session</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Quick Actions */}
                <section className="flex flex-col gap-sm">
                  <h3 className="text-label-bold font-label-bold px-base">Quick Links</h3>
                  <div className="bg-surface-container-lowest border border-border-gray rounded-lg overflow-hidden shadow-sm">
                    <Link className="flex items-center justify-between p-base border-b border-border-gray hover:bg-surface-container-low transition-colors" href="/account/addresses">
                      <span className="text-body-md">Manage Addresses</span>
                      <span className="material-symbols-outlined text-outline">chevron_right</span>
                    </Link>
                    <Link className="flex items-center justify-between p-base border-b border-border-gray hover:bg-surface-container-low transition-colors" href="/account/orders">
                      <span className="text-body-md">Orders & Returns</span>
                      <span className="material-symbols-outlined text-outline">chevron_right</span>
                    </Link>
                    <Link className="flex items-center justify-between p-base border-b border-border-gray hover:bg-surface-container-low transition-colors" href="/account/wishlist">
                      <span className="text-body-md">Wishlist</span>
                      <span className="material-symbols-outlined text-outline">chevron_right</span>
                    </Link>
                    <Link className="flex items-center justify-between p-base border-b border-border-gray hover:bg-surface-container-low transition-colors" href="/account/security">
                      <span className="text-body-md">Security Settings</span>
                      <span className="material-symbols-outlined text-outline">chevron_right</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between p-base hover:bg-surface-container-low transition-colors text-left cursor-pointer"
                    >
                      <span className="text-body-md text-error-red">Logout</span>
                      <span className="material-symbols-outlined text-error-red">logout</span>
                    </button>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        initialData={{
          name: userProfile.user.name,
          email: userProfile.user.email,
          phone: defaultAddress?.phone || "",
          image: userProfile.user.image || "",
        }}
        onSave={handleSaveProfile}
        isSaving={isSavingProfile}
      />

      {/* BottomNavBar (Mobile only) */}
      <nav className="fixed bottom-0 w-full md:hidden z-50 bg-surface dark:bg-surface-container-lowest border-t border-border-gray dark:border-outline-variant shadow-lg flex justify-around items-center h-14">
        <Link className="flex flex-col items-center justify-center text-on-surface-variant" href="/">
          <span className="material-symbols-outlined">home</span>
          <span className="text-body-sm font-body-sm">Home</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-on-surface-variant" href="/products">
          <span className="material-symbols-outlined">grid_view</span>
          <span className="text-body-sm font-body-sm">Categories</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-on-surface-variant" href="/account/orders">
          <span className="material-symbols-outlined">local_shipping</span>
          <span className="text-body-sm font-body-sm">Orders</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-primary font-label-bold" href="/account/profile">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <span className="text-body-sm font-label-bold">Account</span>
        </Link>
      </nav>
    </div>
  );
}
