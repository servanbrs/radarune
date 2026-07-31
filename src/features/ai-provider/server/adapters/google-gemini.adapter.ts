import "server-only";

import type {
  AiProviderAdapter,
  AiProviderConnectionInput,
  AiProviderConnectionResult,
  AiProviderTextInput,
  AiProviderTextResult,
} from "@/features/ai-provider/server/adapters/ai-provider-adapter";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

function extractGeminiText(data: GeminiResponse) {
  return (
    data.candidates
      ?.flatMap(
        (candidate) =>
          candidate.content?.parts ?? [],
      )
      .map((part) => part.text)
      .filter(
        (value): value is string =>
          typeof value === "string",
      )
      .join("\n")
      .trim() ?? ""
  );
}

export class GoogleGeminiAdapter
  implements AiProviderAdapter
{
  readonly provider = "GOOGLE_GEMINI" as const;

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
      message: "Google Gemini bağlantısı başarılı.",
      model: input.model,
      responseText: result.text,
    };
  }

  async generateText(
    input: AiProviderTextInput,
  ): Promise<AiProviderTextResult> {
    try {
      const model = encodeURIComponent(input.model);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": input.apiKey,
          },
          body: JSON.stringify({
            ...(input.systemPrompt
              ? {
                  systemInstruction: {
                    parts: [
                      {
                        text: input.systemPrompt,
                      },
                    ],
                  },
                }
              : {}),
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: input.userPrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature:
                input.temperature ?? 0.1,
              maxOutputTokens:
                input.maxOutputTokens ?? 800,
            },
          }),
          signal: AbortSignal.timeout(30_000),
        },
      );

      const data =
        (await response.json().catch(() => null)) as
          | GeminiResponse
          | null;

      if (!response.ok) {
        return {
          success: false,
          provider: this.provider,
          model: input.model,
          statusCode: response.status,
          message:
            data?.error?.message ??
            `Gemini bağlantısı başarısız (${response.status}).`,
          rawResponse: data,
        };
      }

      const text = data
        ? extractGeminiText(data)
        : "";

      if (!text) {
        return {
          success: false,
          provider: this.provider,
          model: input.model,
          message:
            "Gemini geçerli bir metin yanıtı döndürmedi.",
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
            : "Gemini isteği tamamlanamadı.",
      };
    }
  }
}

export const googleGeminiAdapter =
  new GoogleGeminiAdapter();
