/**
 * Password Policy & Strength Analyzer
 * Enforces production password requirements and calculates live password strength score.
 */

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 100
  label: "Weak" | "Fair" | "Good" | "Strong" | "Very Strong";
  color: string;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const errors: string[] = [];
  if (!minLength) errors.push("Password must be at least 8 characters long.");
  if (!hasUppercase) errors.push("Must contain at least one uppercase letter (A-Z).");
  if (!hasLowercase) errors.push("Must contain at least one lowercase letter (a-z).");
  if (!hasNumber) errors.push("Must contain at least one number (0-9).");
  if (!hasSpecialChar) errors.push("Must contain at least one special character (!@#$%^&*).");

  let passedCount = 0;
  if (minLength) passedCount++;
  if (hasUppercase) passedCount++;
  if (hasLowercase) passedCount++;
  if (hasNumber) passedCount++;
  if (hasSpecialChar) passedCount++;

  let score = passedCount * 20;
  if (password.length >= 12 && score === 100) score = 100;

  let label: "Weak" | "Fair" | "Good" | "Strong" | "Very Strong" = "Weak";
  let color = "#ef4444"; // Red

  if (passedCount <= 2) {
    label = "Weak";
    color = "#ef4444";
  } else if (passedCount === 3) {
    label = "Fair";
    color = "#f59e0b"; // Yellow
  } else if (passedCount === 4) {
    label = "Good";
    color = "#3b82f6"; // Blue
  } else if (passedCount === 5 && password.length < 12) {
    label = "Strong";
    color = "#10b981"; // Emerald
  } else if (passedCount === 5 && password.length >= 12) {
    label = "Very Strong";
    color = "#059669"; // Dark Emerald
  }

  const isValid = passedCount === 5;

  return {
    isValid,
    score,
    label,
    color,
    checks: {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
    },
    errors,
  };
}
