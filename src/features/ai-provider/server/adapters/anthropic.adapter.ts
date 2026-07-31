import "server-only";

import type {
  AiProviderAdapter,
  AiProviderConnectionInput,
  AiProviderConnectionResult,
  AiProviderTextInput,
  AiProviderTextResult,
} from "@/features/ai-provider/server/adapters/ai-provider-adapter";

type AnthropicResponse = {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
  error?: {
    message?: string;
  };
};

function extractAnthropicText(
  data: AnthropicResponse,
) {
  return (
    data.content
      ?.map((item) => item.text)
      .filter(
        (value): value is string =>
          typeof value === "string",
      )
      .join("\n")
      .trim() ?? ""
  );
}

export class AnthropicAdapter
  implements AiProviderAdapter
{
  readonly provider = "ANTHROPIC" as const;

  async testConnection(
    input: AiProviderConnectionInput,
  ): Promise<AiProviderConnectionResult> {
    const result = await this.generateText({
      apiKey: input.apiKey,
      model: input.model,
      systemPrompt:
        "You are a connection test. Respond with only OK.",
      userPrompt: "Respond with OK.",
      maxOutputTokens: 16,
      temperature: 0,
    });

    if (!result.success) {
      return {
        success: false,
        message: result.message,
        model: input.model,
        ...(result.statusCode
          ? { statusCode: result.statusCode }
          : {}),
      };
    }

    return {
      success: true,
      message: "Anthropic bağlantısı başarılı.",
      model: input.model,
      responseText: result.text,
    };
  }

  async generateText(
    input: AiProviderTextInput,
  ): Promise<AiProviderTextResult> {
    try {
      const response = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": input.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: input.model,
            max_tokens:
              input.maxOutputTokens ?? 800,
            temperature: input.temperature ?? 0.1,
            ...(input.systemPrompt
              ? {
                  system: input.systemPrompt,
                }
              : {}),
            messages: [
              {
                role: "user",
                content: input.userPrompt,
              },
            ],
          }),
          signal: AbortSignal.timeout(30_000),
        },
      );

      const data =
        (await response.json().catch(() => null)) as
          | AnthropicResponse
          | null;

      if (!response.ok) {
        return {
          success: false,
          provider: this.provider,
          model: input.model,
          statusCode: response.status,
          message:
            data?.error?.message ??
            `Anthropic bağlantısı başarısız (${response.status}).`,
          rawResponse: data,
        };
      }

      const text = data
        ? extractAnthropicText(data)
        : "";

      if (!text) {
        return {
          success: false,
          provider: this.provider,
          model: input.model,
          message:
            "Anthropic geçerli bir metin yanıtı döndürmedi.",
          rawResponse: data,
        };
      }

      return {
        success: true,
        provider: this.provider,
        model: input.model,
        text,
        rawResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        provider: this.provider,
        model: input.model,
        message:
          error instanceof Error
            ? error.message
            : "Anthropic isteği tamamlanamadı.",
      };
    }
  }
}

export const anthropicAdapter =
  new AnthropicAdapter();
