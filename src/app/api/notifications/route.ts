import { NextResponse } from "next/server";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { prisma } from "@/server/prisma/prisma";

export async function GET() {
  try {
    const { organization, session } = await authSessionService.getDashboardContext();
    const notifications = await prisma.notification.findMany({ where: { userId: session.user.id, OR: [{ organizationId: organization.organization.id }, { organizationId: null }] }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, type: true, title: true, message: true, readAt: true, createdAt: true, entityType: true, entityId: true } });
    return NextResponse.json({ notifications, unread: notifications.filter((item) => !item.readAt).length });
  } catch { return NextResponse.json({ notifications: [], unread: 0 }, { status: 401 }); }
}

export async function PATCH() {
  try { const { organization, session } = await authSessionService.getDashboardContext(); await prisma.notification.updateMany({ where: { userId: session.user.id, OR: [{ organizationId: organization.organization.id }, { organizationId: null }], readAt: null }, data: { readAt: new Date() } }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "Yetkisiz" }, { status: 401 }); }
}
