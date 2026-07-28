export type HealthStatus =
  | "healthy"
  | "warning"
  | "error"
  | "unknown";

export interface HealthCheckResult {
  id: string;
  title: string;
  status: HealthStatus;
  message: string;
  duration: number;
  checkedAt: Date;
  required: boolean;
  metadata?: Record<string, unknown>;
}

export interface SystemHealthSummary {
  status: HealthStatus;
  score: number;
  ready: boolean;
  checkedAt: Date;
  duration: number;
  totals: {
    checks: number;
    healthy: number;
    warning: number;
    error: number;
    unknown: number;
    required: number;
    requiredHealthy: number;
  };
  checks: HealthCheckResult[];
}
