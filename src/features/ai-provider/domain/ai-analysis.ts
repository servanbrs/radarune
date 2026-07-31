import type {
  AiAnalysisJobStatus,
  AiProviderKey,
} from "@/features/ai-provider/domain/ai-provider";

export type AiImportReviewDecision =
  | "ACCEPT"
  | "MANUAL_REVIEW"
  | "REJECT";

export type AiImportReviewInput = {
  organizationId: string;
  releaseId?: string;
  importRowId?: string;

  release: {
    title: string;
    artistNames: string[];
    releaseType: string;
    upc?: string | null;
    language?: string | null;
    genre?: string | null;

    tracks: Array<{
      title: string;
      isrc?: string | null;
      explicit?: boolean;
      durationMs?: number | null;
      contributorNames?: string[];
    }>;
  };

  deterministicValidation: {
    success: boolean;

    issues: Array<{
      code: string;
      field: string;
      message: string;
      severity: "ERROR" | "WARNING";
    }>;
  };

  readinessScore: number;
};

export type AiImportReviewResult = {
  status: AiAnalysisJobStatus;
  provider?: AiProviderKey;
  model?: string;

  decision?: AiImportReviewDecision;
  confidenceScore?: number;

  summary?: string;
  reasons?: string[];
  warnings?: string[];

  configurationMessage?: string;
  rawResponse?: unknown;
};
