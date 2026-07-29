import "server-only";
import type { AiProviderAdapter, AiProviderCapability, AiProviderResult } from "@/features/intelligence/domain/ai-provider";

const openAiKey = () => process.env.OPENAI_API_KEY;
const openAiModel = () => process.env.OPENAI_MODEL || "gpt-4o-mini";

class ConfigurationRequiredAiAdapter implements AiProviderAdapter {
  constructor(public readonly code: "OPENAI" | "ANTHROPIC" | "GOOGLE") {}

  async validateConfiguration() {
    return {
      success: false as const,
      code: "CONFIGURATION_REQUIRED" as const,
      message: `${this.code} API anahtarı yapılandırılmadı.`,
      retryable: false,
    };
  }

  async testConnection() {
    return this.validateConfiguration();
  }

  async analyzeText(_input?: { text: string }) {
    void _input;
    return this.validateConfiguration();
  }

  async analyzeStructuredMetadata(_input?: { metadata: unknown } | { release: unknown }) {
    void _input;
    return this.validateConfiguration();
  }

  async analyzeImage(_input?: { uploadId: string }) {
    void _input;
    return this.validateConfiguration();
  }

  async createEmbedding(_input?: { text: string }) {
    void _input;
    return this.validateConfiguration();
  }

  async estimateUsage(_input?: { textLength: number }) {
    void _input;
    return this.validateConfiguration();
  }

  supportsCapability() {
    return false;
  }

  normalizeError(error: unknown): AiProviderResult<never> {
    return {
      success: false,
      code: "PROVIDER_ERROR",
      message: error instanceof Error ? error.message : "AI provider hatası.",
      retryable: true,
    };
  }
}

class OpenAiAdapter implements AiProviderAdapter {
  code = "OPENAI" as const;

  async validateConfiguration() {
    return openAiKey()
      ? { success: true as const, data: { configured: true } }
      : { success: false as const, code: "CONFIGURATION_REQUIRED" as const, message: "OPENAI_API_KEY yapılandırılmadı.", retryable: false };
  }

