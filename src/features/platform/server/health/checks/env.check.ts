import type { HealthCheck } from "../health-check";
import type { HealthCheckResult } from "../health.types";

type EnvironmentRequirement = {
  name: string;
  required: boolean;
  alternatives?: string[];
};

const REQUIREMENTS: EnvironmentRequirement[] = [
  {
    name: "DATABASE_URL",
    required: true,
  },
  {
    name: "BETTER_AUTH_SECRET",
    required: true,
  },
  {
    name: "BETTER_AUTH_URL",
    required: true,
    alternatives: ["NEXT_PUBLIC_APP_URL", "APP_URL"],
  },
  {
    name: "STORAGE_PROVIDER",
    required: false,
  },
];

function hasEnvironmentValue(name: string): boolean {
  const value = process.env[name];

  return typeof value === "string" && value.trim().length > 0;
}

function requirementIsConfigured(
  requirement: EnvironmentRequirement,
): boolean {
  if (hasEnvironmentValue(requirement.name)) {
    return true;
  }

  return (
    requirement.alternatives?.some((name) =>
      hasEnvironmentValue(name),
    ) ?? false
  );
}

const EnvironmentCheck: HealthCheck = {
  id: "environment",
  title: "Environment",
  required: true,

  async check(): Promise<HealthCheckResult> {
    const startedAt = Date.now();

    const missingRequired = REQUIREMENTS.filter(
      (requirement) =>
        requirement.required &&
        !requirementIsConfigured(requirement),
    );

    const missingOptional = REQUIREMENTS.filter(
      (requirement) =>
        !requirement.required &&
        !requirementIsConfigured(requirement),
    );

    if (missingRequired.length > 0) {
      return {
        id: this.id,
        title: this.title,
        status: "error",
        message: `Missing required variables: ${missingRequired
          .map((item) => item.name)
          .join(", ")}`,
        required: this.required,
        duration: Date.now() - startedAt,
        checkedAt: new Date(),
        metadata: {
          missingRequired: missingRequired.map((item) => item.name),
          missingOptional: missingOptional.map((item) => item.name),
        },
      };
    }

    if (missingOptional.length > 0) {
      return {
        id: this.id,
        title: this.title,
        status: "warning",
        message: `Optional variables not configured: ${missingOptional
          .map((item) => item.name)
          .join(", ")}`,
        required: this.required,
        duration: Date.now() - startedAt,
        checkedAt: new Date(),
        metadata: {
          missingRequired: [],
          missingOptional: missingOptional.map((item) => item.name),
        },
      };
    }

    return {
      id: this.id,
      title: this.title,
      status: "healthy",
      message: "Required environment variables are configured.",
      required: this.required,
      duration: Date.now() - startedAt,
      checkedAt: new Date(),
      metadata: {
        missingRequired: [],
        missingOptional: [],
      },
    };
  },
};

export default EnvironmentCheck;
