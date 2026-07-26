import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

export class DistributionAttemptRepository {
  async create(
    input: {
      organizationId: string;
      jobId: string;
      provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL";
      attemptNumber: number;
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
      idempotencyKey: string;
      retryable?: boolean;
      requestPayload?: Prisma.InputJsonValue;
      responsePayload?: Prisma.InputJsonValue;
      errorCode?: string;
      errorMessage?: string;
      startedAt?: Date;
      finishedAt?: Date;
      durationMs?: number;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.distributionAttempt.create({
      data: {
        organizationId: input.organizationId,
        jobId: input.jobId,
        provider: input.provider,
        attemptNumber: input.attemptNumber,
        status: input.status,
        idempotencyKey: input.idempotencyKey,
        retryable: input.retryable ?? false,
        requestPayload: input.requestPayload ?? Prisma.JsonNull,
        responsePayload: input.responsePayload ?? Prisma.JsonNull,
        errorCode: input.errorCode ?? null,
        errorMessage: input.errorMessage ?? null,
        startedAt: input.startedAt ?? new Date(),
        finishedAt: input.finishedAt ?? null,
        durationMs: input.durationMs ?? null,
      },
      select: {
        id: true,
      },
    });
  }
}

export const distributionAttemptRepository = new DistributionAttemptRepository();
