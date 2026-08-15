import "server-only";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const databaseUrl = new URL(env.DATABASE_URL);
  const database = decodeURIComponent(databaseUrl.pathname.replace(/^\//, ""));

  if (!database) {
    throw new Error("DATABASE_URL içinde veritabanı adı bulunamadı.");
  }

  const adapter = new PrismaMariaDb({
    host: databaseUrl.hostname,
    port: databaseUrl.port ? Number(databaseUrl.port) : 3306,
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database,
    connectionLimit: env.DATABASE_CONNECTION_LIMIT,
    acquireTimeout: env.DATABASE_ACQUIRE_TIMEOUT_MS,
    connectTimeout: env.DATABASE_CONNECT_TIMEOUT_MS,
    // MariaDB pool expects idleTimeout in milliseconds; env keeps seconds
    // so the deployment-facing setting remains easy to understand.
    idleTimeout: env.DATABASE_IDLE_TIMEOUT_SECONDS * 1_000,
  });

  return new PrismaClient({
    adapter,
    transactionOptions: {
      // Remote MariaDB instances can need several seconds to hand out a
      // connection. Keep transaction start behavior consistent with the
      // adapter pool's configured acquire timeout.
      maxWait: env.DATABASE_ACQUIRE_TIMEOUT_MS,
      timeout: Math.max(env.DATABASE_ACQUIRE_TIMEOUT_MS, 60_000),
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Keep one pool per Node.js process. This also matters in production where
// route bundles can evaluate this module more than once.
globalForPrisma.prisma = prisma;
