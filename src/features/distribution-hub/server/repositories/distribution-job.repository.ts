import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

const distributionJobSelect = {
  id: true,
  organizationId: true,
  createdByUserId: true,
  providerConfigurationId: true,
  provider: true,
  status: true,
  releaseId: true,
  releaseVersion: true,
  releaseTitle: true,
  idempotencyKey: true,
  payloadHash: true,
  canonicalPayload: true,
  validationIssues: true,
  attemptCount: true,
  maxRetryCount: true,
  nextAttemptAt: true,
  lastAttemptAt: true,
  lockedAt: true,
  lockedBy: true,
  lastErrorCode: true,
  lastErrorMessage: true,
  queuedAt: true,
  completedAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  providerConfiguration: {
    select: {
      id: true,
      provider: true,
      isEnabled: true,
      environment: true,
      maxRetryCount: true,
      timeoutSeconds: true,
      credentialsEncrypted: true,
      webhookSecretEncrypted: true,
      publicMetadata: true,
      capabilities: {
        select: {
          capability: true,
          isEnabled: true,
        },
      },
    },
  },
} satisfies Prisma.DistributionJobSelect;

export class DistributionJobRepository {
  async findById(id: string, client: DatabaseClient = prisma) {
    return client.distributionJob.findUnique({
      where: {
        id,
      },
      select: distributionJobSelect,
    });
  }

