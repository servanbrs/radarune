export type AiProviderCapability =
  | "TEXT_ANALYSIS"
  | "STRUCTURED_OUTPUT"
  | "IMAGE_ANALYSIS"
  | "EMBEDDINGS"
  | "MODERATION"
  | "LANGUAGE_DETECTION"
  | "GENRE_SUGGESTION"
  | "METADATA_REWRITE";

export type AiProviderResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      code: "CONFIGURATION_REQUIRED" | "PROVIDER_ERROR" | "INVALID_RESPONSE";
      message: string;
      retryable: boolean;
    };

export interface AiProviderAdapter {
  code: "OPENAI" | "ANTHROPIC" | "GOOGLE" | "INTERNAL_RULE_ENGINE";
  validateConfiguration(): Promise<AiProviderResult<{ configured: boolean }>>;
  testConnection(): Promise<AiProviderResult<{ latencyMs: number }>>;
  analyzeText(input: { text: string }): Promise<AiProviderResult<{ structuredResult: unknown }>>;
  analyzeStructuredMetadata(input: { metadata: unknown } | { release: unknown }): Promise<AiProviderResult<{ structuredResult: unknown }>>;
  analyzeImage(input: { uploadId: string }): Promise<AiProviderResult<{ structuredResult: unknown }>>;
  createEmbedding(input: { text: string }): Promise<AiProviderResult<{ embedding: number[] }>>;
  estimateUsage(input: { textLength: number }): Promise<AiProviderResult<{ unitCount: number }>>;
  supportsCapability(capability: AiProviderCapability): boolean;
  normalizeError(error: unknown): AiProviderResult<never>;
}
