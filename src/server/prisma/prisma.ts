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
    idleTimeout: env.DATABASE_IDLE_TIMEOUT_SECONDS,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
