import { z } from "zod";

export const intelligenceJobTypeSchema = z.enum([
  "METADATA_ANALYSIS",
  "ARTWORK_ANALYSIS",
  "AUDIO_ANALYSIS",
  "AUDIO_FINGERPRINT",
  "DUPLICATE_DETECTION",
  "LYRICS_ANALYSIS",
  "READINESS_SCORE",
  "PROVIDER_COMPATIBILITY",
]);

export const startReleaseIntelligenceSchema = z.object({
  releaseId: z.string().trim().min(1),
  jobTypes: z.array(intelligenceJobTypeSchema).min(1).default(["METADATA_ANALYSIS", "ARTWORK_ANALYSIS", "AUDIO_ANALYSIS", "DUPLICATE_DETECTION", "READINESS_SCORE"]),
});

export const suggestionDecisionSchema = z.object({
  suggestionId: z.string().trim().min(1),
  decision: z.enum(["ACCEPT", "REJECT"]),
});

export const providerRuleSchema = z.object({
  profileId: z.string().trim().min(1),
  code: z.string().trim().min(2).max(120),
  category: z.enum(["METADATA", "AUDIO", "ARTWORK", "RIGHTS", "PROVIDER_COMPATIBILITY", "CONTRIBUTOR", "DUPLICATE", "LYRICS"]),
  fieldPath: z.string().trim().min(1).max(200),
  operator: z.enum(["REQUIRED", "EQUALS", "NOT_EQUALS", "MIN", "MAX", "REGEX", "IN", "NOT_IN"]),
  severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]),
  blocking: z.boolean().default(false),
  active: z.boolean().default(true),
  message: z.string().trim().min(3).max(2000),
});

export type StartReleaseIntelligenceInput = z.infer<typeof startReleaseIntelligenceSchema>;
export type SuggestionDecisionInput = z.infer<typeof suggestionDecisionSchema>;
export type ProviderRuleInput = z.infer<typeof providerRuleSchema>;
