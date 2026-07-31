import "server-only";

import {
  decryptBillingSecret,
  encryptBillingSecret,
} from "@/features/billing/server/lib/crypto";
import {
  aiProviderDefaultModels,
  aiProviderKeys,
  aiProviderLabels,
  type AiProviderKey,
  type AiProviderPublicStatus,
  type AiProviderRuntimeConfiguration,
} from "@/features/ai-provider/domain/ai-provider";
import {
  saveAiProviderSchema,
  testAiProviderSchema,
} from "@/features/ai-provider/schemas/ai-provider.schema";
import { aiProviderRegistry } from "@/features/ai-provider/server/services/ai-provider-registry";
import { prisma } from "@/server/prisma/prisma";

type StoredAiCredential = {
  apiKey: string;
  model: string;
  autoImportReviewEnabled: boolean;
  autoAcceptEnabled: boolean;
  minimumReadinessScore: number;
  minimumConfidenceScore: number;
};

function isAiProviderKey(
  value: string,
): value is AiProviderKey {
  return aiProviderKeys.includes(
    value as AiProviderKey,
  );
}

function maskApiKey(apiKey: string) {
  const normalized = apiKey.trim();

  if (normalized.length <= 8) {
    return "••••••••";
  }

  return `${normalized.slice(0, 4)}••••••••${normalized.slice(-4)}`;
}

function parseStoredCredential(
  encrypted: string,
): StoredAiCredential | null {
  try {
    const decrypted =
      decryptBillingSecret(encrypted);

    if (!decrypted) {
      return null;
    }

    const parsed = JSON.parse(
      decrypted,
    ) as Partial<StoredAiCredential>;

    if (
      typeof parsed.apiKey !== "string" ||
      typeof parsed.model !== "string"
    ) {
      return null;
    }

    return {
      apiKey: parsed.apiKey,
      model: parsed.model,
      autoImportReviewEnabled:
        parsed.autoImportReviewEnabled ?? true,
      autoAcceptEnabled:
        parsed.autoAcceptEnabled ?? false,
      minimumReadinessScore:
        parsed.minimumReadinessScore ?? 85,
      minimumConfidenceScore:
        parsed.minimumConfidenceScore ?? 90,
    };
  } catch {
    return null;
  }
}

function defaultPublicStatus(
  provider: AiProviderKey,
): AiProviderPublicStatus {
  return {
    provider,
    label: aiProviderLabels[provider],
    configured: false,
    active: false,
    model: aiProviderDefaultModels[provider],
    maskedApiKey: null,
    lastTestedAt: null,
    lastTestError: null,
    autoImportReviewEnabled: true,
    autoAcceptEnabled: false,
    minimumReadinessScore: 85,
    minimumConfidenceScore: 90,
  };
}

export class AiProviderCredentialService {
  async list(
    organizationId: string,
  ): Promise<AiProviderPublicStatus[]> {
    const rows =
      await prisma.integrationCredential.findMany({
        where: {
          organizationId,
          provider: {
            in: [...aiProviderKeys],
          },
        },
        select: {
          provider: true,
          credentialsEncrypted: true,
          active: true,
          lastTestedAt: true,
          lastTestError: true,
        },
      });

    const rowMap = new Map(
      rows.map((row) => [
        row.provider,
        row,
      ]),
    );

    return aiProviderKeys.map((provider) => {
      const row = rowMap.get(provider);

      if (!row) {
        return defaultPublicStatus(provider);
      }

      const credential =
        parseStoredCredential(
          row.credentialsEncrypted,
        );

      return {
        provider,
        label: aiProviderLabels[provider],
        configured: Boolean(
          credential?.apiKey,
        ),
        active: row.active,
        model:
          credential?.model ??
          aiProviderDefaultModels[provider],
        maskedApiKey: credential?.apiKey
          ? maskApiKey(credential.apiKey)
          : null,
        lastTestedAt:
          row.lastTestedAt?.toISOString() ??
          null,
        lastTestError: row.lastTestError,
        autoImportReviewEnabled:
          credential
            ?.autoImportReviewEnabled ?? true,
        autoAcceptEnabled:
          credential?.autoAcceptEnabled ??
          false,
        minimumReadinessScore:
          credential?.minimumReadinessScore ??
          85,
        minimumConfidenceScore:
          credential?.minimumConfidenceScore ??
          90,
      };
    });
  }

  async getStatus(
    organizationId: string,
    provider: AiProviderKey,
  ) {
    const statuses =
      await this.list(organizationId);

    return (
      statuses.find(
        (item) =>
          item.provider === provider,
      ) ?? defaultPublicStatus(provider)
    );
  }

