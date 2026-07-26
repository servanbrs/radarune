import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import {
  themeConfigSchema,
  themeUpdateSchema,
  type ThemeUpdateInput,
} from "@/features/platform/schemas/platform.schema";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

const defaultTheme = {
  primaryColor: "#E5484D",
  secondaryColor: "#1B1B1F",
  accentColor: "#F4B942",
  backgroundColor: "#0B0B0F",
  cardColor: "#15151C",
  textColor: "#F7F7F8",
  mutedTextColor: "#A1A1AA",
  borderColor: "#2A2A34",
  successColor: "#2DBA7C",
  warningColor: "#F4B942",
  errorColor: "#E5484D",
  buttonBackground: "#E5484D",
  buttonText: "#FFFFFF",
  linkColor: "#78A9FF",
  sidebarColor: "#101014",
  headerColor: "#101014",
  playerColor: "#111118",
  discoverColor: "#101014",
  rankingColor: "#15151C",
  popupColor: "#15151C",
  borderRadius: 16,
  shadowIntensity: 30,
  fontFamily: "Geist",
  containerWidth: "1200px",
  density: "COMFORTABLE" as const,
  colorScheme: "SYSTEM" as const,
  gradientsEnabled: false,
};

function toSnapshot(config: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(config)) as Prisma.InputJsonValue;
}

export class ThemeService {
  async get(actor: FinanceActorContext) {
    assertAdminPermission(actor, "site-builder:view");
    return prisma.themeConfig.upsert({
      where: { organizationId: actor.organizationId },
      update: {},
      create: { organizationId: actor.organizationId, ...defaultTheme },
      select: {
        id: true,
        organizationId: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        backgroundColor: true,
        cardColor: true,
        textColor: true,
        mutedTextColor: true,
        borderColor: true,
        successColor: true,
        warningColor: true,
        errorColor: true,
        buttonBackground: true,
        buttonText: true,
        linkColor: true,
        sidebarColor: true,
        headerColor: true,
        playerColor: true,
        discoverColor: true,
        rankingColor: true,
        popupColor: true,
        borderRadius: true,
        shadowIntensity: true,
        fontFamily: true,
        containerWidth: true,
        density: true,
        colorScheme: true,
        gradientsEnabled: true,
        customVariables: true,
        draft: true,
        publishedAt: true,
        updatedAt: true,
      },
    });
  }

  async update(actor: FinanceActorContext, input: ThemeUpdateInput) {
    assertAdminPermission(actor, "site-builder:manage");
    const parsed = themeUpdateSchema.parse(input);
    const current = await this.get(actor);
    const merged = themeConfigSchema.parse({ ...current, customVariables: current.customVariables ?? undefined, ...parsed });

    const updated = await prisma.themeConfig.update({
      where: { organizationId: actor.organizationId },
      data: {
        ...merged,
        customVariables: merged.customVariables ? merged.customVariables as Prisma.InputJsonValue : Prisma.JsonNull,
        draft: true,
        updatedByUserId: actor.userId,
      },
    });
    await auditLogService.create({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "TENANT_THEME_UPDATED",
      entityType: "ThemeConfig",
      entityId: updated.id,
      metadata: { draft: true },
    });
    return updated;
  }

  async publish(actor: FinanceActorContext) {
    assertAdminPermission(actor, "site-builder:manage");
    return prisma.$transaction(async (tx) => {
      const current = await tx.themeConfig.findUnique({ where: { organizationId: actor.organizationId } });
      if (!current) throw new Error("Tema yapılandırması bulunamadı.");
      const latest = await tx.themeVersion.aggregate({
        where: { themeConfigId: current.id },
        _max: { version: true },
      });
      const version = (latest._max.version ?? 0) + 1;
      await tx.themeVersion.create({
        data: {
          themeConfigId: current.id,
          organizationId: actor.organizationId,
          version,
          snapshot: toSnapshot(current as unknown as Record<string, unknown>),
          publishedById: actor.userId,
        },
      });
      const published = await tx.themeConfig.update({
        where: { id: current.id },
        data: { draft: false, publishedAt: new Date(), updatedByUserId: actor.userId },
      });
      await auditLogService.create({
        organizationId: actor.organizationId,
        actorUserId: actor.userId,
        action: "TENANT_THEME_PUBLISHED",
        entityType: "ThemeConfig",
        entityId: current.id,
        metadata: { version },
      }, tx);
      return { id: published.id, version, publishedAt: published.publishedAt };
    });
  }
}

export const themeService = new ThemeService();
