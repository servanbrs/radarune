import { describe, expect, it } from "vitest";
import { calculateReleaseReadiness } from "@/features/intelligence/lib/readiness";
import type { IntelligenceValidationIssue } from "@/features/intelligence/server/services/metadata-validation.service";

describe("ReleaseReadinessService", () => {
  it("blocking issue olduğunda readiness skorunu düşürür", () => {
    const issues: IntelligenceValidationIssue[] = [
      {
        fieldPath: "title",
        step: "basic",
        code: "TITLE_REQUIRED",
        category: "METADATA",
        title: "Başlık eksik",
        message: "Başlık zorunludur.",
        severity: "ERROR",
        blocking: true,
        source: "RULE_ENGINE",
      },
    ];

    const score = calculateReleaseReadiness(issues);

    expect(score.score).toBeLessThan(100);
    expect(score.blockingCount).toBe(1);
  });
});
