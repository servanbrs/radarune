import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { sitePageUpdateSchema, type SitePageUpdateInput } from "@/features/platform/schemas/platform.schema";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

function jsonValue(value: Record<string, unknown> | undefined) {
  return value === undefined ? undefined : value as Prisma.InputJsonValue;
}

export class SiteBuilderService {
  async getHomepage(organizationId: string) {
    return prisma.sitePage.findFirst({
      where: { organizationId, kind: "HOMEPAGE", slug: "home" },
      include: { sections: { orderBy: { sortOrder: "asc" } } },
    });
  }

  async getHomepageForAdmin(actor: FinanceActorContext) {
    assertAdminPermission(actor, "site-builder:view");
    return this.getHomepage(actor.organizationId);
  }

  async updateHomepage(actor: FinanceActorContext, input: SitePageUpdateInput) {
    assertAdminPermission(actor, "homepage:manage");
    const parsed = sitePageUpdateSchema.parse(input);
    return prisma.$transaction(async (tx) => {
      const page = await tx.sitePage.upsert({
        where: { organizationId_kind_slug: { organizationId: actor.organizationId, kind: "HOMEPAGE", slug: "home" } },
        update: { title: parsed.title },
        create: { organizationId: actor.organizationId, kind: "HOMEPAGE", slug: "home", title: parsed.title },
      });
      await tx.siteSection.deleteMany({ where: { sitePageId: page.id } });
      await tx.siteSection.createMany({
        data: parsed.sections.map((section) => ({
          sitePageId: page.id,
          sectionType: section.sectionType,
          sortOrder: section.sortOrder,
          active: section.active,
          title: section.title ?? null,
          subtitle: section.subtitle ?? null,
          description: section.description ?? null,
          imageUrl: section.imageUrl ?? null,
          background: section.background ?? null,
          textAlign: section.textAlign,
          maxItems: section.maxItems ?? null,
          dataSource: section.dataSource,
          ctaLabel: section.ctaLabel ?? null,
          ctaUrl: section.ctaUrl ?? null,
          responsiveConfig: jsonValue(section.responsiveConfig) ?? Prisma.JsonNull,
          content: jsonValue(section.content) ?? Prisma.JsonNull,
        })),
      });
      await auditLogService.create({
        organizationId: actor.organizationId,
        actorUserId: actor.userId,
        action: "SITE_HOMEPAGE_UPDATED",
        entityType: "SitePage",
        entityId: page.id,
        metadata: { sectionCount: parsed.sections.length },
      }, tx);
      return tx.sitePage.findUniqueOrThrow({ where: { id: page.id }, include: { sections: { orderBy: { sortOrder: "asc" } } } });
    });
  }

  async publishHomepage(actor: FinanceActorContext) {
    assertAdminPermission(actor, "homepage:manage");
    return prisma.$transaction(async (tx) => {
      const page = await tx.sitePage.findFirst({ where: { organizationId: actor.organizationId, kind: "HOMEPAGE", slug: "home" }, include: { sections: { orderBy: { sortOrder: "asc" } } } });
      if (!page) throw new Error("Ana sayfa yapılandırması bulunamadı.");
      const latest = await tx.sitePageVersion.aggregate({ where: { sitePageId: page.id }, _max: { version: true } });
      const version = (latest._max.version ?? 0) + 1;
      await tx.sitePageVersion.create({
        data: {
          sitePageId: page.id,
          organizationId: actor.organizationId,
          version,
          snapshot: JSON.parse(JSON.stringify(page)) as Prisma.InputJsonValue,
          publishedById: actor.userId,
        },
      });
      const published = await tx.sitePage.update({ where: { id: page.id }, data: { status: "PUBLISHED", publishedVersion: version } });
      await auditLogService.create({
        organizationId: actor.organizationId,
        actorUserId: actor.userId,
        action: "SITE_HOMEPAGE_PUBLISHED",
        entityType: "SitePage",
        entityId: page.id,
        metadata: { version },
      }, tx);
      return { id: published.id, version, status: published.status };
    });
  }
}

export const siteBuilderService = new SiteBuilderService();
