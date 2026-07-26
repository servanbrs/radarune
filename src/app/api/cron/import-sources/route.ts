import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { importRepository } from "@/features/integrations/server/repositories/import.repository";
import { importSourceService } from "@/features/integrations/server/services/import-source.service";

function hasValidSecret(request: Request) {
  const expected = env.YOUTUBE_IMPORT_CRON_SECRET;
  const actual = request.headers.get("x-radarune-cron-secret");
  if (!expected || !actual || expected.length !== actual.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

export async function POST(request: Request) {
  if (!hasValidSecret(request)) return NextResponse.json({ error: "Cron yetkilendirmesi başarısız." }, { status: 401 });
  if (env.IMPORT_SCHEDULER_MODE !== "CRON") return NextResponse.json({ error: "Cron scheduler aktif değil." }, { status: 409 });

  const sources = await importRepository.listScheduledSources();
  const results: Array<{ sourceId: string; success: boolean }> = [];
  for (const source of sources) {
    try {
      const result = await importSourceService.runScheduled(source.id);
      results.push({ sourceId: source.id, success: "success" in result ? result.success : false });
    } catch {
      results.push({ sourceId: source.id, success: false });
    }
  }
  return NextResponse.json({ processed: results.length, succeeded: results.filter((result) => result.success).length });
}
