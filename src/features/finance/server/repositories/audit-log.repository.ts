import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

type CreateAuditLogInput = {
  organizationId?: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

export class AuditLogRepository {
  async create(input: CreateAuditLogInput, client: DatabaseClient = prisma) {
    const data: Prisma.AuditLogUncheckedCreateInput = {
      organizationId: input.organizationId ?? null,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata
        ? (input.metadata as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    };

    return client.auditLog.create({
      data,
      select: {
        id: true,
      },
    });
  }

  async listRecentByOrganization(organizationId: string, limit = 10) {
    return prisma.auditLog.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        actorUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
