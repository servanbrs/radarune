import "dotenv/config";
import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { importRepository } from "@/features/integrations/server/repositories/import.repository";
import { importSourceService } from "@/features/integrations/server/services/import-source.service";

const workerId = `onerpm-catalog-worker:${process.pid}:${randomUUID()}`;
const idleDelayMs = Number(process.env.ONERPM_CATALOG_IDLE_DELAY_MS ?? 300_000);
const once = process.env.ONERPM_CATALOG_ONCE === "true";
let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });

async function run() {
  console.info(`[${workerId}] başladı; ONErpm kataloğu periyodik çekilecek.`);
  while (!stopping) {
    const now = Date.now();
    const sources = await importRepository.listOneRpmCatalogSources();
    for (const source of sources) {
      const intervalMs = Math.max(source.frequencyMinutes, 5) * 60_000;
      if (source.lastCheckedAt && now - source.lastCheckedAt.getTime() < intervalMs) continue;
      try { console.info(`[${workerId}] ${source.id}`, await importSourceService.runScheduled(source.id)); }
      catch (error) { console.error(`[${workerId}] ${source.id} başarısız`, { message: error instanceof Error ? error.message : "Bilinmeyen hata" }); }
    }
    if (once) break;
    await sleep(idleDelayMs);
  }
}
run().catch((error) => { console.error("[onerpm-catalog-worker] fatal error", error instanceof Error ? error.message : "Bilinmeyen hata"); process.exitCode = 1; });
