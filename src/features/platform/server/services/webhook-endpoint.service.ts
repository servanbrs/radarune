import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { isIP } from "node:net";
import { resolve4, resolve6 } from "node:dns/promises";
import { prisma } from "@/server/prisma/prisma";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { webhookEndpointCreateSchema, type WebhookEndpointCreateInput } from "@/features/platform/schemas/platform.schema";
import { createWebhookSecret, decryptPlatformSecret, encryptPlatformSecret } from "@/features/platform/server/lib/platform-crypto";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { createHmac, randomUUID } from "node:crypto";

function isPrivateIp(value: string) {
  if (isIP(value) === 4) {
    const parts = value.split(".").map(Number);
    const first = parts[0] ?? -1;
    const second = parts[1] ?? -1;
    return first === 0 || first === 10 || first === 127 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
  }
  const normalized = value.toLowerCase();
  return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
}

async function assertSafeWebhookUrl(value: string) {
  const url = new URL(value);
  if (url.username || url.password || url.hostname === "localhost" || url.hostname.endsWith(".localhost") || url.hostname === "metadata.google.internal") {
    throw new Error("Webhook URL özel veya metadata ağına işaret edemez.");
  }
  const addresses = isIP(url.hostname) ? [url.hostname] : [...await resolve4(url.hostname), ...await resolve6(url.hostname)];
  if (addresses.some(isPrivateIp)) throw new Error("Webhook URL private network adresine çözümleniyor.");
}

export class WebhookEndpointService {
  async list(actor: FinanceActorContext) {
    assertAdminPermission(actor, "webhooks:view");
    return prisma.webhookEndpoint.findMany({
      where: { organizationId: actor.organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        description: true,
        active: true,
        apiVersion: true,
        failurePolicy: true,
        maxAttempts: true,
        createdAt: true,
        updatedAt: true,
        subscriptions: { select: { eventType: true } },
        _count: { select: { deliveries: true } },
      },
    });
  }

  async create(actor: FinanceActorContext, input: WebhookEndpointCreateInput) {
    assertAdminPermission(actor, "webhooks:manage");
    const parsed = webhookEndpointCreateSchema.parse(input);
    await assertSafeWebhookUrl(parsed.url);
    const secret = createWebhookSecret();
    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        organizationId: actor.organizationId,
        ownerUserId: actor.userId,
        url: parsed.url,
        description: parsed.description ?? null,
        secretEncrypted: encryptPlatformSecret(secret),
        headers: parsed.headers ? parsed.headers : Prisma.JsonNull,
        failurePolicy: parsed.failurePolicy,
        maxAttempts: parsed.maxAttempts,
        subscriptions: { create: parsed.events.map((eventType) => ({ eventType })) },
      },
      select: { id: true, url: true, description: true, active: true, apiVersion: true, failurePolicy: true, maxAttempts: true, createdAt: true },
    });
    await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "WEBHOOK_ENDPOINT_CREATED", entityType: "WebhookEndpoint", entityId: endpoint.id, metadata: { url: parsed.url, events: parsed.events } });
    return { ...endpoint, secret };
  }

  async rotateSecret(actor: FinanceActorContext, endpointId: string) {
    assertAdminPermission(actor, "webhooks:manage");
    const endpoint = await prisma.webhookEndpoint.findFirst({ where: { id: endpointId, organizationId: actor.organizationId } });
    if (!endpoint) throw new Error("Webhook endpoint bulunamadı.");
    const secret = createWebhookSecret();
    await prisma.webhookEndpoint.update({ where: { id: endpoint.id }, data: { secretEncrypted: encryptPlatformSecret(secret) } });
    await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "WEBHOOK_SECRET_ROTATED", entityType: "WebhookEndpoint", entityId: endpoint.id });
    return { id: endpoint.id, secret };
  }

  async createDelivery(input: { organizationId: string; eventType: string; payload: Record<string, unknown> }) {
    const endpoints = await prisma.webhookEndpoint.findMany({ where: { organizationId: input.organizationId, active: true, subscriptions: { some: { eventType: input.eventType } } } });
    if (endpoints.length === 0) return [];
    const created = [] as Array<{ id: string; endpointId: string }>;
    for (const endpoint of endpoints) {
      const delivery = await prisma.webhookDelivery.create({
        data: { webhookEndpointId: endpoint.id, organizationId: input.organizationId, eventType: input.eventType, idempotencyKey: `${input.eventType}:${randomUUID()}`, payload: input.payload as Prisma.InputJsonValue },
        select: { id: true, webhookEndpointId: true },
      });
      created.push({ id: delivery.id, endpointId: delivery.webhookEndpointId });
    }
    return created;
  }

  getSignedHeaders(endpointSecretEncrypted: string, deliveryId: string, payload: string) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac("sha256", decryptPlatformSecret(endpointSecretEncrypted)).update(`${timestamp}.${deliveryId}.${payload}`).digest("hex");
    return { "x-radarune-delivery-id": deliveryId, "x-radarune-timestamp": timestamp, "x-radarune-signature": `v1=${signature}` };
  }
}

export const webhookEndpointService = new WebhookEndpointService();
