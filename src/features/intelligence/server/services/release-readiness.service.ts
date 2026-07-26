import "server-only";
import { stableHash } from "@/features/intelligence/lib/hash";
import { calculateReleaseReadiness } from "@/features/intelligence/lib/readiness";
import type { IntelligenceValidationIssue } from "@/features/intelligence/server/services/metadata-validation.service";
import { intelligenceRepository } from "@/features/intelligence/server/repositories/intelligence.repository";

export class ReleaseReadinessService {
  calculate(issues: IntelligenceValidationIssue[]) {
    return calculateReleaseReadiness(issues);
  }

  async persist(params: {
    organizationId: string;
    releaseId: string;
    issues: IntelligenceValidationIssue[];
    inputHash: string;
  }) {
    const calculated = this.calculate(params.issues);
    return intelligenceRepository.createReadinessScore({
      organizationId: params.organizationId,
      releaseId: params.releaseId,
      inputHash: params.inputHash,
      score: calculated.score,
      blockingCount: calculated.blockingCount,
      warningCount: calculated.warningCount,
      explanation: {
        deterministic: true,
        inputHash: params.inputHash,
      },
      categories: calculated.categories.map((category) => ({
        category: category.category,
        score: category.score,
        deductions: category.deductions,
      })),
    });
  }

  buildInputHash(issues: IntelligenceValidationIssue[]) {
    return stableHash(issues.map((issue) => ({ code: issue.code, fieldPath: issue.fieldPath, severity: issue.severity, blocking: issue.blocking })));
  }
}

export const releaseReadinessService = new ReleaseReadinessService();
