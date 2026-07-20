"use client";

import React from "react";
import { validatePassword } from "@/lib/password-policy";

interface PasswordStrengthMeterProps {
  password: string;
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const result = validatePassword(password);

  return (
    <div className="flex flex-col gap-xs mt-xs text-body-sm animate-fade-in-up">
      {/* Progress Bar */}
      <div className="flex items-center justify-between gap-md mb-1">
        <span className="font-label-bold text-xs text-on-surface-variant">
          Password Strength: <strong style={{ color: result.color }}>{result.label}</strong>
        </span>
        <span className="font-mono text-xs text-text-muted">{result.score}%</span>
      </div>

      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300 rounded-full"
          style={{
            width: `${result.score}%`,
            backgroundColor: result.color,
          }}
        />
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-[11px]">
        <div className={`flex items-center gap-1 ${result.checks.minLength ? "text-success-green font-semibold" : "text-text-muted"}`}>
          <span>{result.checks.minLength ? "✓" : "○"}</span>
          <span>At least 8 chars</span>
        </div>
        <div className={`flex items-center gap-1 ${result.checks.hasUppercase ? "text-success-green font-semibold" : "text-text-muted"}`}>
          <span>{result.checks.hasUppercase ? "✓" : "○"}</span>
          <span>Uppercase (A-Z)</span>
        </div>
        <div className={`flex items-center gap-1 ${result.checks.hasLowercase ? "text-success-green font-semibold" : "text-text-muted"}`}>
          <span>{result.checks.hasLowercase ? "✓" : "○"}</span>
          <span>Lowercase (a-z)</span>
        </div>
        <div className={`flex items-center gap-1 ${result.checks.hasNumber ? "text-success-green font-semibold" : "text-text-muted"}`}>
          <span>{result.checks.hasNumber ? "✓" : "○"}</span>
          <span>Number (0-9)</span>
        </div>
        <div className={`flex items-center gap-1 col-span-2 ${result.checks.hasSpecialChar ? "text-success-green font-semibold" : "text-text-muted"}`}>
          <span>{result.checks.hasSpecialChar ? "✓" : "○"}</span>
          <span>Special character (!@#$%^&*)</span>
        </div>
      </div>
    </div>
  );
}
