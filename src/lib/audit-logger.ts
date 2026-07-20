import { prisma } from "@/lib/prisma";

export interface LogAuditParams {
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValue?: Record<string, any> | string | null;
  newValue?: Record<string, any> | string | null;
  reason?: string | null;
}

export async function createAuditLog(params: LogAuditParams) {
  try {
    const stringifyValue = (val: any) => {
      if (val === null || val === undefined) return null;
      if (typeof val === "string") return val;
      return JSON.stringify(val);
    };

    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: params.action,
        targetType: params.targetType || null,
        targetId: params.targetId || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        oldValue: stringifyValue(params.oldValue),
        newValue: stringifyValue(params.newValue),
        reason: params.reason || null,
      },
    });
  } catch (error) {
    console.error("[AuditLogger] Failed to create audit log:", error);
    // Non-blocking so admin action is not failed by logging glitches
    return null;
  }
}