  async findDuplicate(input: {
    organizationId: string;
    releaseId: string;
    provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL";
    releaseVersion: number;
    payloadHash: string;
  }, client: DatabaseClient = prisma) {
    return client.distributionJob.findFirst({
      where: {
        organizationId: input.organizationId,
        releaseId: input.releaseId,
        provider: input.provider,
        releaseVersion: input.releaseVersion,
        payloadHash: input.payloadHash,
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  async findByIdempotencyKey(idempotencyKey: string, client: DatabaseClient = prisma) {
    return client.distributionJob.findUnique({
      where: { idempotencyKey },
      select: { id: true, status: true, organizationId: true },
    });
  }

  async create(input: {
    organizationId: string;
    createdByUserId?: string;
    providerConfigurationId?: string;
    provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL";
    status: "PENDING" | "QUEUED" | "MANUAL_REVIEW";
    releaseId: string;
    releaseVersion: number;
    releaseTitle: string;
    idempotencyKey: string;
    payloadHash: string;
    canonicalPayload: Prisma.InputJsonValue;
    maxRetryCount: number;
    queuedAt?: Date;
  }, client: DatabaseClient = prisma) {
    return client.distributionJob.create({
      data: {
        organizationId: input.organizationId,
        createdByUserId: input.createdByUserId ?? null,
        providerConfigurationId: input.providerConfigurationId ?? null,
        provider: input.provider,
        status: input.status,
        releaseId: input.releaseId,
        releaseVersion: input.releaseVersion,
        releaseTitle: input.releaseTitle,
        idempotencyKey: input.idempotencyKey,
        payloadHash: input.payloadHash,
        canonicalPayload: input.canonicalPayload,
        maxRetryCount: input.maxRetryCount,
        queuedAt: input.queuedAt ?? null,
      },
      select: distributionJobSelect,
    });
  }

  async listByOrganization(organizationId: string, client: DatabaseClient = prisma) {
    return client.distributionJob.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      select: distributionJobSelect,
    });
  }

  async reserveNextEligibleJob(
    workerId: string,
    lockStaleBefore: Date,
    now: Date,
    client: DatabaseClient = prisma,
  ) {
    return client.$transaction(async (tx) => {
      const candidate = await tx.distributionJob.findFirst({
        where: {
          status: {
            in: ["PENDING", "QUEUED", "RETRY_SCHEDULED"],
          },
          AND: [
            {
              OR: [
                {
                  lockedAt: null,
                },
                {
                  lockedAt: {
                    lt: lockStaleBefore,
                  },
                },
              ],
            },
            {
              OR: [
                {
                  nextAttemptAt: null,
                },
                {
                  nextAttemptAt: {
                    lte: now,
                  },
                },
              ],
            },
          ],
        },
        orderBy: [
          {
            nextAttemptAt: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
        select: {
          id: true,
        },
      });

      if (!candidate) {
        return null;
      }

      const updated = await tx.distributionJob.updateMany({
        where: {
          id: candidate.id,
          status: {
            in: ["PENDING", "QUEUED", "RETRY_SCHEDULED"],
          },
          AND: [
            {
              OR: [
                {
                  lockedAt: null,
                },
                {
                  lockedAt: {
                    lt: lockStaleBefore,
                  },
                },
              ],
            },
            {
              OR: [
                {
                  nextAttemptAt: null,
                },
                {
                  nextAttemptAt: {
                    lte: now,
                  },
                },
              ],
            },
          ],
        },
        data: {
          status: "PROCESSING",
          lockedAt: now,
          lockedBy: workerId,
          lastAttemptAt: now,
        },
      });

      if (updated.count === 0) {
        return null;
      }

      return tx.distributionJob.findUnique({
        where: {
          id: candidate.id,
        },
        select: distributionJobSelect,
      });
    });
  }

  
  async heartbeat(
    jobId: string,
    workerId: string,
    client: DatabaseClient = prisma,
  ) {
    const result = await client.distributionJob.updateMany({
      where: {
        id: jobId,
        status: "PROCESSING",
        lockedBy: workerId,
      },
      data: {
        lockedAt: new Date(),
      },
    });

    return result.count === 1;
  }
  async listDeadLetterJobs(
    organizationId: string,
    take = 50,
    client: DatabaseClient = prisma,
  ) {
    const safeTake = Math.min(
      Math.max(Math.trunc(take), 1),
      100,
    );

    return client.distributionJob.findMany({
      where: {
        organizationId,
        status: "MANUAL_REVIEW",
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: safeTake,
      select: distributionJobSelect,
    });
  }

  async requeueDeadLetterJob(
    jobId: string,
    organizationId: string,
    now = new Date(),
    client: DatabaseClient = prisma,
  ) {
    const result = await client.distributionJob.updateMany({
      where: {
        id: jobId,
        organizationId,
        status: "MANUAL_REVIEW",
      },
      data: {
        status: "QUEUED",
        attemptCount: 0,
        nextAttemptAt: now,
        lastAttemptAt: null,
        lockedAt: null,
        lockedBy: null,
        lastErrorCode: null,
        lastErrorMessage: null,
        completedAt: null,
        cancelledAt: null,
        queuedAt: now,
      },
    });

    if (result.count !== 1) {
      return null;
    }

    return client.distributionJob.findUnique({
      where: {
        id: jobId,
      },
      select: distributionJobSelect,
    });
  }


async updateStatus(
    id: string,
    input: {
      status:
        | "PENDING"
        | "VALIDATING"
        | "QUEUED"
        | "PROCESSING"
        | "WAITING_PROVIDER"
        | "RETRY_SCHEDULED"
        | "SUCCEEDED"
        | "PARTIALLY_SUCCEEDED"
        | "FAILED"
        | "CANCELLED"
        | "MANUAL_REVIEW";
      attemptCount?: number;
      validationIssues?: Prisma.InputJsonValue | null;
      nextAttemptAt?: Date | null;
      lastErrorCode?: string | null;
      lastErrorMessage?: string | null;
      queuedAt?: Date | null;
      completedAt?: Date | null;
      cancelledAt?: Date | null;
      lockedAt?: Date | null;
      lockedBy?: string | null;
    },
    client: DatabaseClient = prisma,
  ) {
    const data: Prisma.DistributionJobUncheckedUpdateInput = {
      status: input.status,
    };

    if (input.attemptCount !== undefined) {
      data.attemptCount = input.attemptCount;
    }
    if (input.validationIssues !== undefined) {
      data.validationIssues = input.validationIssues ?? Prisma.JsonNull;
    }
    if (input.nextAttemptAt !== undefined) {
      data.nextAttemptAt = input.nextAttemptAt;
    }
    if (input.lastErrorCode !== undefined) {
      data.lastErrorCode = input.lastErrorCode;
    }
    if (input.lastErrorMessage !== undefined) {
      data.lastErrorMessage = input.lastErrorMessage;
    }
    if (input.queuedAt !== undefined) {
      data.queuedAt = input.queuedAt;
    }
    if (input.completedAt !== undefined) {
      data.completedAt = input.completedAt;
    }
    if (input.cancelledAt !== undefined) {
      data.cancelledAt = input.cancelledAt;
    }
    if (input.lockedAt !== undefined) {
      data.lockedAt = input.lockedAt;
    }
    if (input.lockedBy !== undefined) {
      data.lockedBy = input.lockedBy;
    }

    return client.distributionJob.update({
      where: {
        id,
      },
      data,
      select: distributionJobSelect,
    });
  }
}

export const distributionJobRepository = new DistributionJobRepository();
