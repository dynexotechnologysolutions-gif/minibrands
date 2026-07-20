"use client";

import React, { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function SessionExpiredContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const redirectTo = searchParams.get("redirectTo") || "/";

  const handleSignInAgain = async () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    try {
      // Clear Better Auth session on client-side
      await authClient.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
    
    // Redirect to login page preserving callback URL
    startTransition(() => {
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    });
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <div className="bg-background text-on-surface flex flex-col min-h-screen w-full relative">
      {/* Animation Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          opacity: 0;
          animation: fadeIn 0.6s ease-out forwards;
        }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
      ` }} />

      {/* Top Navigation */}
      <header className="bg-surface border-b border-outline-variant fixed top-0 w-full z-50">
        <div className="flex justify-between items-center px-lg py-md w-full max-w-container-max mx-auto">
          <div className="text-headline-md font-headline-lg tracking-tight text-primary">MINIBRANDS</div>
          <div className="flex gap-base">
            <button 
              aria-label="Help Center"
              className="text-secondary hover:opacity-85 transition-opacity active:scale-95 transition-transform flex items-center gap-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">help</span>
            </button>
            <button 
              aria-label="Change Language"
              className="text-secondary hover:opacity-85 transition-opacity active:scale-95 transition-transform flex items-center gap-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">language</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center px-base pt-xxl pb-xxl mt-xl">
        <div className="max-w-[576px] w-full text-center space-y-xl">
          {/* Illustration Section */}
          <div className="fade-in flex justify-center">
            <div className="w-64 h-64 md:w-80 md:h-80 overflow-hidden">
              <img 
                alt="Session timeout security illustration" 
                className="w-full h-full object-contain" 
                src="https://cdn.prod.website-files.com/67a7409c10857ea8dcbc42d5/67a7409c10857ea8dcbc4c3c_everything%20you%20need%20to%20know%20about%20Session-timeout%20in%20GA%201.png"
              />
            </div>
          </div>

          {/* Typography & Message */}
          <div className="space-y-base">
            <h1 className="fade-in delay-1 font-headline-lg text-headline-lg text-on-surface">
              Your Session Has Expired
            </h1>
            <p className="fade-in delay-2 font-body-lg text-body-lg text-secondary max-w-[448px] mx-auto">
              For your security, your session has ended due to inactivity or authentication timeout. Don&apos;t worry—your account and data remain secure. Please sign in again to continue where you left off.
            </p>
          </div>

          {/* Actions */}
          <div className="fade-in delay-3 flex flex-col sm:flex-row gap-base justify-center pt-md">
            <button 
              onClick={handleSignInAgain}
              disabled={isRedirecting || isPending}
              className="bg-primary text-on-primary px-xl py-md rounded-lg font-label-bold hover:opacity-90 active:scale-95 transition-all w-full sm:w-auto min-w-[180px] cursor-pointer disabled:opacity-70"
            >
              {isRedirecting ? "Redirecting..." : "Sign In Again"}
            </button>
            <button 
              onClick={handleBackToHome}
              className="bg-transparent border border-primary text-primary px-xl py-md rounded-lg font-label-bold hover:bg-surface-container-low active:scale-95 transition-all w-full sm:w-auto min-w-[180px] cursor-pointer"
            >
              Back to Home
            </button>
          </div>

          {/* Security Info Card */}
          <div className="fade-in delay-4 pt-xxl">
            <div className="bg-surface-container-low border border-outline-variant p-lg rounded-xl text-left flex items-start gap-md max-w-[512px] mx-auto">
              <div className="bg-surface-container-highest p-sm rounded-full flex-shrink-0">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield
                </span>
              </div>
              <div>
                <h3 className="font-label-bold text-on-surface mb-xs">Security First</h3>
                <p className="font-body-sm text-body-sm text-secondary">
                  For your protection, we automatically end inactive sessions to keep your account secure.
                </p>
              </div>
            </div>
          </div>


          {/* Footer Help Link */}
          <div className="fade-in delay-4 pt-lg">
            <a className="font-body-sm text-body-sm text-secondary hover:text-primary transition-colors inline-flex items-center gap-xs" href="#">
              Need help? Contact Support
            </a>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="bg-surface border-t border-outline-variant w-full">
        <div className="flex flex-col md:flex-row justify-between items-center px-lg py-xl w-full max-w-container-max mx-auto gap-base">
          <div className="font-label-bold text-on-surface">MINIBRANDS</div>
          <div className="flex gap-lg">
            <a className="font-body-sm text-body-sm text-secondary hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="font-body-sm text-body-sm text-secondary hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="font-body-sm text-body-sm text-secondary hover:text-primary transition-colors" href="#">Help Center</a>
          </div>
          <div className="font-body-sm text-body-sm text-secondary">
            © 2024 MINIBRANDS Marketplace. Security First.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function SessionExpiredPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs">Loading...</div>}>
      <SessionExpiredContent />
    </Suspense>
  );
}
