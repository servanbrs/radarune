import "server-only";

import type { AiProviderKey } from "@/features/ai-provider/domain/ai-provider";
import type { AiProviderAdapter } from "@/features/ai-provider/server/adapters/ai-provider-adapter";
import { anthropicAdapter } from "@/features/ai-provider/server/adapters/anthropic.adapter";
import { googleGeminiAdapter } from "@/features/ai-provider/server/adapters/google-gemini.adapter";
import { openAiAdapter } from "@/features/ai-provider/server/adapters/openai.adapter";
import { openRouterAdapter } from "@/features/ai-provider/server/adapters/openrouter.adapter";

const adapters: Record<AiProviderKey, AiProviderAdapter> = {
  OPENAI: openAiAdapter,
  GOOGLE_GEMINI: googleGeminiAdapter,
  ANTHROPIC: anthropicAdapter,
  OPENROUTER: openRouterAdapter,
};

class AiProviderRegistry {
  getAdapter(provider: AiProviderKey) {
    const adapter = adapters[provider];

    if (!adapter) {
      throw new Error(`Desteklenmeyen AI sağlayıcısı: ${provider}`);
    }

    return adapter;
  }
}

export const aiProviderRegistry = new AiProviderRegistry();
