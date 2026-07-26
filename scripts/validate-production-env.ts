import "dotenv/config";
import { assertProductionEnvironment } from "@/lib/env";

try {
  assertProductionEnvironment();
  console.log("Production environment geçerli.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Production environment geçersiz.");
  process.exitCode = 1;
}
