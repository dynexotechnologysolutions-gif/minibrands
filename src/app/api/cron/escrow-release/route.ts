/**
 * GET /api/cron/escrow-release
 * Vercel Cron Job route — runs daily at 20:30 UTC (02:00 IST next day).
 * Secured by Bearer token auth using CRON_SECRET env var.
 * Delegates all processing to lib/escrow-release.ts.
 */

import { NextRequest, NextResponse } from "next/server";
import { runEscrowRelease } from "@/lib/escrow-release";
import { captureAndLogError } from "@/lib/sentry";
import crypto from "crypto";

export const maxDuration = 60; // 60s max duration on Vercel

export async function GET(request: NextRequest): Promise<NextResponse> {
  // ── Bearer token authentication ─────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET is not configured. Rejecting request.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") ?? "";

  // Timing-safe comparison to prevent timing attacks
  let isAuthorized = false;
  try {
    const secretBuffer = Buffer.from(cronSecret, "utf-8");
    const tokenBuffer = Buffer.from(token, "utf-8");
    if (secretBuffer.length === tokenBuffer.length) {
      isAuthorized = crypto.timingSafeEqual(secretBuffer, tokenBuffer);
    }
  } catch {
    isAuthorized = false;
  }

  if (!isAuthorized) {
    console.warn("[Cron] Unauthorized escrow-release request.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Run escrow release ──────────────────────────────────────────────────────
  console.log("[Cron] Escrow release job started.");

  try {
    const result = await runEscrowRelease();

    console.log("[Cron] Escrow release job completed.", result);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    captureAndLogError(err, "cronEscrowRelease.topLevel");
    console.error("[Cron] Escrow release job threw an uncaught error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
