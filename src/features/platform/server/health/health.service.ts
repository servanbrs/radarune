import DatabaseCheck from "./checks/database.check";
import EnvironmentCheck from "./checks/env.check";
import { HealthRegistry } from "./health-registry";

import type { HealthCheck } from "./health-check";
import type {
  HealthCheckResult,
  HealthStatus,
  SystemHealthSummary,
} from "./health.types";

function createUnexpectedFailureResult(
  check: HealthCheck,
  reason: unknown,
): HealthCheckResult {
  const message =
    reason instanceof Error
      ? reason.message
      : "Unexpected health check failure.";

  return {
    id: check.id,
    title: check.title,
    status: "error",
    message,
    duration: 0,
    checkedAt: new Date(),
    required: check.required,
  };
}

function calculateOverallStatus(
  checks: HealthCheckResult[],
): HealthStatus {
  const requiredChecks = checks.filter((check) => check.required);

  if (requiredChecks.some((check) => check.status === "error")) {
    return "error";
  }

  if (
    checks.some(
      (check) =>
        check.status === "warning" ||
        check.status === "unknown",
    )
  ) {
    return "warning";
  }

  if (
    checks.length > 0 &&
    checks.every((check) => check.status === "healthy")
  ) {
    return "healthy";
  }

  return "unknown";
}

function calculateScore(checks: HealthCheckResult[]): number {
  if (checks.length === 0) {
    return 0;
  }

  const points = checks.reduce((total, check) => {
    switch (check.status) {
      case "healthy":
        return total + 1;

      case "warning":
        return total + 0.5;

      case "unknown":
      case "error":
        return total;

      default:
        return total;
    }
  }, 0);

  return Math.round((points / checks.length) * 100);
}

export class HealthService {
  constructor(
    private readonly registry: HealthRegistry =
      createDefaultHealthRegistry(),
  ) {}

  async runAll(): Promise<SystemHealthSummary> {
    const startedAt = Date.now();
    const registeredChecks = this.registry.getChecks();

    const settledResults = await Promise.allSettled(
      registeredChecks.map((check) => check.check()),
    );

    const checks: HealthCheckResult[] = settledResults.map(
      (result, index) => {
        const check = registeredChecks[index];

        if (!check) {
          throw new Error(
            `Health check not found at index ${index}`,
          );
        }

        if (result.status === "fulfilled") {
          return result.value;
        }

        return createUnexpectedFailureResult(
          check,
          result.reason,
        );
      },
    );

    const requiredChecks = checks.filter(
      (check) => check.required,
    );

    const requiredHealthy = requiredChecks.filter(
      (check) => check.status === "healthy",
    ).length;

    const status = calculateOverallStatus(checks);

    return {
      status,
      score: calculateScore(checks),
      ready:
        requiredChecks.length > 0 &&
        requiredHealthy === requiredChecks.length,
      checkedAt: new Date(),
      duration: Date.now() - startedAt,
      totals: {
        checks: checks.length,
        healthy: checks.filter(
          (check) => check.status === "healthy",
        ).length,
        warning: checks.filter(
          (check) => check.status === "warning",
        ).length,
        error: checks.filter(
          (check) => check.status === "error",
        ).length,
        unknown: checks.filter(
          (check) => check.status === "unknown",
        ).length,
        required: requiredChecks.length,
        requiredHealthy,
      },
      checks,
    };
  }
}

export function createDefaultHealthRegistry(): HealthRegistry {
  return new HealthRegistry().registerMany([
    DatabaseCheck,
    EnvironmentCheck,
  ]);
}

export async function getSystemHealth(): Promise<SystemHealthSummary> {
  return new HealthService().runAll();
}