  async getRuntimeConfiguration(
    organizationId: string,
  ): Promise<AiProviderRuntimeConfiguration | null> {
    const row =
      await prisma.integrationCredential.findFirst({
        where: {
          organizationId,
          provider: {
            in: [...aiProviderKeys],
          },
          active: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          provider: true,
          credentialsEncrypted: true,
        },
      });

    if (
      !row ||
      !isAiProviderKey(row.provider)
    ) {
      return null;
    }

    const credential =
      parseStoredCredential(
        row.credentialsEncrypted,
      );

    if (!credential?.apiKey) {
      return null;
    }

    return {
      provider: row.provider,
      apiKey: credential.apiKey,
      model: credential.model,
      autoImportReviewEnabled:
        credential.autoImportReviewEnabled,
      autoAcceptEnabled:
        credential.autoAcceptEnabled,
      minimumReadinessScore:
        credential.minimumReadinessScore,
      minimumConfidenceScore:
        credential.minimumConfidenceScore,
    };
  }

  async test(input: unknown) {
    const parsed =
      testAiProviderSchema.parse(input);

    const adapter =
      aiProviderRegistry.getAdapter(
        parsed.provider,
      );

    return adapter.testConnection({
      apiKey: parsed.apiKey,
      model: parsed.model,
    });
  }

  async save(
    organizationId: string,
    input: unknown,
  ) {
    const parsed =
      saveAiProviderSchema.parse(input);

    const adapter =
      aiProviderRegistry.getAdapter(
        parsed.provider,
      );

    const connection =
      await adapter.testConnection({
        apiKey: parsed.apiKey,
        model: parsed.model,
      });

    const storedCredential: StoredAiCredential =
      {
        apiKey: parsed.apiKey,
        model: parsed.model,
        autoImportReviewEnabled:
          parsed.autoImportReviewEnabled,
        autoAcceptEnabled:
          parsed.autoAcceptEnabled,
        minimumReadinessScore:
          parsed.minimumReadinessScore,
        minimumConfidenceScore:
          parsed.minimumConfidenceScore,
      };

    const now = new Date();

    await prisma.$transaction(
      async (transaction) => {
        if (
          parsed.active &&
          connection.success
        ) {
          await transaction.integrationCredential.updateMany(
            {
              where: {
                organizationId,
                provider: {
                  in: aiProviderKeys.filter(
                    (provider) =>
                      provider !==
                      parsed.provider,
                  ),
                },
              },
              data: {
                active: false,
              },
            },
          );
        }

        await transaction.integrationCredential.upsert(
          {
            where: {
              organizationId_provider: {
                organizationId,
                provider:
                  parsed.provider,
              },
            },
            update: {
              credentialsEncrypted:
                encryptBillingSecret(
                  JSON.stringify(
                    storedCredential,
                  ),
                ),
              active:
                parsed.active &&
                connection.success,
              lastTestedAt: now,
              lastTestError:
                connection.success
                  ? null
                  : connection.message,
            },
            create: {
              organizationId,
              provider: parsed.provider,
              credentialsEncrypted:
                encryptBillingSecret(
                  JSON.stringify(
                    storedCredential,
                  ),
                ),
              active:
                parsed.active &&
                connection.success,
              lastTestedAt: now,
              lastTestError:
                connection.success
                  ? null
                  : connection.message,
            },
          },
        );
      },
    );

    return {
      success: connection.success,
      message: connection.message,
      status: await this.getStatus(
        organizationId,
        parsed.provider,
      ),
    };
  }

  async testSaved(
    organizationId: string,
    provider: AiProviderKey,
  ) {
    const row =
      await prisma.integrationCredential.findUnique(
        {
          where: {
            organizationId_provider: {
              organizationId,
              provider,
            },
          },
          select: {
            credentialsEncrypted: true,
          },
        },
      );

    if (!row) {
      return {
        success: false as const,
        message:
          "Bu AI sağlayıcısı için kayıtlı API anahtarı bulunamadı.",
      };
    }

    const credential =
      parseStoredCredential(
        row.credentialsEncrypted,
      );

    if (!credential) {
      return {
        success: false as const,
        message:
          "Kayıtlı AI bağlantısı çözülemedi. API anahtarını yeniden kaydedin.",
      };
    }

    const adapter =
      aiProviderRegistry.getAdapter(provider);

    const connection =
      await adapter.testConnection({
        apiKey: credential.apiKey,
        model: credential.model,
      });

    await prisma.integrationCredential.update({
      where: {
        organizationId_provider: {
          organizationId,
          provider,
        },
      },
      data: {
        active: connection.success,
        lastTestedAt: new Date(),
        lastTestError:
          connection.success
            ? null
            : connection.message,
      },
    });

    return connection;
  }

  async remove(
    organizationId: string,
    provider: AiProviderKey,
  ) {
    await prisma.integrationCredential.deleteMany(
      {
        where: {
          organizationId,
          provider,
        },
      },
    );

    return {
      success: true as const,
      message:
        `${aiProviderLabels[provider]} bağlantısı kaldırıldı.`,
    };
  }
}

export const aiProviderCredentialService =
  new AiProviderCredentialService();
