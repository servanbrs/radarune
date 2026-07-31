import "server-only";

import type {
  AiProviderTextInput,
} from "@/features/ai-provider/server/adapters/ai-provider-adapter";
import { aiProviderCredentialService } from "@/features/ai-provider/server/services/ai-provider-credential.service";
import { aiProviderRegistry } from "@/features/ai-provider/server/services/ai-provider-registry";

type GenerateForOrganizationInput = Omit<
  AiProviderTextInput,
  "apiKey" | "model"
> & {
  organizationId: string;
};

export class AiProviderService {
  async getActiveProvider(
    organizationId: string,
  ) {
    return aiProviderCredentialService.getRuntimeConfiguration(
      organizationId,
    );
  }

  async generateText(
    input: GenerateForOrganizationInput,
  ) {
    const configuration =
      await this.getActiveProvider(
        input.organizationId,
      );

    if (!configuration) {
      return {
        success: false as const,
        status:
          "CONFIGURATION_REQUIRED" as const,
        message:
          "Aktif bir AI sağlayıcısı yapılandırılmamış. Admin panelinden API anahtarı ekleyip bağlantıyı test edin.",
      };
    }

    const adapter =
      aiProviderRegistry.getAdapter(
        configuration.provider,
      );

    const result =
      await adapter.generateText({
        apiKey: configuration.apiKey,
        model: configuration.model,
        userPrompt: input.userPrompt,
        ...(input.systemPrompt
          ? {
              systemPrompt:
                input.systemPrompt,
            }
          : {}),
        ...(input.temperature !== undefined
          ? {
              temperature:
                input.temperature,
            }
          : {}),
        ...(input.maxOutputTokens !==
        undefined
          ? {
              maxOutputTokens:
                input.maxOutputTokens,
            }
          : {}),
      });

    return {
      ...result,
      configuration: {
        provider:
          configuration.provider,
        model: configuration.model,
        autoImportReviewEnabled:
          configuration.autoImportReviewEnabled,
        autoAcceptEnabled:
          configuration.autoAcceptEnabled,
        minimumReadinessScore:
          configuration.minimumReadinessScore,
        minimumConfidenceScore:
          configuration.minimumConfidenceScore,
      },
    };
  }
}

export const aiProviderService =
  new AiProviderService();
