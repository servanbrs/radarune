import { NextResponse } from "next/server";
import { getProductionEnvironmentIssues } from "@/lib/env";
import { storageProviderRegistry } from "@/features/storage/server/provider-registry";
import { prisma } from "@/server/prisma/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const environmentIssues = getProductionEnvironmentIssues();
  const database = await checkDatabase();
  const storage = await checkStorage();
  const ready = environmentIssues.length === 0 && database && storage;
  return NextResponse.json(
    { status: ready ? "ready" : "not_ready", checks: { environment: environmentIssues.length === 0, database, storage } },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function checkStorage() {
  const adapter = storageProviderRegistry.getConfigured();
  const configuration = adapter.validateConfiguration();
  if (!configuration.configured) return false;
  const result = await adapter.testConnection();
  return result.success;
}
