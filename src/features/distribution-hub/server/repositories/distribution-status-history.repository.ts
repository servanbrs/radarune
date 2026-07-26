import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

export class DistributionStatusHistoryRepository {
  async create(
    input: {
      organizationId: string;
      jobId?: string;
      releaseDeliveryId?: string;
      storeDeliveryId?: string;
      previousStatus?: string;
      status: string;
      message?: string;
      metadata?: Record<string, unknown>;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.distributionStatusHistory.create({
      data: {
        organizationId: input.organizationId,
        jobId: input.jobId ?? null,
        releaseDeliveryId: input.releaseDeliveryId ?? null,
        storeDeliveryId: input.storeDeliveryId ?? null,
        previousStatus: input.previousStatus ?? null,
        status: input.status,
        message: input.message ?? null,
        metadata: input.metadata
          ? (input.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
      select: {
        id: true,
      },
    });
  }
}

export const distributionStatusHistoryRepository = new DistributionStatusHistoryRepository();
