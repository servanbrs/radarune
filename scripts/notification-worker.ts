import "dotenv/config";
import { setTimeout as sleep } from "node:timers/promises";
import { pushNotificationService } from "@/features/mobile/server/services/push-notification.service";

const once = process.env.NOTIFICATION_WORKER_ONCE === "true";
const idleDelayMs = Number(process.env.NOTIFICATION_WORKER_IDLE_DELAY_MS ?? 5000);
let shuttingDown = false;

process.on("SIGINT", () => {
  shuttingDown = true;
});

process.on("SIGTERM", () => {
  shuttingDown = true;
});

async function runWorker() {
  while (!shuttingDown) {
    let result: Awaited<ReturnType<typeof pushNotificationService.processNext>>;

    try {
      result = await pushNotificationService.processNext();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Notification worker hatası.";
      console.error("[notification-worker] döngü hatası", { message });
      if (once) {
        process.exitCode = 1;
        break;
      }
      await sleep(idleDelayMs);
      continue;
    }

    if (!result && once) {
      break;
    }
    if (!result) {
      await sleep(idleDelayMs);
    }
  }
}

runWorker().catch((error) => {
  const message = error instanceof Error ? error.message : "Notification worker başlatılamadı.";
  console.error("[notification-worker] fatal error", { message });
  process.exitCode = 1;
});
