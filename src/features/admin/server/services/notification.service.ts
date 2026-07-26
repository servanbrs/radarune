import "server-only";
import { prisma } from "@/server/prisma/prisma";
import type { DatabaseClient } from "@/server/prisma/database-client";

export class NotificationService {
  async create(
    input: {
      organizationId?: string;
      userId: string;
      type: string;
      title: string;
      message: string;
      entityType?: string;
      entityId?: string;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.notification.create({
      data: {
        organizationId: input.organizationId ?? null,
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      },
      select: { id: true },
    });
  }
}

export const notificationService = new NotificationService();
