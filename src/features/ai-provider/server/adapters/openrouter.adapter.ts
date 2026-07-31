import "server-only";

import type {
  AiProviderAdapter,
  AiProviderConnectionInput,
  AiProviderConnectionResult,
  AiProviderTextInput,
  AiProviderTextResult,
} from "@/features/ai-provider/server/adapters/ai-provider-adapter";

type OpenAiResponse = {
  id?: string;
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

function extractOpenAiText(data: OpenAiResponse) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((item) => item.text)
      .find(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      )
      ?.trim() ?? ""
  );
}

export class OpenRouterAdapter implements AiProviderAdapter {
  readonly provider = "OPENAI" as const;

  async testConnection(
    input: AiProviderConnectionInput,
  ): Promise<AiProviderConnectionResult> {
    const result = await this.generateText({
      apiKey: input.apiKey,
      model: input.model,
      systemPrompt: "You are a connection test. Respond with only OK.",
      userPrompt: "Respond with OK.",
      maxOutputTokens: 16,
      temperature: 0,
    });

    if (!result.success) {
      return {
        success: false,
        message: result.message,
        model: input.model,
        ...(result.statusCode ? { statusCode: result.statusCode } : {}),
      };
    }

    return {
      success: true,
      message: "OpenRouter bağlantısı başarılı.",
      model: input.model,
      responseText: result.text,
    };
  }

  async generateText(
    input: AiProviderTextInput,
  ): Promise<AiProviderTextResult> {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL ??
            process.env.BETTER_AUTH_URL ??
            "https://radarune.com",
          "X-OpenRouter-Title": "Radarune",
        },
        body: JSON.stringify({
          model: input.model,
          input: [
            ...(input.systemPrompt
              ? [
                  {
                    role: "system",
                    content: input.systemPrompt,
                  },
                ]
              : []),
            {
              role: "user",
              content: input.userPrompt,
            },
          ],
          max_output_tokens: input.maxOutputTokens ?? 800,
          temperature: input.temperature ?? 0.1,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      const data = (await response
        .json()
        .catch(() => null)) as OpenAiResponse | null;

      if (!response.ok) {
        return {
          success: false,
          provider: this.provider,
          model: input.model,
          statusCode: response.status,
          message:
            data?.error?.message ??
            `OpenRouter bağlantısı başarısız (${response.status}).`,
          rawResponse: data,
        };
      }

      const text = data ? extractOpenAiText(data) : "";

      if (!text) {
        return {
          success: false,
          provider: this.provider,
          model: input.model,
          message: "OpenAI geçerli bir metin yanıtı döndürmedi.",
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
            : "OpenRouter isteği tamamlanamadı.",
      };
    }
  }
}

export const openRouterAdapter = new OpenRouterAdapter();
