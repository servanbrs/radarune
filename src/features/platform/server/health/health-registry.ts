import type { HealthCheck } from "./health-check";

export class HealthRegistry {
  private readonly checks = new Map<string, HealthCheck>();

  register(check: HealthCheck): this {
    if (this.checks.has(check.id)) {
      throw new Error(
        `Health check with id "${check.id}" is already registered.`,
      );
    }

    this.checks.set(check.id, check);

    return this;
  }

  registerMany(checks: HealthCheck[]): this {
    for (const check of checks) {
      this.register(check);
    }

    return this;
  }

  getChecks(): HealthCheck[] {
    return Array.from(this.checks.values());
  }

  getCheck(id: string): HealthCheck | undefined {
    return this.checks.get(id);
  }

  hasCheck(id: string): boolean {
    return this.checks.has(id);
  }

  clear(): void {
    this.checks.clear();
  }
}
