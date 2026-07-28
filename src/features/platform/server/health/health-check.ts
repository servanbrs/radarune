import type { HealthCheckResult } from "./health.types";

export interface HealthCheck {
  id: string;
  title: string;
  required: boolean;

  check(): Promise<HealthCheckResult>;
}
