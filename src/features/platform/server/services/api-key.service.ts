import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { apiKeyCreateSchema, type ApiKeyCreateInput } from "@/features/platform/schemas/platform.schema";
import { createPlatformApiKey, hashPlatformApiKey } from "@/features/platform/server/lib/platform-crypto";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { assertRateLimit } from "@/features/growth/lib/rate-limit";

export class ApiKeyService {
  async list(actor: FinanceActorContext) {
    assertAdminPermission(actor, "api-keys:view");
    return prisma.apiKey.findMany({
      where: { organizationId: actor.organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        rateLimitPerMinute: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  async create(actor: FinanceActorContext, input: ApiKeyCreateInput) {
    assertAdminPermission(actor, "api-keys:manage");
    const parsed = apiKeyCreateSchema.parse(input);
    if (parsed.expiresAt && parsed.expiresAt <= new Date()) {
      throw new Error("API anahtarı süresi geçmiş bir tarih olamaz.");
    }
    const rawKey = createPlatformApiKey();
    const created = await prisma.apiKey.create({
      data: {
        organizationId: actor.organizationId,
        ownerUserId: actor.userId,
        name: parsed.name,
        prefix: rawKey.slice(0, 16),
        keyHash: hashPlatformApiKey(rawKey),
        scopes: parsed.scopes as Prisma.InputJsonValue,
        rateLimitPerMinute: parsed.rateLimitPerMinute,
        expiresAt: parsed.expiresAt ?? null,
        ipAllowlist: parsed.ipAllowlist ? parsed.ipAllowlist as Prisma.InputJsonValue : Prisma.JsonNull,
        domainAllowlist: parsed.domainAllowlist ? parsed.domainAllowlist as Prisma.InputJsonValue : Prisma.JsonNull,
      },
      select: { id: true, name: true, prefix: true, scopes: true, expiresAt: true, createdAt: true },
    });
    await auditLogService.create({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "PUBLIC_API_KEY_CREATED",
      entityType: "ApiKey",
      entityId: created.id,
      metadata: { prefix: created.prefix, scopes: parsed.scopes },
    });
    return { ...created, secret: rawKey };
  }

  async revoke(actor: FinanceActorContext, keyId: string) {
    assertAdminPermission(actor, "api-keys:manage");
    const key = await prisma.apiKey.findFirst({ where: { id: keyId, organizationId: actor.organizationId, revokedAt: null } });
    if (!key) throw new Error("API anahtarı bulunamadı veya zaten iptal edilmiş.");
    const revoked = await prisma.apiKey.update({ where: { id: key.id }, data: { revokedAt: new Date() }, select: { id: true, revokedAt: true } });
    await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "PUBLIC_API_KEY_REVOKED", entityType: "ApiKey", entityId: key.id });
    return revoked;
  }

  async authenticate(request: Request) {
    const authorization = request.headers.get("authorization");
    const rawKey = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
    if (!rawKey) throw new Error("API anahtarı gerekli.");
    const key = await prisma.apiKey.findUnique({ where: { keyHash: hashPlatformApiKey(rawKey) } });
    if (!key || key.revokedAt || (key.expiresAt && key.expiresAt <= new Date())) throw new Error("API anahtarı geçersiz.");
    assertRateLimit(`public-api:${key.id}`, key.rateLimitPerMinute, 60_000);

    const tenant = await tenantContextService.resolveFromRequest();
    if (!tenant || tenant.id !== key.organizationId) throw new Error("API anahtarı tenant bağlamıyla eşleşmiyor.");

    await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
    const requestId = request.headers.get("x-request-id") ?? randomUUID();
    return { key, tenant, requestId };
  }

  assertScope(scopes: unknown, scope: string) {
    if (!Array.isArray(scopes) || !scopes.every((value): value is string => typeof value === "string") || !scopes.includes(scope)) {
      throw new Error("Bu API anahtarı istenen scope değerine sahip değil.");
    }
  }

  async recordUsage(input: { apiKeyId: string; organizationId: string; requestId: string; method: string; path: string; statusCode: number; responseTimeMs?: number; idempotencyKey?: string | null }) {
    return prisma.apiUsageRecord.create({ data: { ...input, idempotencyKey: input.idempotencyKey ?? null } });
  }
}

export const apiKeyService = new ApiKeyService();
