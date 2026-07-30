import "server-only";
import { decryptBillingSecret, encryptBillingSecret } from "@/features/billing/server/lib/crypto";
import { paymentProviderConfigRepository } from "@/features/billing/server/repositories/payment-provider-config.repository";
import {
  providerConfigSchema,
  type ProviderConfigInput,
} from "@/features/billing/schemas/billing.schema";
import { maskSensitiveValue } from "@/features/finance/lib/formatters";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { rbacService } from "@/features/authorization/server/rbac";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

function parseStoredCredentials(value: string | null | undefined) {
  if (!value) {
    return {};
  }

  try {
    const decrypted = decryptBillingSecret(value);
    return JSON.parse(decrypted) as Record<string, string>;
  } catch {
    return {};
  }
}

function decryptOptional(value: string | null | undefined) {
  if (!value) return null;
  try {
    return decryptBillingSecret(value);
  } catch {
    return null;
  }
}

function maskCredentialMap(credentials: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(credentials).map(([key, value]) => [key, maskSensitiveValue(value) ?? ""]),
  );
}

export class PaymentProviderConfigService {
  private assertManagePermission(actor: FinanceActorContext) {
    const canManage =
      rbacService.hasEffectivePermission({
        membershipRole: actor.membershipRole,
        permission: "financial-settings:update",
        systemRole: actor.systemRole,
      }) || actor.membershipRole === "OWNER";

    if (!canManage) {
      throw new Error("Ödeme sağlayıcı ayarlarını değiştirmek için yetkiniz yok.");
    }
  }

  async listByOrganization(actor: FinanceActorContext) {
    const configs = await paymentProviderConfigRepository.listByOrganizationId(actor.organizationId);

    return configs.map((config) => ({
      id: config.id,
      organizationId: config.organizationId,
      provider: config.provider,
      active: config.active,
      displayName: config.displayName,
      hasCredentials: Boolean(config.credentialsEncrypted),
      credentials: maskCredentialMap(parseStoredCredentials(config.credentialsEncrypted)),
      publicMetadata:
        config.publicMetadata && typeof config.publicMetadata === "object"
          ? (config.publicMetadata as Record<string, string>)
          : {},
      hasWebhookSecret: Boolean(config.webhookSecretEncrypted),
    }));
  }

  async upsert(actor: FinanceActorContext, input: ProviderConfigInput) {
    this.assertManagePermission(actor);

    const parsed = providerConfigSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false as const,
        message:
          Object.values(parsed.error.flatten().fieldErrors).flat().find(Boolean) ??
          "Provider ayarları doğrulanamadı.",
      };
    }

    const credentialsEncrypted =
      Object.keys(parsed.data.credentials).length > 0
        ? encryptBillingSecret(JSON.stringify(parsed.data.credentials))
        : null;
    const webhookSecretEncrypted = parsed.data.webhookSecret
      ? encryptBillingSecret(parsed.data.webhookSecret)
      : null;

    const config = await paymentProviderConfigRepository.upsert({
      organizationId: actor.organizationId,
      provider: parsed.data.provider,
      active: parsed.data.active,
      ...(parsed.data.displayName ? { displayName: parsed.data.displayName } : {}),
      ...(credentialsEncrypted !== null ? { credentialsEncrypted } : {}),
      publicMetadata: parsed.data.publicMetadata,
      ...(webhookSecretEncrypted !== null ? { webhookSecretEncrypted } : {}),
    });

    await auditLogService.create({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "billing.provider-config.updated",
      entityType: "PaymentProviderConfig",
      entityId: config.id,
      metadata: {
        provider: parsed.data.provider,
        active: parsed.data.active,
      },
    });

    return {
      success: true as const,
      data: config,
    };
  }

  async getDecryptedRuntimeConfig(
    organizationId: string,
    provider: "STRIPE" | "IYZICO" | "PAYTR" | "MANUAL_BANK_TRANSFER",
  ) {
    const config = await paymentProviderConfigRepository.findByOrganizationAndProvider(
      organizationId,
      provider,
    );

    if (!config) {
      return null;
    }

    return {
      provider: config.provider,
      active: config.active,
      displayName: config.displayName,
      credentials: parseStoredCredentials(config.credentialsEncrypted),
      publicMetadata:
        config.publicMetadata && typeof config.publicMetadata === "object"
          ? (config.publicMetadata as Record<string, string>)
          : {},
      webhookSecret: decryptOptional(config.webhookSecretEncrypted),
    };
  }
}

export const paymentProviderConfigService = new PaymentProviderConfigService();
