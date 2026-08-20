"use client";

import React from "react";

interface StoresErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function StoresError({ reset }: StoresErrorProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white font-sans text-vl-ink">
      <main className="flex w-full flex-grow items-center justify-center px-4 py-16">
        <div className="max-w-md rounded-vl-card border border-vl-border bg-vl-card p-8 text-center">
          <p className="font-vl-heading text-lg font-bold text-vl-ink">Something went wrong</p>
          <p className="mt-2 text-sm text-vl-muted">We couldn&apos;t load the brands right now. Please try again.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-vl-control bg-vl-primary px-6 text-sm font-bold text-white transition-all duration-150 hover:bg-vl-primary/90 active:scale-[0.98]"
          >
            Try again
          </button>
        </div>
      </main>
    </div>
  );
}