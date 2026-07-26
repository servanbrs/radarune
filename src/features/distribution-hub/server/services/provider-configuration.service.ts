import "server-only";
import { performance } from "node:perf_hooks";
import { distributionProviderRegistry } from "@/features/distribution-hub/server/provider-registry";
import { decryptDistributionSecret, encryptDistributionSecret } from "@/features/distribution-hub/server/lib/crypto";
import { distributionProviderConfigurationRepository } from "@/features/distribution-hub/server/repositories/provider-configuration.repository";
import { providerConfigurationSchema, type ProviderConfigurationInput } from "@/features/distribution-hub/schemas/distribution.schema";
import { maskSensitiveValue } from "@/features/finance/lib/formatters";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { rbacService } from "@/features/authorization/server/rbac";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

function parseStoredCredentials(value: string | null | undefined) {
  if (!value) {
    return {};
  }

  return JSON.parse(decryptDistributionSecret(value)) as Record<string, string>;
}

function maskCredentialMap(credentials: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(credentials).map(([key, value]) => [key, maskSensitiveValue(value) ?? ""]),
  );
}

function assertManagePermission(actor: FinanceActorContext) {
  const allowed =
    actor.membershipRole === "OWNER" ||
    rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "distribution:manage",
      systemRole: actor.systemRole,
    });

  if (!allowed) {
    throw new Error("Distribution provider ayarlarını yönetmek için yetkiniz yok.");
  }
}

export class DistributionProviderConfigurationService {
  async listByOrganization(actor: FinanceActorContext) {
    const configs = await distributionProviderConfigurationRepository.listByOrganizationId(
      actor.organizationId,
    );

    return configs.map((config) => ({
      id: config.id,
      organizationId: config.organizationId,
      provider: config.provider,
      isEnabled: config.isEnabled,
      environment: config.environment,
      priority: config.priority,
      maxRetryCount: config.maxRetryCount,
      timeoutSeconds: config.timeoutSeconds,
      supportsAutoIsrc: config.supportsAutoIsrc,
      supportsAutoUpc: config.supportsAutoUpc,
      supportsWebhooks: config.supportsWebhooks,
      supportsUpdate: config.supportsUpdate,
      supportsTakedown: config.supportsTakedown,
      isDefault: config.isDefault,
      hasCredentials: Boolean(config.credentialsEncrypted),
      credentials: maskCredentialMap(parseStoredCredentials(config.credentialsEncrypted)),
      hasWebhookSecret: Boolean(config.webhookSecretEncrypted),
      publicMetadata:
        config.publicMetadata && typeof config.publicMetadata === "object"
          ? (config.publicMetadata as Record<string, string>)
          : {},
      enabledCapabilities: config.capabilities
        .filter((capability) => capability.isEnabled)
        .map((capability) => capability.capability),
      lastValidatedAt: config.lastValidatedAt,
      lastValidationStatus: config.lastValidationStatus,
    }));
  }

