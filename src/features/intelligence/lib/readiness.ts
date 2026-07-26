import type { IntelligenceValidationIssue } from "@/features/intelligence/server/services/metadata-validation.service";

const readinessCategories = [
  "METADATA",
  "AUDIO",
  "ARTWORK",
  "RIGHTS",
  "PROVIDER_COMPATIBILITY",
  "CONTRIBUTOR",
] as const;

type ReadinessCategory = (typeof readinessCategories)[number];

export function calculateReleaseReadiness(issues: IntelligenceValidationIssue[]) {
  const byCategory = new Map<ReadinessCategory, IntelligenceValidationIssue[]>();
  for (const category of readinessCategories) {
    byCategory.set(category, []);
  }

  for (const issue of issues) {
    if (readinessCategories.includes(issue.category as ReadinessCategory)) {
      byCategory.get(issue.category as ReadinessCategory)?.push(issue);
    }
  }

  const categoryScores = readinessCategories.map((category) => {
    const categoryIssues = byCategory.get(category) ?? [];
    const deduction = categoryIssues.reduce((total, issue) => {
      if (issue.severity === "CRITICAL") return total + 40;
      if (issue.severity === "ERROR") return total + 25;
      if (issue.severity === "WARNING") return total + 10;
      return total + 3;
    }, 0);

    return {
      category,
      score: Math.max(0, 100 - deduction),
      deductions: categoryIssues.map((issue) => ({
        code: issue.code,
        severity: issue.severity,
        blocking: issue.blocking,
        message: issue.message,
      })),
    };
  });

  return {
    score: Math.round(
      categoryScores.reduce((total, item) => total + item.score, 0) / categoryScores.length,
    ),
    blockingCount: issues.filter((issue) => issue.blocking).length,
    warningCount: issues.filter((issue) => issue.severity === "WARNING").length,
    categories: categoryScores,
  };
}
