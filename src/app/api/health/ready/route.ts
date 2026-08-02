import { NextResponse } from "next/server";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { env, getProductionEnvironmentIssues } from "@/lib/env";
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
  if (env.STORAGE_PROVIDER === "LOCAL") {
    if (process.env.NODE_ENV === "production" && !env.STORAGE_ALLOW_LOCAL_IN_PRODUCTION) return false;
    const root = path.resolve(/* turbopackIgnore: true */ env.STORAGE_LOCAL_ROOT ?? env.STORAGE_LOCAL_PATH ?? "storage");
    await mkdir(root, { recursive: true });
    await access(root);
    return true;
  }

  const bucket = env.STORAGE_S3_BUCKET;
  const accessKeyId = env.STORAGE_S3_ACCESS_KEY_ID;
  const secretAccessKey = env.STORAGE_S3_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) return false;

  const client = new S3Client({
    region: env.STORAGE_S3_REGION,
    ...(env.STORAGE_S3_ENDPOINT ? { endpoint: env.STORAGE_S3_ENDPOINT } : {}),
    forcePathStyle: env.STORAGE_S3_FORCE_PATH_STYLE,
    credentials: { accessKeyId, secretAccessKey },
  });
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
  return true;
}
