"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import HomeHeader from "@/components/home/HomeHeader";

interface SecurityClientProps {
  userProfile: any;
  cartCount: number;
  sellerHref: string;
}

export default function SecurityClient({
  userProfile,
  cartCount,
  sellerHref,
}: SecurityClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Alert/Toast State
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

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

  // Mock sessions state
  const [sessions, setSessions] = useState([
    {
      id: "session-1",
      device: "Windows PC (Chrome)",
      ip: "103.241.12.89",
      lastActive: "Active Now",
      isCurrent: true,
    },
    {
      id: "session-2",
      device: "iPhone 15 Pro (Mobile App)",
      ip: "157.44.18.232",
      lastActive: "Active 4 hours ago",
      isCurrent: false,
    },
    {
      id: "session-3",
      device: "macOS Device (Safari)",
      ip: "122.164.88.102",
      lastActive: "Active 2 days ago",
      isCurrent: false,
    },
  ]);

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    triggerToast("Session terminated successfully.", "success");
  };

  const handleRevokeAllSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    triggerToast("All other sessions logged out successfully.", "success");
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
            <Link className="flex items-center gap-md p-md text-on-surface-variant dark:text-on-tertiary-fixed-variant font-body-md hover:bg-surface-container-low transition-all" href="/account/profile">
              <span className="material-symbols-outlined">person</span>
              <span>Personal Info</span>
            </Link>
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
            <Link className="flex items-center gap-md p-md text-black font-semibold bg-gray-100 rounded-lg transition-all" href="/account/security">
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
            
            {/* Header Title */}
            <section className="bg-surface-container-lowest border border-border-gray rounded-lg p-lg shadow-sm">
              <h1 className="text-headline-md font-headline-md mb-xs">Security Settings</h1>
              <p className="text-body-md text-on-surface-variant">
                Manage your account credentials, login methods, and track active sessions for Velvet Lane.
              </p>
            </section>

            <div className="flex flex-col lg:flex-row gap-lg">
              
              {/* Left Column (Security Details) */}
              <div className="w-full lg:w-[65%] flex flex-col gap-lg">
                
                {/* Two Factor / Passwordless Access */}
                <section className="bg-surface-container-lowest border border-border-gray rounded-lg p-lg shadow-sm flex flex-col gap-md">
                  <h2 className="text-headline-sm font-headline-sm flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary">security</span>
                    Account Verification Status
                  </h2>
                  <div className="h-px bg-border-gray w-full"></div>

                  <div className="space-y-base">
                    {/* Email Verification Card */}
                    <div className="flex items-start gap-md p-md bg-slate-50 border border-border-gray rounded-lg">
                      <span className="material-symbols-outlined text-success-green text-[32px] mt-0.5">verified</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-sm flex-wrap">
                          <p className="font-label-bold text-body-md">Primary Email</p>
                          <span className="bg-success-green/10 text-success-green text-[10px] px-sm py-0.5 rounded-full uppercase tracking-wider font-semibold">Verified</span>
                        </div>
                        <p className="text-body-sm text-on-surface-variant font-mono mt-xs">{userProfile.user.email}</p>
                        <p className="text-body-sm text-text-muted mt-xs">Used for signing in and receiving purchase receipts.</p>
                      </div>
                    </div>

                    {/* Phone Verification Card */}
                    <div className="flex items-start gap-md p-md bg-slate-50 border border-border-gray rounded-lg">
                      <span className="material-symbols-outlined text-primary text-[32px] mt-0.5">smartphone</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-sm flex-wrap">
                          <p className="font-label-bold text-body-md">OTP Secure Access</p>
                          <span className="bg-primary/10 text-primary text-[10px] px-sm py-0.5 rounded-full uppercase tracking-wider font-semibold">Enabled</span>
                        </div>
                        <p className="text-body-sm text-on-surface-variant mt-xs">Email One-Time Password (OTP)</p>
                        <p className="text-body-sm text-text-muted mt-xs">Secure passwordless verification is enforced for all logins.</p>
                      </div>
                    </div>

                    {/* Role Card */}
                    <div className="flex items-start gap-md p-md bg-slate-50 border border-border-gray rounded-lg">
                      <span className="material-symbols-outlined text-accent-yellow text-[32px] mt-0.5">badge</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-sm flex-wrap">
                          <p className="font-label-bold text-body-md">Account Persona Roles</p>
                        </div>
                        <p className="text-body-sm text-on-surface-variant mt-xs">
                          Current Primary Role: <span className="font-semibold">{userProfile.role}</span>
                        </p>
                        {isSeller ? (
                          <p className="text-body-sm text-text-muted mt-xs">Your account has active Buyer and Seller capabilities.</p>
                        ) : (
                          <p className="text-body-sm text-text-muted mt-xs">Upgrade your account at any time to sell products on the platform.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Active Sessions */}
                <section className="bg-surface-container-lowest border border-border-gray rounded-lg p-lg shadow-sm flex flex-col gap-md">
                  <div className="flex items-center justify-between flex-wrap gap-base">
                    <h2 className="text-headline-sm font-headline-sm flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary">devices</span>
                      Active Login Sessions
                    </h2>
                    {sessions.length > 1 && (
                      <button
                        onClick={handleRevokeAllSessions}
                        className="text-error-red hover:underline text-body-sm font-label-bold cursor-pointer"
                      >
                        Sign out of all other sessions
                      </button>
                    )}
                  </div>
                  <div className="h-px bg-border-gray w-full"></div>

                  <div className="space-y-base">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between border-b border-border-gray pb-base last:border-b-0 last:pb-0 gap-base">
                        <div className="flex items-start gap-md">
                          <span className="material-symbols-outlined text-on-surface-variant text-[24px] mt-0.5">
                            {session.device.includes("iPhone") || session.device.includes("Mobile") ? "smartphone" : "laptop_mac"}
                          </span>
                          <div>
                            <div className="flex items-center gap-sm flex-wrap">
                              <p className="text-body-md font-label-bold">{session.device}</p>
                              {session.isCurrent && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-sm py-0.5 rounded-full uppercase tracking-wider font-semibold">Current Session</span>
                              )}
                            </div>
                            <p className="text-body-sm text-on-surface-variant font-mono mt-xs">IP: {session.ip}</p>
                            <p className="text-[10px] text-text-muted mt-xs">{session.lastActive}</p>
                          </div>
                        </div>

                        {!session.isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="border border-border-gray text-body-sm text-on-surface hover:bg-surface-container-low px-md py-1.5 rounded transition-all cursor-pointer font-label-bold"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Column (Security Tips & Quick Links) */}
              <div className="w-full lg:w-[35%] flex flex-col gap-lg">
                
                {/* Security Status Box */}
                <section className="bg-surface-container-lowest border border-border-gray rounded-lg p-lg shadow-sm">
                  <h3 className="text-label-bold font-label-bold mb-md flex items-center justify-between">
                    Security Score
                    <span className="bg-success-green/10 text-success-green text-[10px] px-sm py-0.5 rounded-full uppercase tracking-wider font-semibold">Excellent</span>
                  </h3>
                  <div className="flex items-center gap-sm mb-lg p-sm bg-surface-container-low rounded">
                    <span className="material-symbols-outlined text-primary text-[24px]">verified_user</span>
                    <div>
                      <p className="text-body-sm font-label-bold">MFA & Session Safe</p>
                      <p className="text-[10px] text-on-surface-variant">Your account is fully protected.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-base text-body-sm text-on-surface-variant leading-relaxed">
                    <p className="font-semibold text-primary">Recommendations:</p>
                    <ul className="list-disc pl-base space-y-sm">
                      <li>Keep your session activity monitored and revoke unrecognized devices.</li>
                      <li>Never share the OTP verification codes sent to your email.</li>
                      <li>Contact support if you notice any unusual checkout activity.</li>
                    </ul>
                  </div>
                </section>

                {/* Quick Links */}
                <section className="flex flex-col gap-sm">
                  <h3 className="text-label-bold font-label-bold px-base">Quick Links</h3>
                  <div className="bg-surface-container-lowest border border-border-gray rounded-lg overflow-hidden shadow-sm">
                    <Link className="flex items-center justify-between p-base border-b border-border-gray hover:bg-surface-container-low transition-colors" href="/account/profile">
                      <span className="text-body-md">Personal Profile</span>
                      <span className="material-symbols-outlined text-outline">chevron_right</span>
                    </Link>
                    <Link className="flex items-center justify-between p-base border-b border-border-gray hover:bg-surface-container-low transition-colors" href="/account/addresses">
                      <span className="text-body-md">Manage Addresses</span>
                      <span className="material-symbols-outlined text-outline">chevron_right</span>
                    </Link>
                    <Link className="flex items-center justify-between p-base border-b border-border-gray hover:bg-surface-container-low transition-colors" href="/account/orders">
                      <span className="text-body-md">Orders & Returns</span>
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
              </div>

            </div>
          </div>
        </div>
      </main>

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
