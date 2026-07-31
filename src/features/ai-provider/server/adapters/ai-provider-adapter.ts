import "server-only";

import type {
  AiProviderKey,
} from "@/features/ai-provider/domain/ai-provider";

export type AiProviderConnectionInput = {
  apiKey: string;
  model: string;
};

export type AiProviderConnectionResult =
  | {
      success: true;
      message: string;
      model: string;
      responseText: string | null;
    }
  | {
      success: false;
      message: string;
      model: string;
      statusCode?: number;
    };

export type AiProviderTextInput = {
  apiKey: string;
  model: string;
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export type AiProviderTextResult =
  | {
      success: true;
      provider: AiProviderKey;
      model: string;
      text: string;
      rawResponse?: unknown;
    }
  | {
      success: false;
      provider: AiProviderKey;
      model: string;
      message: string;
      statusCode?: number;
      rawResponse?: unknown;
    };

export interface AiProviderAdapter {
  readonly provider: AiProviderKey;

  testConnection(
    input: AiProviderConnectionInput,
  ): Promise<AiProviderConnectionResult>;

  generateText(
    input: AiProviderTextInput,
  ): Promise<AiProviderTextResult>;
}
