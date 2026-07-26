import { describe, expect, it } from "vitest";
import { providerRuleSchema, startReleaseIntelligenceSchema, suggestionDecisionSchema } from "@/features/intelligence/schemas/intelligence.schema";

describe("intelligence schemas", () => {
  it("varsayılan release intelligence job tiplerini doğrular", () => {
    const parsed = startReleaseIntelligenceSchema.parse({ releaseId: "release_1" });

    expect(parsed.jobTypes).toContain("METADATA_ANALYSIS");
    expect(parsed.jobTypes).toContain("READINESS_SCORE");
  });

  it("boş suggestion kararını reddeder", () => {
    const parsed = suggestionDecisionSchema.safeParse({ suggestionId: "sug_1", decision: "APPLY" });

    expect(parsed.success).toBe(false);
  });

  it("provider kuralında alan ve mesaj zorunludur", () => {
    const parsed = providerRuleSchema.safeParse({
      profileId: "profile_1",
      code: "spotify-title-required",
      category: "METADATA",
      fieldPath: "title",
      operator: "REQUIRED",
      severity: "ERROR",
      blocking: true,
      message: "Başlık zorunludur.",
    });

    expect(parsed.success).toBe(true);
  });
});
