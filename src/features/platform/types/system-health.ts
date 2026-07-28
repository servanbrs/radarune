export type SystemHealthStatus =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "NOT_CONFIGURED";

export type SystemHealthCheckResult = {
  checkKey: string;
  title: string;
  status: SystemHealthStatus;
  message: string;
  durationMs: number;
  checkedAt: string;
};

export type SystemHealthReport = {
  status: SystemHealthStatus;
  score: number;
  ready: boolean;
  checkedAt: string;
  durationMs: number;
  totals: {
    checks: number;
    passed: number;
    warnings: number;
    failed: number;
    notConfigured: number;
  };
  checks: SystemHealthCheckResult[];
};
