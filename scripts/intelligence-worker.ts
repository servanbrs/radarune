import "dotenv/config";
import { intelligenceWorkerService } from "@/features/intelligence/server/services/intelligence-worker.service";

const workerId = `intelligence-worker-${process.pid}`;
const result = await intelligenceWorkerService.processNext(workerId);

if (!result) {
  console.log("İşlenecek AI intelligence işi yok.");
} else {
  console.log(JSON.stringify(result));
}
