import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

export class DistributionProviderConfigurationRepository {
  async listHealthChecksByOrganization(organizationId: string, client: DatabaseClient = prisma) {
    return client.providerHealthCheck.findMany({
      where: {
        OR: [
          {
            organizationId,
          },
          {
            organizationId: null,
          },
        ],
      },
      orderBy: {
        checkedAt: "desc",
      },
      take: 50,
      select: {
        id: true,
        provider: true,
        environment: true,
        success: true,
        responseTimeMs: true,
        errorCode: true,
        errorMessage: true,
        checkedAt: true,
      },
    });
  }

  async listByOrganizationId(organizationId: string, client: DatabaseClient = prisma) {
    return client.distributionProviderConfiguration.findMany({
      where: {
        OR: [
          {
            organizationId,
          },
          {
            organizationId: null,
          },
        ],
      },
      orderBy: [
        {
          organizationId: "desc",
        },
        {
          priority: "asc",
        },
      ],
      select: {
        id: true,
        organizationId: true,
        provider: true,
        isEnabled: true,
        environment: true,
        priority: true,
        maxRetryCount: true,
        timeoutSeconds: true,
        supportsAutoIsrc: true,
        supportsAutoUpc: true,
        supportsWebhooks: true,
        supportsUpdate: true,
        supportsTakedown: true,
        isDefault: true,
        credentialsEncrypted: true,
        webhookSecretEncrypted: true,
        publicMetadata: true,
        lastValidatedAt: true,
        lastValidationStatus: true,
        capabilities: {
          select: {
            capability: true,
            isEnabled: true,
          },
        },
      },
    });
  }

  async findByOrganizationAndProvider(
    organizationId: string,
    provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL",
    client: DatabaseClient = prisma,
  ) {
    return client.distributionProviderConfiguration.findFirst({
      where: {
        provider,
        OR: [
          {
            organizationId,
          },
          {
            organizationId: null,
          },
        ],
      },
      orderBy: {
        organizationId: "desc",
      },
      select: {
        id: true,
        organizationId: true,
        provider: true,
        isEnabled: true,
        environment: true,
        priority: true,
        maxRetryCount: true,
        timeoutSeconds: true,
        supportsAutoIsrc: true,
        supportsAutoUpc: true,
        supportsWebhooks: true,
        supportsUpdate: true,
        supportsTakedown: true,
        isDefault: true,
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
    });
  }

  async findDefaultProviderForOrganization(
    organizationId: string,
    client: DatabaseClient = prisma,
  ) {
    return client.distributionProviderConfiguration.findFirst({
      where: {
        OR: [
          {
            organizationId,
          },
          {
            organizationId: null,
          },
        ],
        isEnabled: true,
        isDefault: true,
      },
      orderBy: {
        organizationId: "desc",
      },
      select: {
        id: true,
        provider: true,
      },
    });
  }

  async upsert(
    input: {
      organizationId: string;
      provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL";
      isEnabled: boolean;
      environment: "SANDBOX" | "PRODUCTION";
      priority: number;
      maxRetryCount: number;
      timeoutSeconds: number;
      supportsAutoIsrc: boolean;
      supportsAutoUpc: boolean;
      supportsWebhooks: boolean;
      supportsUpdate: boolean;
      supportsTakedown: boolean;
      isDefault: boolean;
      credentialsEncrypted?: string | null;
      webhookSecretEncrypted?: string | null;
      publicMetadata?: Record<string, string>;
      enabledCapabilities: ReadonlyArray<
        | "CREATE_RELEASE"
        | "UPDATE_RELEASE"
        | "TAKEDOWN"
        | "STATUS_SYNC"
        | "WEBHOOKS"
        | "ROYALTY_REPORTS"
        | "AUTO_ISRC"
        | "AUTO_UPC"
        | "CONTENT_ID"
        | "DOLBY_ATMOS"
        | "PRESAVE"
      >;
    },
    client: DatabaseClient = prisma,
  ) {
    const data: Prisma.DistributionProviderConfigurationUncheckedCreateInput = {
      organizationId: input.organizationId,
      provider: input.provider,
      isEnabled: input.isEnabled,
      environment: input.environment,
      priority: input.priority,
      maxRetryCount: input.maxRetryCount,
      timeoutSeconds: input.timeoutSeconds,
      supportsAutoIsrc: input.supportsAutoIsrc,
      supportsAutoUpc: input.supportsAutoUpc,
      supportsWebhooks: input.supportsWebhooks,
      supportsUpdate: input.supportsUpdate,
      supportsTakedown: input.supportsTakedown,
      isDefault: input.isDefault,
      credentialsEncrypted: input.credentialsEncrypted ?? null,
      webhookSecretEncrypted: input.webhookSecretEncrypted ?? null,
      publicMetadata: input.publicMetadata
        ? (input.publicMetadata as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    };

    const existing = await client.distributionProviderConfiguration.findFirst({
      where: {
        organizationId: input.organizationId,
        provider: input.provider,
      },
      select: {
        id: true,
      },
    });

    const configuration = existing
      ? await client.distributionProviderConfiguration.update({
          where: {
            id: existing.id,
          },
          data,
          select: {
            id: true,
          },
        })
      : await client.distributionProviderConfiguration.create({
          data,
          select: {
            id: true,
          },
        });

    await client.distributionProviderCapability.deleteMany({
      where: {
        configurationId: configuration.id,
      },
    });

    if (input.enabledCapabilities.length > 0) {
      await client.distributionProviderCapability.createMany({
        data: input.enabledCapabilities.map((capability) => ({
          configurationId: configuration.id,
          provider: input.provider,
          capability,
          isEnabled: true,
        })),
      });
    }

    return configuration;
  }

  async recordHealthCheck(
    input: {
      organizationId?: string;
      providerConfigurationId?: string;
      provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL";
      environment: "SANDBOX" | "PRODUCTION";
      success: boolean;
      responseTimeMs?: number;
      errorCode?: string;
      errorMessage?: string;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.providerHealthCheck.create({
      data: {
        organizationId: input.organizationId ?? null,
        providerConfigurationId: input.providerConfigurationId ?? null,
        provider: input.provider,
        environment: input.environment,
        success: input.success,
        responseTimeMs: input.responseTimeMs ?? null,
        errorCode: input.errorCode ?? null,
        errorMessage: input.errorMessage ?? null,
      },
      select: {
        id: true,
      },
    });
  }
}

export const distributionProviderConfigurationRepository =
  new DistributionProviderConfigurationRepository();
