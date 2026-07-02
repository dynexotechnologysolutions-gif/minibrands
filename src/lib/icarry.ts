/**
 * lib/icarry.ts — iCarry v16.0 logistics integration
 * Session-token auth with Redis caching (23-hour TTL).
 * All API calls use cached token; re-authenticates on cache miss.
 */

import { redis } from "@/lib/redis";
import { captureAndLogError } from "@/lib/sentry";

const BASE_URL =
  process.env.ICARRY_SANDBOX === "true"
    ? "https://sandbox.lb.icarry.com/api-frontend"
    : "https://lb.icarry.com/api-frontend";

const REDIS_TOKEN_KEY = "icarry:session_token";
const TOKEN_TTL_SECONDS = 82800; // 23 hours

// ─── Custom Error Classes ──────────────────────────────────────────────────────

export class ICarryAuthError extends Error {
  constructor(
    public status: number,
    public body: string,
    message = `iCarry authentication failed: ${status}`
  ) {
    super(message);
    this.name = "ICarryAuthError";
  }
}

export class ICarryShipmentError extends Error {
  constructor(
    public status: number,
    public body: string,
    message = `iCarry shipment creation failed: ${status}`
  ) {
    super(message);
    this.name = "ICarryShipmentError";
  }
}

export class ICarryLabelError extends Error {
  constructor(
    public status: number,
    public body: string,
    message = `iCarry label retrieval failed: ${status}`
  ) {
    super(message);
    this.name = "ICarryLabelError";
  }
}

// ─── Authentication ────────────────────────────────────────────────────────────

/**
 * Authenticates with iCarry and caches the bearer token in Redis for 23 hours.
 * Never logs the token itself.
 */
export async function authenticate(): Promise<string> {
  const username = process.env.ICARRY_USERNAME;
  const password = process.env.ICARRY_PASSWORD;

  if (!username || !password) {
    throw new ICarryAuthError(0, "", "ICARRY_USERNAME or ICARRY_PASSWORD env vars are missing");
  }

  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ICarryAuthError(res.status, body);
  }

  const data = await res.json();
  const token: string = data.token || data.access_token || data.data?.token;

  if (!token) {
    throw new ICarryAuthError(200, JSON.stringify(data), "iCarry response missing token field");
  }

  // Cache token — never log it
  await redis.set(REDIS_TOKEN_KEY, token, { ex: TOKEN_TTL_SECONDS });
  console.log("[iCarry] Session token refreshed and cached in Redis.");

  return token;
}

/**
 * Returns auth headers for iCarry API calls.
 * Reads from Redis cache first; re-authenticates on miss.
 */
export async function getAuthHeaders(): Promise<{
  Authorization: string;
  "Content-Type": string;
}> {
  let token = await redis.get<string>(REDIS_TOKEN_KEY);

  if (!token) {
    console.log("[iCarry] Token cache miss. Authenticating...");
    token = await authenticate();
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ─── Shipment Creation ─────────────────────────────────────────────────────────

interface OrderForShipment {
  id: string;
  address: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    pincode: string;
  };
}

export async function createShipment(order: OrderForShipment): Promise<{
  icarryOrderId: string;
  awbNumber: string;
  courierName: string;
}> {
  const headers = await getAuthHeaders();
  const pickupAddressId = process.env.ICARRY_PICKUP_ADDRESS_ID;

  if (!pickupAddressId) {
    throw new ICarryShipmentError(
      0,
      "",
      "ICARRY_PICKUP_ADDRESS_ID env var is missing"
    );
  }

  const payload = {
    pickup_address_id: pickupAddressId,
    receiver: {
      name: order.address.fullName,
      phone: order.address.phone,
      email: "",
      address_line1: order.address.line1,
      address_line2: order.address.line2 ?? "",
      city: order.address.city,
      state: "Tamil Nadu",
      pincode: order.address.pincode,
    },
    package: {
      weight: 500,
      length: 30,
      width: 20,
      height: 5,
    },
    order_reference_id: order.id,
    payment_mode: "Prepaid",
  };

  const res = await fetch(`${BASE_URL}/book-shipment`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ICarryShipmentError(res.status, body);
  }

  const data = await res.json();

  // Normalize response fields — iCarry v16.0 field names
  const icarryOrderId: string =
    data.id || data.order_id || data.data?.id || data.data?.order_id;
  const awbNumber: string =
    data.awb_number || data.awb || data.data?.awb_number || data.data?.awb;
  const courierName: string =
    data.courier_name || data.courier || data.data?.courier_name || "iCarry";

  if (!icarryOrderId || !awbNumber) {
    throw new ICarryShipmentError(
      200,
      JSON.stringify(data),
      "iCarry response missing order_id or awb_number"
    );
  }

  console.log(`[iCarry] Shipment created. OrderId: ${icarryOrderId}, AWB: ${awbNumber}`);

  return { icarryOrderId, awbNumber, courierName };
}

// ─── Label Retrieval ───────────────────────────────────────────────────────────

/**
 * Retrieves the PDF label URL for a given iCarry order.
 * Label generation can lag behind shipment creation — failures are non-fatal.
 */
export async function getLabelUrl(icarryOrderId: string): Promise<string> {
  const headers = await getAuthHeaders();

  // Try dedicated print-label endpoint first; fall back to inline label endpoint
  const res = await fetch(`${BASE_URL}/print-label`, {
    method: "POST",
    headers,
    body: JSON.stringify({ order_id: icarryOrderId }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ICarryLabelError(res.status, body);
  }

  const data = await res.json();
  const labelUrl: string =
    data.label_url ||
    data.url ||
    data.data?.label_url ||
    data.data?.url;

  if (!labelUrl) {
    throw new ICarryLabelError(
      200,
      JSON.stringify(data),
      "iCarry response missing label_url"
    );
  }

  return labelUrl;
}

// ─── Tracking URL (pure function) ─────────────────────────────────────────────

/**
 * Returns the public iCarry tracking URL for a given AWB number.
 * Pure function — no API call, no external dependencies.
 */
export function getTrackingUrl(awbNumber: string): string {
  return `https://icarry.in/track/${awbNumber}`;
}
