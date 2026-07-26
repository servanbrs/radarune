import "server-only";
import type { AiProviderAdapter, AiProviderCapability, AiProviderResult } from "@/features/intelligence/domain/ai-provider";

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
    return new ConfigurationRequiredAiAdapter(code);
  },
  listCodes() {
    return ["OPENAI", "ANTHROPIC", "GOOGLE", "INTERNAL_RULE_ENGINE"] as const;
  },
};
