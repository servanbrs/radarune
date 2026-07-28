import "server-only";
import { prisma } from "@/server/prisma/prisma";
import type { MobileRouteActor } from "@/features/mobile/server/http/mobile-route";

export class MobileNotificationService {
  async list(actor: MobileRouteActor) {
    return prisma.notification.findMany({
      where: { userId: actor.userId, organizationId: actor.organizationId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, type: true, title: true, message: true, entityType: true, entityId: true, readAt: true, createdAt: true },
    });
  }

  async markRead(actor: MobileRouteActor, notificationId: string) {
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId: actor.userId, organizationId: actor.organizationId },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      throw new Error("Bildirim bulunamadı.");
    }
  }

  async markAllRead(actor: MobileRouteActor) {
    await prisma.notification.updateMany({
      where: { userId: actor.userId, organizationId: actor.organizationId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}

export const mobileNotificationService = new MobileNotificationService();
