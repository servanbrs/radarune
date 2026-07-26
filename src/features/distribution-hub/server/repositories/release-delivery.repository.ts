import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

const releaseDeliverySelect = {
  id: true,
  organizationId: true,
  jobId: true,
  providerConfigurationId: true,
  provider: true,
  releaseId: true,
  releaseVersion: true,
  status: true,
  externalReleaseId: true,
  externalReleaseUrl: true,
  lastSyncedAt: true,
  submittedAt: true,
  deliveredAt: true,
  liveAt: true,
  rejectedAt: true,
  failedAt: true,
  takenDownAt: true,
  failureReason: true,
  createdAt: true,
  updatedAt: true,
  storeDeliveries: {
    select: {
      id: true,
      storeCode: true,
      territoryCode: true,
      status: true,
      externalStoreReference: true,
      liveUrl: true,
      liveAt: true,
    },
  },
} satisfies Prisma.ReleaseDeliverySelect;

export class ReleaseDeliveryRepository {
  async listByRelease(
    organizationId: string,
    releaseId: string,
    client: DatabaseClient = prisma,
  ) {
    return client.releaseDelivery.findMany({
      where: {
        organizationId,
        releaseId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: releaseDeliverySelect,
    });
  }

  async findByReleaseAndProvider(
    organizationId: string,
    releaseId: string,
    provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL",
    client: DatabaseClient = prisma,
  ) {
    return client.releaseDelivery.findUnique({
      where: {
        organizationId_releaseId_provider: {
          organizationId,
          releaseId,
          provider,
        },
      },
      select: releaseDeliverySelect,
    });
  }

  async findByExternalReleaseId(
    provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL",
    externalReleaseId: string,
    client: DatabaseClient = prisma,
  ) {
    return client.releaseDelivery.findFirst({
      where: {
        provider,
        externalReleaseId,
      },
      select: releaseDeliverySelect,
    });
  }

  async upsertForJob(
    input: {
      organizationId: string;
      jobId: string;
      providerConfigurationId?: string;
      provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL";
      releaseId: string;
      releaseVersion: number;
      status:
        | "NOT_SENT"
        | "QUEUED"
        | "SUBMITTED"
        | "ACCEPTED"
        | "PROCESSING"
        | "DELIVERED"
        | "LIVE"
        | "REJECTED"
        | "FAILED"
        | "TAKEDOWN_PENDING"
        | "TAKEN_DOWN";
      externalReleaseId?: string;
      externalReleaseUrl?: string;
      submittedAt?: Date;
      failureReason?: string;
    },
    client: DatabaseClient = prisma,
  ) {
    const existing = await this.findByReleaseAndProvider(
      input.organizationId,
      input.releaseId,
      input.provider,
      client,
    );

    if (existing) {
      return client.releaseDelivery.update({
        where: {
          id: existing.id,
        },
        data: {
          jobId: input.jobId,
          providerConfigurationId: input.providerConfigurationId ?? null,
          releaseVersion: input.releaseVersion,
          status: input.status,
          externalReleaseId: input.externalReleaseId ?? null,
          externalReleaseUrl: input.externalReleaseUrl ?? null,
          submittedAt: input.submittedAt ?? null,
          failureReason: input.failureReason ?? null,
        },
        select: releaseDeliverySelect,
      });
    }

    return client.releaseDelivery.create({
      data: {
        organizationId: input.organizationId,
        jobId: input.jobId,
        providerConfigurationId: input.providerConfigurationId ?? null,
        provider: input.provider,
        releaseId: input.releaseId,
        releaseVersion: input.releaseVersion,
        status: input.status,
        externalReleaseId: input.externalReleaseId ?? null,
        externalReleaseUrl: input.externalReleaseUrl ?? null,
        submittedAt: input.submittedAt ?? null,
        failureReason: input.failureReason ?? null,
      },
      select: releaseDeliverySelect,
    });
  }

  async updateStatus(
    id: string,
    input: {
      status:
        | "NOT_SENT"
        | "QUEUED"
        | "SUBMITTED"
        | "ACCEPTED"
        | "PROCESSING"
        | "DELIVERED"
        | "LIVE"
        | "REJECTED"
        | "FAILED"
        | "TAKEDOWN_PENDING"
        | "TAKEN_DOWN";
      externalReleaseId?: string | null;
      externalReleaseUrl?: string | null;
      failureReason?: string | null;
      lastSyncedAt?: Date | null;
      deliveredAt?: Date | null;
      liveAt?: Date | null;
      rejectedAt?: Date | null;
      failedAt?: Date | null;
      takenDownAt?: Date | null;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.releaseDelivery.update({
      where: {
        id,
      },
      data: {
        status: input.status,
        ...(input.externalReleaseId !== undefined
          ? { externalReleaseId: input.externalReleaseId }
          : {}),
        ...(input.externalReleaseUrl !== undefined
          ? { externalReleaseUrl: input.externalReleaseUrl }
          : {}),
        ...(input.failureReason !== undefined ? { failureReason: input.failureReason } : {}),
        ...(input.lastSyncedAt !== undefined ? { lastSyncedAt: input.lastSyncedAt } : {}),
        ...(input.deliveredAt !== undefined ? { deliveredAt: input.deliveredAt } : {}),
        ...(input.liveAt !== undefined ? { liveAt: input.liveAt } : {}),
        ...(input.rejectedAt !== undefined ? { rejectedAt: input.rejectedAt } : {}),
        ...(input.failedAt !== undefined ? { failedAt: input.failedAt } : {}),
        ...(input.takenDownAt !== undefined ? { takenDownAt: input.takenDownAt } : {}),
      },
      select: releaseDeliverySelect,
    });
  }
}

export const releaseDeliveryRepository = new ReleaseDeliveryRepository();
