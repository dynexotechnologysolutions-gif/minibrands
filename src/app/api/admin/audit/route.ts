import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await verifyAdminSession("view_audit_logs");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const whereClause: any = {};
    if (search.trim()) {
      whereClause.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { actorEmail: { contains: search, mode: "insensitive" } },
        { targetType: { contains: search, mode: "insensitive" } },
        { reason: { contains: search, mode: "insensitive" } },
      ];
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ logs: auditLogs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch audit logs." }, { status: 403 });
  }
}