  async testConnection() {
    const configured = await this.validateConfiguration();
    if (!configured.success) return configured;
    const started = Date.now();
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${openAiKey()}` },
        cache: "no-store",
      });
      if (!response.ok) return this.providerResponseError(response);
      return { success: true as const, data: { latencyMs: Date.now() - started } };
    } catch (error) {
      return this.normalizeError(error);
    }
  }

  async analyzeText(input: { text: string }) {
    return this.complete(`Yayın metadata yardımcısısın. Aşağıdaki metni analiz et ve yalnızca JSON döndür: ${input.text}`);
  }

  async analyzeStructuredMetadata(input: { metadata: unknown } | { release: unknown }) {
    const metadata = "metadata" in input ? input.metadata : input.release;
    return this.complete(
      "Bir müzik yayınının gönderim öncesi yardımcısısın. JSON olarak yalnızca {summary:string,suggestions:Array<{field:string,action:string,priority:\"high\"|\"medium\"|\"low\"}>} döndür. Deterministik doğrulama skorunu değiştirme; sadece uygulanabilir öneriler üret. Yayın verisi: " +
        JSON.stringify(metadata),
    );
  }

  async analyzeImage() { return this.unsupported("Görsel analizi bu sürümde etkin değil."); }
  async createEmbedding() { return this.unsupported("Embedding bu sürümde etkin değil."); }
  async estimateUsage(input: { textLength: number }) {
    const configured = await this.validateConfiguration();
    return configured.success
      ? { success: true as const, data: { unitCount: Math.max(1, Math.ceil(input.textLength / 1000)) } }
      : configured;
  }
  supportsCapability(capability: AiProviderCapability) {
    return ["TEXT_ANALYSIS", "STRUCTURED_OUTPUT", "MODERATION", "GENRE_SUGGESTION", "METADATA_REWRITE"].includes(capability);
  }
  normalizeError(error: unknown): AiProviderResult<never> {
    return { success: false, code: "PROVIDER_ERROR", message: error instanceof Error ? error.message : "OpenAI provider hatası.", retryable: true };
  }
  private unsupported(message: string) { return { success: false as const, code: "CONFIGURATION_REQUIRED" as const, message, retryable: false }; }
  private async providerResponseError(response: Response): Promise<AiProviderResult<never>> {
    const text = await response.text();
    let message = text;
    try { message = (JSON.parse(text) as { error?: { message?: string } }).error?.message ?? text; } catch { /* provider may return plain text */ }
    return { success: false, code: "PROVIDER_ERROR", message: `OpenAI (${response.status}): ${message.slice(0, 300)}`, retryable: response.status >= 500 || response.status === 429 };
  }
  private async complete(prompt: string): Promise<AiProviderResult<{ structuredResult: unknown }>> {
    const configured = await this.validateConfiguration();
    if (!configured.success) return configured;
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openAiKey()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: openAiModel(), temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "system", content: "Radarune müzik dağıtım asistanı. Kısa, Türkçe ve uygulanabilir yanıtlar üret." }, { role: "user", content: prompt }] }),
        cache: "no-store",
      });
      if (!response.ok) return this.providerResponseError(response);
      const text = await response.text();
      let payload: { choices?: Array<{ message?: { content?: string } }> };
      try { payload = JSON.parse(text) as typeof payload; } catch { return { success: false, code: "INVALID_RESPONSE", message: "AI yanıtı JSON olarak çözümlenemedi.", retryable: false }; }
      const content = payload.choices?.[0]?.message?.content;
      if (!content) return { success: false, code: "INVALID_RESPONSE", message: "AI boş yanıt döndürdü.", retryable: false };
      try { return { success: true, data: { structuredResult: JSON.parse(content) } }; } catch { return { success: false, code: "INVALID_RESPONSE", message: "AI yanıtı geçerli JSON değil.", retryable: false }; }
    } catch (error) { return this.normalizeError(error); }
  }
}

class InternalRuleEngineAdapter implements AiProviderAdapter {
  code = "INTERNAL_RULE_ENGINE" as const;

  async validateConfiguration() {
    return { success: true as const, data: { configured: true } };
  }

  async testConnection() {
    return { success: true as const, data: { latencyMs: 0 } };
  }

  async analyzeText(_input?: { text: string }) {
    void _input;
    return this.unsupported();
  }

  async analyzeStructuredMetadata(_input?: { metadata: unknown } | { release: unknown }) {
    void _input;
    return this.unsupported();
  }

  async analyzeImage(_input?: { uploadId: string }) {
    void _input;
    return this.unsupported();
  }

  async createEmbedding(_input?: { text: string }) {
    void _input;
    return this.unsupported();
  }

  async estimateUsage(input: { textLength: number }) {
    return { success: true as const, data: { unitCount: Math.max(1, Math.ceil(input.textLength / 1000)) } };
  }

  supportsCapability(capability: AiProviderCapability) {
    return capability === "TEXT_ANALYSIS" || capability === "STRUCTURED_OUTPUT";
  }

  normalizeError(error: unknown): AiProviderResult<never> {
    return {
      success: false,
      code: "PROVIDER_ERROR",
      message: error instanceof Error ? error.message : "Internal rule engine hatası.",
      retryable: false,
    };
  }

  private unsupported() {
    return {
      success: false as const,
      code: "CONFIGURATION_REQUIRED" as const,
      message: "Bu işlem için harici AI provider yapılandırması gerekli.",
      retryable: false,
    };
  }
}

export const aiProviderRegistry = {
  get(code: "OPENAI" | "ANTHROPIC" | "GOOGLE" | "INTERNAL_RULE_ENGINE") {
    if (code === "INTERNAL_RULE_ENGINE") {
      return new InternalRuleEngineAdapter();
    }
    if (code === "OPENAI") return new OpenAiAdapter();
    return new ConfigurationRequiredAiAdapter(code);
  },
  listCodes() {
    return ["OPENAI", "ANTHROPIC", "GOOGLE", "INTERNAL_RULE_ENGINE"] as const;
  },
};
