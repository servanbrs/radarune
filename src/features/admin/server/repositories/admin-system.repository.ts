import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import type { DatabaseClient } from "@/server/prisma/database-client";

export class AdminSystemRepository {
  async listAuditLogs(params: { organizationId: string; page: number; pageSize: number }) {
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { organizationId: params.organizationId },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: { actorUser: { select: { id: true, name: true, email: true } } },
      }),
      prisma.auditLog.count({ where: { organizationId: params.organizationId } }),
    ]);

    return { items, total };
  }

  async listSystemLogs(params: { organizationId: string; page: number; pageSize: number }) {
    const [items, total] = await Promise.all([
      prisma.systemLog.findMany({
        where: { organizationId: params.organizationId },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.systemLog.count({ where: { organizationId: params.organizationId } }),
    ]);

    return { items, total };
  }

  async listSettings(organizationId: string) {
    return prisma.adminSetting.findMany({
      where: { organizationId },
      orderBy: { key: "asc" },
    });
  }

  async upsertSetting(
    input: {
      organizationId: string;
      key: Prisma.AdminSettingCreateInput["key"];
      value: Prisma.InputJsonValue;
      updatedByUserId: string;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.adminSetting.upsert({
      where: { organizationId_key: { organizationId: input.organizationId, key: input.key } },
      update: { value: input.value, updatedByUserId: input.updatedByUserId },
      create: {
        organizationId: input.organizationId,
        key: input.key,
        value: input.value,
        updatedByUserId: input.updatedByUserId,
      },
    });
  }
}

export const adminSystemRepository = new AdminSystemRepository();
