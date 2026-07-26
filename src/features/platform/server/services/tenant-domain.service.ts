import "server-only";
import { randomBytes } from "node:crypto";
import { resolveTxt } from "node:dns/promises";
import { customDomainSchema } from "@/features/platform/schemas/platform.schema";
import { tenantRepository } from "@/features/platform/server/repositories/tenant.repository";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { prisma } from "@/server/prisma/prisma";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";

const reservedDomains = new Set(["radarune.com", "www.radarune.com", "localhost"]);

export class TenantDomainService {
  async list(actor: FinanceActorContext) {
    assertAdminPermission(actor, "tenant:domains:manage");
    return tenantRepository.listDomains(actor.organizationId);
  }

  async add(actor: FinanceActorContext, input: { domain: string }) {
    assertAdminPermission(actor, "tenant:domains:manage");
    const parsed = customDomainSchema.parse(input);
    if (reservedDomains.has(parsed.domain)) {
      throw new Error("Radarune sistem alan adı özel tenant alan adı olarak kullanılamaz.");
    }

    const existing = await prisma.tenantDomain.findFirst({ where: { domain: parsed.domain } });
    if (existing) {
      throw new Error("Bu alan adı başka bir tenant tarafından kullanılıyor.");
    }

    const domain = await tenantRepository.createDomain({
      organizationId: actor.organizationId,
      domain: parsed.domain,
      verificationToken: `radarune-domain-${randomBytes(24).toString("hex")}`,
    });
    await auditLogService.create({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "TENANT_DOMAIN_ADDED",
      entityType: "TenantDomain",
      entityId: domain.id,
      metadata: { domain: domain.domain },
    });
    return { id: domain.id, domain: domain.domain, status: domain.status, verificationMethod: domain.verificationMethod };
  }

  async verify(actor: FinanceActorContext, domainId: string) {
    assertAdminPermission(actor, "tenant:domains:manage");
    const domain = await prisma.tenantDomain.findFirst({ where: { id: domainId, organizationId: actor.organizationId } });
    if (!domain) throw new Error("Alan adı bulunamadı.");

    const host = domain.domain;
    try {
      const txtRecords = await resolveTxt(`_radarune.${host}`);
      const tokenFound = txtRecords.flat().some((record) => record === domain.verificationToken);
      if (!tokenFound) {
        throw new Error("DNS TXT doğrulama kaydı bulunamadı.");
      }
      const updated = await prisma.tenantDomain.update({
        where: { id: domain.id },
        data: { status: "VERIFIED", verifiedAt: new Date(), lastCheckedAt: new Date(), lastError: null },
        select: { id: true, domain: true, status: true, verifiedAt: true },
      });
      await auditLogService.create({
        organizationId: actor.organizationId,
        actorUserId: actor.userId,
        action: "TENANT_DOMAIN_VERIFIED",
        entityType: "TenantDomain",
        entityId: domain.id,
        metadata: { domain: domain.domain, method: "DNS_TXT" },
      });
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : "DNS doğrulaması başarısız oldu.";
      await prisma.tenantDomain.update({
        where: { id: domain.id },
        data: { status: "FAILED", lastCheckedAt: new Date(), lastError: message.slice(0, 500) },
      });
      throw new Error("Alan adı doğrulanamadı. DNS kaydını kontrol edip tekrar deneyin.");
    }
  }

  async activate(actor: FinanceActorContext, domainId: string) {
    assertAdminPermission(actor, "tenant:domains:manage");
    const domain = await prisma.tenantDomain.findFirst({ where: { id: domainId, organizationId: actor.organizationId } });
    if (!domain) throw new Error("Alan adı bulunamadı.");
    if (domain.status !== "VERIFIED") throw new Error("Doğrulanmamış alan adı aktif edilemez.");
    return prisma.$transaction(async (tx) => {
      await tx.tenantDomain.updateMany({ where: { organizationId: actor.organizationId, status: "ACTIVE" }, data: { status: "VERIFIED", activatedAt: null } });
      const active = await tx.tenantDomain.update({ where: { id: domainId }, data: { status: "ACTIVE", activatedAt: new Date() } });
      await tx.organization.update({ where: { id: actor.organizationId }, data: { primaryDomain: active.domain } });
      await auditLogService.create({
        organizationId: actor.organizationId,
        actorUserId: actor.userId,
        action: "TENANT_DOMAIN_ACTIVATED",
        entityType: "TenantDomain",
        entityId: domainId,
        metadata: { domain: active.domain },
      }, tx);
      return active;
    });
  }
}

export const tenantDomainService = new TenantDomainService();
