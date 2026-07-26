import "dotenv/config";
import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { distributionProcessorService } from "@/features/distribution-hub/server/services/distribution-processor.service";

const workerId = `distribution-worker:${process.pid}:${randomUUID()}`;
const idleDelayMs = Number(process.env.DISTRIBUTION_WORKER_IDLE_DELAY_MS ?? 5000);
const once = process.env.DISTRIBUTION_WORKER_ONCE === "true";
let shuttingDown = false;

process.on("SIGINT", () => {
  shuttingDown = true;
});

process.on("SIGTERM", () => {
  shuttingDown = true;
});

async function runWorker() {
  console.info(`[distribution-worker] started ${workerId}`);

  while (!shuttingDown) {
    try {
      const result = await distributionProcessorService.processNextJob(workerId);
      if (!result.data?.processed) {
        if (once) {
          break;
        }

        await sleep(idleDelayMs);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Beklenmeyen worker hatası.";
      console.error("[distribution-worker] job processing failed", { message });

      if (once) {
        process.exitCode = 1;
        break;
      }

      await sleep(idleDelayMs);
    }
  }

  console.info(`[distribution-worker] stopped ${workerId}`);
}

runWorker().catch((error) => {
  const message = error instanceof Error ? error.message : "Distribution worker başlatılamadı.";
  console.error("[distribution-worker] fatal error", { message });
  process.exitCode = 1;
});
