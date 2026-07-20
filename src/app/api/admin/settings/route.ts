import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-logger";

export async function GET() {
  try {
    await verifyAdminSession("manage_settings");

    const settings = await prisma.platformSetting.findMany();

    const defaults: Record<string, string> = {
      TAX_PERCENTAGE: "18",
      COMMISSION_PERCENTAGE: "10",
      SHIPPING_FLAT_RATE: "99",
      ESCROW_HOLD_DAYS: "7",
      MAINTENANCE_MODE: "false",
      AI_MODERATION_ENABLED: "true",
      AUTO_ESCROW_RELEASE: "true",
    };

    const mergedSettings = { ...defaults };
    settings.forEach((s) => {
      mergedSettings[s.key] = s.value;
    });

    return NextResponse.json({ settings: mergedSettings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch settings." }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await verifyAdminSession("manage_settings");
    const body = await request.json();
    const { key, value, reason } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required." }, { status: 400 });
    }

    const existing = await prisma.platformSetting.findUnique({ where: { key } });

    const updated = await prisma.platformSetting.upsert({
      where: { key },
      update: {
        value: String(value),
        updatedBy: session.user.email,
      },
      create: {
        key,
        value: String(value),
        updatedBy: session.user.email,
      },
    });

    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.profile.role,
      action: "UPDATE_PLATFORM_SETTING",
      targetType: "PlatformSetting",
      targetId: updated.id,
      oldValue: existing ? { [key]: existing.value } : null,
      newValue: { [key]: String(value) },
      reason: reason || `Updated setting '${key}'.`,
    });

    return NextResponse.json({ success: true, setting: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update settings." }, { status: 403 });
  }
}