  async upsert(actor: FinanceActorContext, input: ProviderConfigurationInput) {
    assertManagePermission(actor);

    const parsed = providerConfigurationSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false as const,
        message:
          Object.values(parsed.error.flatten().fieldErrors).flat().find(Boolean) ??
          "Provider yapılandırması doğrulanamadı.",
      };
    }

    if (
      process.env.NODE_ENV === "production" &&
      !process.env.DISTRIBUTION_ENCRYPTION_KEY &&
      !process.env.BILLING_ENCRYPTION_KEY
    ) {
      return {
        success: false as const,
        message:
          "Production ortamında distribution credential kaydı için şifreleme anahtarı zorunludur.",
      };
    }

    const credentialsEncrypted =
      Object.keys(parsed.data.credentials).length > 0
        ? encryptDistributionSecret(JSON.stringify(parsed.data.credentials))
        : null;
    const webhookSecretEncrypted = parsed.data.webhookSecret
      ? encryptDistributionSecret(parsed.data.webhookSecret)
      : null;

    const configuration = await distributionProviderConfigurationRepository.upsert({
      organizationId: actor.organizationId,
      provider: parsed.data.provider,
      isEnabled: parsed.data.isEnabled,
      environment: parsed.data.environment,
      priority: parsed.data.priority,
      maxRetryCount: parsed.data.maxRetryCount,
      timeoutSeconds: parsed.data.timeoutSeconds,
      supportsAutoIsrc: parsed.data.supportsAutoIsrc,
      supportsAutoUpc: parsed.data.supportsAutoUpc,
      supportsWebhooks: parsed.data.supportsWebhooks,
      supportsUpdate: parsed.data.supportsUpdate,
      supportsTakedown: parsed.data.supportsTakedown,
      isDefault: parsed.data.isDefault,
      ...(credentialsEncrypted !== null ? { credentialsEncrypted } : {}),
      ...(webhookSecretEncrypted !== null ? { webhookSecretEncrypted } : {}),
      publicMetadata: parsed.data.publicMetadata,
      enabledCapabilities: parsed.data.enabledCapabilities,
    });

    await auditLogService.create({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "distribution.provider-config.updated",
      entityType: "DistributionProviderConfiguration",
      entityId: configuration.id,
      metadata: {
        provider: parsed.data.provider,
        environment: parsed.data.environment,
        isEnabled: parsed.data.isEnabled,
      },
    });

    return {
      success: true as const,
      data: configuration,
    };
  }

  async getRuntimeConfiguration(
    organizationId: string,
    provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL",
  ) {
    const configuration =
      await distributionProviderConfigurationRepository.findByOrganizationAndProvider(
        organizationId,
        provider,
      );

    if (!configuration) {
      return null;
    }

    return {
      id: configuration.id,
      provider: configuration.provider,
      isEnabled: configuration.isEnabled,
      environment: configuration.environment,
      priority: configuration.priority,
      maxRetryCount: configuration.maxRetryCount,
      timeoutSeconds: configuration.timeoutSeconds,
      supportsAutoIsrc: configuration.supportsAutoIsrc,
      supportsAutoUpc: configuration.supportsAutoUpc,
      supportsWebhooks: configuration.supportsWebhooks,
      supportsUpdate: configuration.supportsUpdate,
      supportsTakedown: configuration.supportsTakedown,
      isDefault: configuration.isDefault,
      credentials: parseStoredCredentials(configuration.credentialsEncrypted),
      webhookSecret: configuration.webhookSecretEncrypted
        ? decryptDistributionSecret(configuration.webhookSecretEncrypted)
        : undefined,
      publicMetadata:
        configuration.publicMetadata && typeof configuration.publicMetadata === "object"
          ? (configuration.publicMetadata as Record<string, string>)
          : {},
      enabledCapabilities: configuration.capabilities
        .filter((capability) => capability.isEnabled)
        .map((capability) => capability.capability),
    };
  }

  async testConnection(
    actor: FinanceActorContext,
    provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL",
  ) {
    assertManagePermission(actor);

    const configuration = await this.getRuntimeConfiguration(actor.organizationId, provider);

    if (!configuration) {
      return {
        success: false as const,
        message: "Provider yapılandırması bulunamadı.",
      };
    }

    const adapter = distributionProviderRegistry.getAdapter(provider);
    const startedAt = performance.now();
    const result = await adapter.testConnection({
      environment: configuration.environment,
      credentials: configuration.credentials,
      publicMetadata: configuration.publicMetadata,
      ...(configuration.webhookSecret ? { webhookSecret: configuration.webhookSecret } : {}),
    });
    const finishedAt = performance.now();

    await distributionProviderConfigurationRepository.recordHealthCheck({
      organizationId: actor.organizationId,
      providerConfigurationId: configuration.id,
      provider,
      environment: configuration.environment,
      success: result.success,
      responseTimeMs: Math.round(finishedAt - startedAt),
      ...(result.success ? {} : { errorCode: result.code, errorMessage: result.message }),
    });

    return result.success
      ? {
          success: true as const,
          data: result.data,
        }
      : {
          success: false as const,
          message: result.message,
        };
  }
}

export const distributionProviderConfigurationService =
  new DistributionProviderConfigurationService();
