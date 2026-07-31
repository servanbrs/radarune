export const aiProviderKeys = [
  "OPENAI",
  "GOOGLE_GEMINI",
  "ANTHROPIC",
  "OPENROUTER",
] as const;

export type AiProviderKey = (typeof aiProviderKeys)[number];

export const aiProviderLabels: Record<AiProviderKey, string> = {
  OPENAI: "OpenAI",
  GOOGLE_GEMINI: "Google Gemini",
  ANTHROPIC: "Anthropic Claude",
  OPENROUTER: "OpenRouter",
};

export const aiProviderDefaultModels: Record<AiProviderKey, string> = {
  OPENAI: "gpt-4.1-mini",
  GOOGLE_GEMINI: "gemini-2.5-flash",
  ANTHROPIC: "claude-3-5-haiku-latest",
  OPENROUTER: "openrouter/free",
};

export const aiProviderSuggestedModels: Record<
  AiProviderKey,
  readonly string[]
> = {
  OPENAI: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"],
  GOOGLE_GEMINI: ["gemini-2.5-flash", "gemini-2.5-pro"],
  ANTHROPIC: ["claude-3-5-haiku-latest", "claude-3-7-sonnet-latest"],
  OPENROUTER: [
    "openrouter/free",
    "deepseek/deepseek-chat",
    "google/gemini-2.5-flash",
    "anthropic/claude-sonnet-4",
    "openai/gpt-4.1-mini",
  ],
};

export const aiAnalysisJobStatusKeys = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CONFIGURATION_REQUIRED",
] as const;

export type AiAnalysisJobStatus = (typeof aiAnalysisJobStatusKeys)[number];

export const aiAnalysisJobStatusLabels: Record<AiAnalysisJobStatus, string> = {
  PENDING: "Bekliyor",
  PROCESSING: "İşleniyor",
  COMPLETED: "Tamamlandı",
  FAILED: "Başarısız",
  CONFIGURATION_REQUIRED: "Yapay zekâ bağlantısı gerekli",
};

export type AiProviderPublicStatus = {
  provider: AiProviderKey;
  label: string;
  configured: boolean;
  active: boolean;
  model: string;
  maskedApiKey: string | null;
  lastTestedAt: string | null;
  lastTestError: string | null;
  autoImportReviewEnabled: boolean;
  autoAcceptEnabled: boolean;
  minimumReadinessScore: number;
  minimumConfidenceScore: number;
};

export type AiProviderRuntimeConfiguration = {
  provider: AiProviderKey;
  apiKey: string;
  model: string;
  autoImportReviewEnabled: boolean;
  autoAcceptEnabled: boolean;
  minimumReadinessScore: number;
  minimumConfidenceScore: number;
};
