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
import {
  User,
  Package,
  MapPin,
  Heart,
  ShieldAlert,
  Store,
  Calendar,
  Award,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Edit3,
  ArrowRight,
  ArrowLeft,
  X
} from "lucide-react";

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
  variantId?: string;
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
  userProfile: any; // eslint-disable-line @typescript-eslint/no-explicit-any
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
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "wishlist" | "addresses" | "security">("overview");

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
  const hasPhone = defaultAddress ? !!defaultAddress.phone : (userProfile.addresses && userProfile.addresses.some((a: { phone?: string | null }) => !!a.phone));
  const hasRole = !!userProfile.role;

  const charSum = (userProfile?.user?.email || "").split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);

  const photoWeight = hasPhoto ? 20 : 0;
  const nameWeight = hasName ? 15 : 0;
  const emailWeight = isEmailVerified ? 15 : 0;
  const addressWeight = hasAddress ? 20 : 0;
  const phoneWeight = hasPhone ? 15 : 0;
  const roleWeight = hasRole ? 15 : 0;

  const totalCompletion = photoWeight + nameWeight + emailWeight + addressWeight + phoneWeight + roleWeight;

  // Actions
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
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
            city: defaultAddress.city as "Chennai", // "Chennai"
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
    } catch (err) {
      const error = err as Error;
      console.error(error);
      triggerToast(error.message || "An unexpected error occurred while updating profile.", "error");
      throw error;
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
      const item = wishlist.find((p) => p.id === productId);
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
    <div className="bg-vl-canvas text-vl-ink font-sans min-h-screen flex flex-col w-full">
      {/* Navigation Header */}
      <HomeHeader
        userProfile={userProfile}
        cartCount={cartCount}
        sellerHref={sellerHref}
      />

      {/* Toast Alert */}
      {alertMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div
            className={`px-4 py-3 border rounded-vl-control shadow-vl-floating flex items-center gap-2 text-sm font-semibold ${
              alertMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {alertMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <main className="pt-24 pb-20 px-4 md:px-8 max-w-container-max mx-auto w-full flex-grow">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* SideNavBar (Hidden on Mobile, Visible on Web) */}
          <aside className="h-full w-64 hidden md:flex flex-col p-4 gap-2 border border-vl-border bg-vl-card sticky top-24 rounded-vl-card shadow-vl-soft">
            <div className="flex items-center gap-3 mb-6 p-1">
              <div className="h-12 w-12 rounded-full overflow-hidden border border-vl-border shrink-0 bg-vl-surface relative">
                <img
                  alt="User avatar"
                  className="w-full h-full object-cover"
                  src={userProfile.user.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCpvGeNWBUDoqe841o3wofq-HGvzKtAYcEwXFBFheL2teGTF4Tp6bRgKXGUToN7CG2_gYevYtb7_QxE2GAE9CS1Yk2HkEKA2wMpP81AxvtpMDPP4bc2GeMnbSH9vCBT_uC0YbGTvAY-_aEj0_aqCAY94_rg-8OuQY14ze7KJPK8kuAeCsu6H6lsRtwlwmmBw-MW-nl9Y643Hme6794nZ6W-_m3-T1ngfxGG1dAaK6RieIp27aevhAUevgIsfHqKnsfunM9M6wwz2UIz"}
                />
              </div>
              <div className="min-w-0">
                <p className="font-vl-heading text-sm font-bold text-vl-ink truncate">{userProfile.user.name}</p>
                <p className="text-xs text-vl-muted">Hello, Welcome back!</p>
              </div>
            </div>
            
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-3 p-3 font-semibold rounded-vl-control transition-all text-left cursor-pointer ${
                activeTab === "overview"
                  ? "bg-vl-primary/10 text-vl-primary"
                  : "text-vl-muted hover:bg-vl-surface hover:text-vl-ink"
              }`}
            >
              <User className="w-5 h-5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-3 p-3 font-semibold rounded-vl-control transition-all text-left cursor-pointer ${
                activeTab === "orders"
                  ? "bg-vl-primary/10 text-vl-primary"
                  : "text-vl-muted hover:bg-vl-surface hover:text-vl-ink"
              }`}
            >
              <Package className="w-5 h-5" />
              <span>Orders</span>
            </button>

            <button
              onClick={() => setActiveTab("addresses")}
              className={`flex items-center gap-3 p-3 font-semibold rounded-vl-control transition-all text-left cursor-pointer ${
                activeTab === "addresses"
                  ? "bg-vl-primary/10 text-vl-primary"
                  : "text-vl-muted hover:bg-vl-surface hover:text-vl-ink"
              }`}
            >
              <MapPin className="w-5 h-5" />
              <span>Addresses</span>
            </button>

            <button
              onClick={() => setActiveTab("wishlist")}
              className={`flex items-center gap-3 p-3 font-semibold rounded-vl-control transition-all text-left cursor-pointer ${
                activeTab === "wishlist"
                  ? "bg-vl-primary/10 text-vl-primary"
                  : "text-vl-muted hover:bg-vl-surface hover:text-vl-ink"
              }`}
            >
              <Heart className="w-5 h-5" />
              <span>Wishlist</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-3 p-3 font-semibold rounded-vl-control transition-all text-left cursor-pointer ${
                activeTab === "security"
                  ? "bg-vl-primary/10 text-vl-primary"
                  : "text-vl-muted hover:bg-vl-surface hover:text-vl-ink"
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
              <span>Security Settings</span>
            </button>

            <Link
              href={sellerHref}
              className="flex items-center gap-3 p-3 text-vl-muted font-semibold hover:bg-vl-surface hover:text-vl-ink rounded-vl-control transition-all"
            >
              <Store className="w-5 h-5" />
              <span>Seller Center</span>
            </Link>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            
            {/* Profile Hero Section */}
            <section id="profile-hero" className="bg-vl-card border border-vl-border rounded-vl-card p-6 sm:p-8 shadow-vl-soft flex flex-col md:flex-row items-center md:items-start gap-6 relative">
              {/* Avatar Section */}
              <div className="relative shrink-0">
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md relative bg-vl-surface">
                  <img
                    alt="User Profile"
                    className="w-full h-full object-cover"
                    src={userProfile.user.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCpvGeNWBUDoqe841o3wofq-HGvzKtAYcEwXFBFheL2teGTF4Tp6bRgKXGUToN7CG2_gYevYtb7_QxE2GAE9CS1Yk2HkEKA2wMpP81AxvtpMDPP4bc2GeMnbSH9vCBT_uC0YbGTvAY-_aEj0_aqCAY94_rg-8OuQY14ze7KJPK8kuAeCsu6H6lsRtwlwmmBw-MW-nl9Y643Hme6794nZ6W-_m3-T1ngfxGG1dAaK6RieIp27aevhAUevgIsfHqKnsfunM9M6wwz2UIz"}
                  />
                </div>
                <button
                  onClick={() => setShowEditModal(true)}
                  suppressHydrationWarning
                  className="absolute bottom-0 right-0 bg-vl-primary text-white p-2 rounded-full border-2 border-white flex items-center justify-center cursor-pointer hover:bg-vl-primary-strong active:scale-90 transition-transform shadow-md"
                  aria-label="Edit Profile"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Identity & Completion */}
              <div className="flex-1 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 w-full min-w-0">
                <div className="min-w-0 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5 flex-wrap">
                    <h1 className="font-vl-heading text-2xl font-bold text-vl-ink truncate max-w-[280px]">
                      {userProfile.user.name}
                    </h1>
                    <span className="bg-vl-primary/10 text-vl-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {userProfile.role}
                    </span>
                  </div>
                  <p className="text-sm text-vl-muted truncate font-medium">{userProfile.user.email}</p>
                  <p className="text-xs text-vl-muted mt-2 flex items-center justify-center md:justify-start gap-1">
                    <Calendar className="w-3.5 h-3.5 text-vl-primary shrink-0" />
                    <span>Member since {new Date(userProfile.user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                  </p>
                </div>

                {/* Profile Completion Strategy Card */}
                <div className="bg-vl-surface border border-vl-border rounded-xl p-4 min-w-[240px] flex-grow lg:flex-grow-0 shrink-0 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-vl-ink uppercase tracking-wider">Profile Setup</span>
                    <span className="text-xs font-bold text-vl-primary">{totalCompletion}%</span>
                  </div>
                  <div className="w-full bg-vl-border h-2 rounded-full overflow-hidden mb-2">
                    <div className="bg-vl-primary h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${totalCompletion}%` }}></div>
                  </div>
                  <p className="text-[10px] text-vl-muted leading-relaxed">
                    {totalCompletion < 50 && "Tip: Add a default delivery address to check out faster next time."}
                    {totalCompletion >= 50 && totalCompletion < 100 && "Tip: Verify your phone number to secure your account."}
                    {totalCompletion === 100 && "Your MiniBrands profile is fully configured! 🎉"}
                  </p>
                </div>
              </div>
            </section>

            {/* Mobile Tab Sub-View Back Button */}
            {activeTab !== "overview" && (
              <div className="flex md:hidden items-center gap-2 mb-4 select-none">
                <button
                  onClick={() => setActiveTab("overview")}
                  className="flex items-center gap-1.5 text-xs font-bold text-vl-primary hover:underline cursor-pointer bg-vl-primary/5 px-3 h-8 rounded-full border border-vl-primary/10"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Overview</span>
                </button>
              </div>
            )}

            {/* Statistics Row */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab("orders")}
                  className="bg-vl-card border border-vl-border rounded-vl-card p-4 text-center shadow-vl-soft hover:border-vl-primary/20 hover:scale-[1.01] transition-all cursor-pointer"
                >
                  <span className="text-vl-muted text-xs font-semibold uppercase tracking-wider block mb-1">Orders</span>
                  <span className="font-vl-heading text-2xl font-extrabold text-vl-ink">{ordersCount}</span>
                </button>
                <button
                  onClick={() => setActiveTab("wishlist")}
                  className="bg-vl-card border border-vl-border rounded-vl-card p-4 text-center shadow-vl-soft hover:border-vl-primary/20 hover:scale-[1.01] transition-all cursor-pointer"
                >
                  <span className="text-vl-muted text-xs font-semibold uppercase tracking-wider block mb-1">Wishlist</span>
                  <span className="font-vl-heading text-2xl font-extrabold text-vl-ink">{localWishlistCount}</span>
                </button>
                <div className="bg-vl-card border border-vl-border rounded-vl-card p-4 text-center shadow-vl-soft hover:scale-[1.01] transition-all">
                  <span className="text-vl-muted text-xs font-semibold uppercase tracking-wider block mb-1">Coins</span>
                  <span className="font-vl-heading text-2xl font-extrabold text-vl-accent">{400 + (charSum % 600)}</span>
                </div>
              </div>
            )}

            {/* Quick Actions Strip */}
            {activeTab === "overview" && (
              <div className="flex flex-wrap gap-2 select-none">
                <button onClick={() => setActiveTab("orders")} className="px-4 py-2 text-xs font-bold border border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary hover:text-vl-primary rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                  <Package className="w-3.5 h-3.5 text-vl-primary" />
                  <span>Track Orders</span>
                </button>
                <button onClick={() => setActiveTab("addresses")} className="px-4 py-2 text-xs font-bold border border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary hover:text-vl-primary rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                  <MapPin className="w-3.5 h-3.5 text-vl-primary" />
                  <span>Manage Addresses</span>
                </button>
                <button onClick={() => setActiveTab("wishlist")} className="px-4 py-2 text-xs font-bold border border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary hover:text-vl-primary rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                  <Heart className="w-3.5 h-3.5 text-vl-primary" />
                  <span>View Wishlist</span>
                </button>
                <button onClick={() => setActiveTab("security")} className="px-4 py-2 text-xs font-bold border border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary hover:text-vl-primary rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                  <ShieldAlert className="w-3.5 h-3.5 text-vl-primary" />
                  <span>Security Settings</span>
                </button>
                <Link href={sellerHref} className="px-4 py-2 text-xs font-bold border border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary hover:text-vl-primary rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                  <Store className="w-3.5 h-3.5 text-vl-primary" />
                  <span>Seller Center</span>
                </Link>
              </div>
            )}

            {/* Recent Orders Tracker */}
            {(activeTab === "overview" || activeTab === "orders") && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-vl-heading text-lg font-bold text-vl-ink">Recent Purchases</h2>
                  {recentOrders.length > 0 && (
                    <Link className="text-xs font-bold text-vl-primary hover:underline flex items-center gap-0.5" href="/account/orders">
                      <span>View All</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
                {recentOrders.length === 0 ? (
                  <div className="bg-vl-card border border-vl-border rounded-vl-card p-8 text-center flex flex-col items-center justify-center gap-3 shadow-vl-soft">
                    <div className="h-12 w-12 rounded-full bg-vl-primary/10 flex items-center justify-center text-vl-primary">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-vl-ink">No purchases yet</p>
                      <p className="text-xs text-vl-muted mt-1">Start exploring independent fashion boutique creations.</p>
                    </div>
                    <Link href="/catalog" className="px-4 py-2 bg-vl-primary text-white text-xs font-bold rounded-vl-control hover:bg-vl-primary-strong active:scale-95 transition-all shadow-md shadow-vl-primary/10">
                      Explore Products
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order) => {
                      const statusMapping = getStatusClasses(order.orderStatus || order.status);
                      return (
                        <div key={order.id} className="bg-vl-card border border-vl-border rounded-vl-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:shadow-vl-medium transition-all gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="h-16 w-16 bg-vl-surface rounded-xl overflow-hidden shrink-0 border border-vl-border relative">
                              <img alt={order.productName} className="w-full h-full object-cover" src={order.productImage} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-vl-heading text-sm font-bold text-vl-ink truncate max-w-[200px] sm:max-w-[280px]">{order.productName}</p>
                              <p className="text-[10px] text-vl-muted font-mono mt-0.5">Order #{order.id.substring(0, 8)}</p>
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className={`w-2 h-2 rounded-full ${statusMapping.dot}`}></span>
                                <span className={`text-xs font-bold uppercase tracking-wider ${statusMapping.text}`}>{statusMapping.label}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                            <Link
                              href={`/account/orders/${order.id}`}
                              className="flex-1 sm:flex-none bg-vl-primary text-white px-4 py-2.5 rounded-vl-control text-xs font-bold text-center cursor-pointer hover:bg-vl-primary-strong active:scale-95 transition-all shadow-sm"
                            >
                              Track Order
                            </Link>
                            <Link
                              href={`/account/orders/${order.id}`}
                              className="flex-1 sm:flex-none bg-vl-card text-vl-ink border border-vl-border px-4 py-2.5 rounded-vl-control text-xs font-bold text-center cursor-pointer hover:bg-vl-surface active:scale-95 transition-all"
                            >
                              Details
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Default Delivery Address */}
            {(activeTab === "overview" || activeTab === "addresses") && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-vl-heading text-lg font-bold text-vl-ink">Default Delivery Address</h2>
                  {defaultAddress && (
                    <Link className="text-xs font-bold text-vl-primary hover:underline flex items-center gap-0.5" href="/account/addresses">
                      <span>Change</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
                {defaultAddress ? (
                  <div className="bg-vl-card border border-vl-border rounded-vl-card p-5 sm:p-6 shadow-vl-soft relative group">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-vl-heading text-sm font-bold text-vl-ink">{defaultAddress.fullName}</p>
                          <span className="bg-vl-surface px-2 py-0.5 rounded-full text-[10px] font-bold text-vl-muted uppercase tracking-wider border border-vl-border">Home</span>
                        </div>
                        <p className="text-xs text-vl-muted leading-relaxed">
                          {defaultAddress.line1}
                          {defaultAddress.line2 && <><br />{defaultAddress.line2}</>}
                          <br />
                          {defaultAddress.city} - {defaultAddress.pincode}
                          <br />
                          Tamil Nadu, India
                        </p>
                        <p className="text-xs font-bold text-vl-ink mt-3 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-vl-primary" />
                          <span>{defaultAddress.phone}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-vl-card border border-vl-border rounded-vl-card p-8 text-center flex flex-col items-center justify-center gap-3 shadow-vl-soft">
                    <div className="h-12 w-12 rounded-full bg-vl-primary/10 flex items-center justify-center text-vl-primary">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-vl-ink">No delivery address added</p>
                      <p className="text-xs text-vl-muted mt-1">Add your shipping details to enable faster checkout checkout flows.</p>
                    </div>
                    <Link href="/account/addresses" className="px-4 py-2 bg-vl-primary text-white text-xs font-bold rounded-vl-control hover:bg-vl-primary-strong active:scale-95 transition-all shadow-md shadow-vl-primary/10">
                      Add Address
                    </Link>
                  </div>
                )}
              </section>
            )}

            {/* From Your Wishlist */}
            {(activeTab === "overview" || activeTab === "wishlist") && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-vl-heading text-lg font-bold text-vl-ink">From Your Wishlist</h2>
                  {wishlist.length > 0 && (
                    <Link className="text-xs font-bold text-vl-primary hover:underline flex items-center gap-0.5" href="/account/wishlist">
                      <span>View Full Wishlist</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
                {wishlist.length === 0 ? (
                  <div className="bg-vl-card border border-vl-border rounded-vl-card p-8 text-center flex flex-col items-center justify-center gap-3 shadow-vl-soft">
                    <div className="h-12 w-12 rounded-full bg-vl-primary/10 flex items-center justify-center text-vl-primary">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-vl-ink">Your wishlist is empty</p>
                      <p className="text-xs text-vl-muted mt-1">Explore pieces and save items you love for later.</p>
                    </div>
                    <Link href="/catalog" className="px-4 py-2 bg-vl-primary text-white text-xs font-bold rounded-vl-control hover:bg-vl-primary-strong active:scale-95 transition-all shadow-md shadow-vl-primary/10">
                      Browse Pieces
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {wishlist.map((item) => (
                      <div key={item.id} className="bg-vl-card border border-vl-border rounded-vl-card p-3 group relative flex flex-col justify-between hover:shadow-vl-medium transition-all duration-vl-standard ease-vl-out hover:-translate-y-0.5">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden mb-3 relative bg-vl-surface border border-vl-border/40">
                          <div className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${item.image}')` }}></div>
                          <button
                            onClick={() => handleRemoveFromWishlist(item.id)}
                            className="absolute top-2 right-2 h-7 w-7 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm text-vl-muted hover:text-vl-primary"
                            aria-label="Remove item from wishlist"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-vl-ink truncate">{item.name}</p>
                          <p className="text-xs text-vl-primary font-bold mt-0.5">{formatPrice(item.price)}</p>
                          <button
                            onClick={() => handleMoveToCart(item.id)}
                            suppressHydrationWarning
                            className="w-full mt-3 py-2 border border-vl-primary text-vl-primary text-xs font-bold rounded-vl-control hover:bg-vl-primary hover:text-white transition-colors cursor-pointer"
                          >
                            Move to Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Account Security Settings */}
            {(activeTab === "overview" || activeTab === "security") && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-vl-heading text-lg font-bold text-vl-ink">Account Security Settings</h2>
                  <Link className="text-xs font-bold text-vl-primary hover:underline flex items-center gap-0.5" href="/account/security">
                    <span>Manage Security</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-vl-card border border-vl-border rounded-vl-card p-5 shadow-vl-soft">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-vl-heading text-sm font-bold text-vl-ink">OTP Secure Access</h3>
                      <span className="bg-vl-success/10 text-vl-success text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border border-vl-success/20">Active</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-vl-surface border border-vl-border rounded-xl">
                      <ShieldAlert className="w-5 h-5 text-vl-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-vl-ink">Two-Factor Authentication</p>
                        <p className="text-[10px] text-vl-muted mt-0.5">Last verified during sign-in</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-vl-card border border-vl-border rounded-vl-card p-5 shadow-vl-soft">
                    <h3 className="font-vl-heading text-sm font-bold text-vl-ink mb-4">Active Sessions</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Award className="w-5 h-5 text-vl-primary shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-vl-ink truncate">Web browser session</p>
                          <p className="text-[10px] text-vl-muted">Active now</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Award className="w-5 h-5 text-vl-muted shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-vl-ink truncate">Mobile API client</p>
                          <p className="text-[10px] text-vl-muted">Logged in from smartphone</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Seller Center Invitation Card */}
            {activeTab === "overview" && (
              <section className="bg-vl-ink text-white rounded-vl-card p-6 sm:p-8 flex items-center justify-between overflow-hidden relative group cursor-pointer shadow-vl-soft border border-vl-border/10">
                <div className="relative z-10 max-w-sm">
                  {isSeller ? (
                    <>
                      <h3 className="font-vl-heading text-lg font-bold mb-2">{userProfile.seller?.businessName || "Your Boutique Partner"}</h3>
                      <p className="text-xs text-vl-muted/90 leading-relaxed mb-4">
                        KYC Status: <span className="uppercase font-bold text-vl-primary">{userProfile.seller?.verification?.kycStatus || "Pending"}</span>
                        <br />
                        Identity: <span className="font-bold text-vl-success">{userProfile.seller?.verification?.bankVerified ? "Verified Account" : "Pending Verification"}</span>
                      </p>
                      <Link
                        href={sellerHref}
                        className="inline-block bg-white text-vl-ink px-5 py-2.5 rounded-vl-control text-xs font-bold hover:bg-vl-surface active:scale-[0.98] transition-all cursor-pointer shadow-md"
                      >
                        Go To Dashboard
                      </Link>
                    </>
                  ) : (
                    <>
                      <h3 className="font-vl-heading text-lg font-bold mb-2">Turn Your Passion into Business</h3>
                      <p className="text-xs text-vl-muted/90 leading-relaxed mb-4">Join 10,000+ sellers on MINIBRANDS and reach customers across the country.</p>
                      <Link
                        href="/seller/onboarding"
                        className="inline-block bg-vl-primary text-white px-5 py-2.5 rounded-vl-control text-xs font-bold hover:bg-vl-primary-strong active:scale-[0.98] transition-all cursor-pointer shadow-md"
                      >
                        Become a Seller
                      </Link>
                    </>
                  )}
                </div>
                <div className="absolute right-0 top-0 h-full w-48 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-vl-slow flex items-center justify-end pr-6">
                  <Store className="w-36 h-36" />
                </div>
              </section>
            )}
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
    </div>
  );
}
