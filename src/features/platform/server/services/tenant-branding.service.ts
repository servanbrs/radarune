import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { brandingUpdateSchema, type BrandingUpdateInput } from "@/features/platform/schemas/platform.schema";
import { tenantRepository } from "@/features/platform/server/repositories/tenant.repository";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

export class TenantBrandingService {
  async update(actor: FinanceActorContext, input: BrandingUpdateInput) {
    assertAdminPermission(actor, "tenant:branding:manage");
    const parsed = brandingUpdateSchema.parse(input);
    const branding = await tenantRepository.upsertBranding(actor.organizationId, {
      brandName: parsed.brandName,
      legalName: parsed.legalName ?? null,
      logoUrl: parsed.logoUrl ?? null,
      faviconUrl: parsed.faviconUrl ?? null,
      supportEmail: parsed.supportEmail ?? null,
      socialLinks: parsed.socialLinks ? parsed.socialLinks as Prisma.InputJsonValue : Prisma.JsonNull,
      seoDefaults: parsed.seoDefaults ? parsed.seoDefaults as Prisma.InputJsonValue : Prisma.JsonNull,
    });
    await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "TENANT_BRANDING_UPDATED", entityType: "TenantBranding", entityId: branding.id });
    return branding;
  }
}

export const tenantBrandingService = new TenantBrandingService();
