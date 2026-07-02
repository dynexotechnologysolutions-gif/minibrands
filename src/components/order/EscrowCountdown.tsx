"use client";

import React, { useState, useEffect } from "react";

interface EscrowCountdownProps {
  escrowReleaseAt: string; // ISO 8601 date string
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
}

function computeTimeLeft(releaseAt: string): TimeLeft {
  const diff = new Date(releaseAt).getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true };
  }

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes, isExpired: false };
}

/**
 * Displays a live countdown until escrow funds are released to the seller.
 * Updates every minute. Shows a completion state when countdown expires.
 */
export default function EscrowCountdown({ escrowReleaseAt }: EscrowCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    computeTimeLeft(escrowReleaseAt)
  );

  useEffect(() => {
    const tick = () => setTimeLeft(computeTimeLeft(escrowReleaseAt));
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, [escrowReleaseAt]);

  if (timeLeft.isExpired) {
    return (
      <div className="p-base bg-emerald-50 border border-emerald-100 rounded flex items-start gap-sm">
        <span className="material-symbols-outlined text-emerald-500 mt-xs">check_circle</span>
        <div>
          <p className="font-label-bold text-label-bold text-emerald-800 text-xs">
            Funds Released to Boutique
          </p>
          <p className="font-body-sm text-[11px] text-emerald-700 leading-normal mt-xs">
            The escrow window has closed. Payment has been released to the boutique seller.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-base bg-amber-50 border border-amber-100 rounded space-y-base">
      <div className="flex items-center gap-sm">
        <span className="material-symbols-outlined text-amber-500">schedule</span>
        <p className="font-label-bold text-label-bold text-amber-800 text-xs">
          Escrow Release Countdown
        </p>
      </div>

      {/* Countdown tiles */}
      <div className="flex gap-sm">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hours" },
          { value: timeLeft.minutes, label: "Mins" },
        ].map(({ value, label }) => (
          <div
            key={label}
            className="flex-1 bg-white border border-amber-100 rounded text-center py-sm px-xs shadow-sm"
          >
            <p className="font-price-lg text-price-lg text-amber-700 leading-none">
              {String(value).padStart(2, "0")}
            </p>
            <p className="font-body-sm text-[10px] text-amber-500 uppercase tracking-wider mt-xs">
              {label}
            </p>
          </div>
        ))}
      </div>

      <p className="font-body-sm text-[11px] text-amber-700 leading-relaxed">
        Payment will be released to the boutique on{" "}
        {new Date(escrowReleaseAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        . You can request a return before then.
      </p>
    </div>
  );
}
