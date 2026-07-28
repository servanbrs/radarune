import { prisma } from "@/server/prisma/prisma";

import type { HealthCheck } from "../health-check";
import type { HealthCheckResult } from "../health.types";

const DatabaseCheck: HealthCheck = {
  id: "database",
  title: "Database",
  required: true,

  async check(): Promise<HealthCheckResult> {
    const started = Date.now();

    try {
      await prisma.$queryRaw`SELECT 1`;

      return {
        id: this.id,
        title: this.title,
        status: "healthy",
        message: "Database connection is healthy.",
        required: this.required,
        duration: Date.now() - started,
        checkedAt: new Date(),
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown database connection error.";

      return {
        id: this.id,
        title: this.title,
        status: "error",
        message,
        required: this.required,
        duration: Date.now() - started,
        checkedAt: new Date(),
      };
    }
  },
};

export default DatabaseCheck;