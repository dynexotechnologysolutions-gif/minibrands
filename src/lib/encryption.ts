import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

function getMasterKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY environment variable is required in production.");
    }
    // Fallback key for dev/test environments (32 bytes)
    return crypto.scryptSync("velvet_dev_fallback_secret_key_2026", "salt_velvet", 32);
  }

  if (envKey.length === 64) {
    return Buffer.from(envKey, "hex");
  }

  // Derive 32-byte key from string
  return crypto.scryptSync(envKey, "velvet_master_salt", 32);
}

/**
 * Encrypts a string value using AES-256-GCM.
 * Output format: "enc_gcm_v1:<ivHex>:<tagHex>:<ciphertextHex>"
 */
export function encryptText(text: string | null | undefined): string | null {
  if (!text) return null;

  try {
    const key = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return `enc_gcm_v1:${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err: any) {
    console.error("[encryption.encryptText error]:", err.message);
    throw new Error("Failed to encrypt sensitive data.");
  }
}

/**
 * Decrypts an encrypted payload. If the string is plaintext or invalid format,
 * returns the string as-is to preserve backward compatibility for legacy records.
 */
export function decryptText(encryptedPayload: string | null | undefined): string | null {
  if (!encryptedPayload) return null;

  // Check if string has encrypted prefix
  if (!encryptedPayload.startsWith("enc_gcm_v1:")) {
    // Return legacy unencrypted text as-is
    return encryptedPayload;
  }

  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 4) return encryptedPayload;

    const [, ivHex, tagHex, ciphertextHex] = parts;
    const key = getMasterKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(tagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err: any) {
    console.warn("[encryption.decryptText warning]: Decryption failed, returning input as-is", err.message);
    return encryptedPayload;
  }
}

/**
 * Utility to mask account numbers (e.g., "XXXX XXXX 1234")
 */
export function maskBankAccountNumber(accountNumber: string | null | undefined): string {
  if (!accountNumber) return "N/A";
  const clean = accountNumber.trim();
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  return `XXXX XXXX ${last4}`;
}
