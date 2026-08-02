import "dotenv/config";

import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { oneRpmAutomationService } from "@/features/distribution-automation/server/onerpm-automation.service";

const workerId = `onerpm-automation-worker:${process.pid}:${randomUUID()}`;
const idleDelayMs = Number(process.env.ONERPM_AUTOMATION_IDLE_DELAY_MS ?? 5000);
const once = process.env.ONERPM_AUTOMATION_ONCE === "true";
let stopping = false;

process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });

async function run() {
  console.info(`[${workerId}] başladı; final submit otomatik yapılmayacak.`);
  while (!stopping) {
    const result = await oneRpmAutomationService.prepareNext(workerId);
    if (!result.processed) {
      if (once) break;
      await sleep(idleDelayMs);
    }
  }
  console.info(`[${workerId}] durdu.`);
}

run().catch((error: unknown) => {
  console.error("[onerpm-automation-worker] fatal error", error instanceof Error ? error.message : "Bilinmeyen hata");
  process.exitCode = 1;
});

