import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

export class ProviderWebhookEventRepository {
  async listByOrganization(organizationId: string, client: DatabaseClient = prisma) {
    return client.providerWebhookEvent.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        receivedAt: "desc",
      },
      take: 50,
      select: {
        id: true,
        provider: true,
        externalEventId: true,
        processingStatus: true,
        signatureVerified: true,
        errorMessage: true,
        receivedAt: true,
        processedAt: true,
        failedAt: true,
        releaseDeliveryId: true,
      },
    });
  }

  async findDuplicate(
    provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL",
    externalEventId: string,
    client: DatabaseClient = prisma,
  ) {
    return client.providerWebhookEvent.findUnique({
      where: {
        provider_externalEventId: {
          provider,
          externalEventId,
        },
      },
      select: {
        id: true,
        processingStatus: true,
      },
    });
  }

  async create(
    input: {
      organizationId?: string;
      providerConfigurationId?: string;
      releaseDeliveryId?: string;
      provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL";
      externalEventId: string;
      processingStatus:
        | "PENDING"
        | "PROCESSED"
        | "FAILED"
        | "DUPLICATE"
        | "INVALID_SIGNATURE";
      signatureVerified?: boolean;
      payload: Prisma.InputJsonValue;
      headers?: Prisma.InputJsonValue;
      normalizedPayload?: Prisma.InputJsonValue;
      errorMessage?: string;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.providerWebhookEvent.create({
      data: {
        organizationId: input.organizationId ?? null,
        providerConfigurationId: input.providerConfigurationId ?? null,
        releaseDeliveryId: input.releaseDeliveryId ?? null,
        provider: input.provider,
        externalEventId: input.externalEventId,
        processingStatus: input.processingStatus,
        signatureVerified: input.signatureVerified ?? false,
        payload: input.payload,
        headers: input.headers ?? Prisma.JsonNull,
        normalizedPayload: input.normalizedPayload ?? Prisma.JsonNull,
        errorMessage: input.errorMessage ?? null,
      },
      select: {
        id: true,
      },
    });
  }

  async updateStatus(
    id: string,
    input: {
      processingStatus:
        | "PENDING"
        | "PROCESSED"
        | "FAILED"
        | "DUPLICATE"
        | "INVALID_SIGNATURE";
      signatureVerified?: boolean;
      normalizedPayload?: Prisma.InputJsonValue | null;
      errorMessage?: string | null;
      processedAt?: Date | null;
      failedAt?: Date | null;
      releaseDeliveryId?: string | null;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.providerWebhookEvent.update({
      where: {
        id,
      },
      data: {
        processingStatus: input.processingStatus,
        ...(input.signatureVerified !== undefined
          ? { signatureVerified: input.signatureVerified }
          : {}),
        ...(input.normalizedPayload !== undefined
          ? { normalizedPayload: input.normalizedPayload ?? Prisma.JsonNull }
          : {}),
        ...(input.errorMessage !== undefined ? { errorMessage: input.errorMessage } : {}),
        ...(input.processedAt !== undefined ? { processedAt: input.processedAt } : {}),
        ...(input.failedAt !== undefined ? { failedAt: input.failedAt } : {}),
        ...(input.releaseDeliveryId !== undefined
          ? { releaseDeliveryId: input.releaseDeliveryId }
          : {}),
      },
      select: {
        id: true,
      },
    });
  }
}

export const providerWebhookEventRepository = new ProviderWebhookEventRepository();
