import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { discoverConfigUpdateSchema, type DiscoverConfigUpdateInput } from "@/features/platform/schemas/platform.schema";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

export class DiscoverConfigService {
  async get(organizationId: string) {
    return prisma.discoverConfig.findUnique({ where: { organizationId } });
  }

  async update(actor: FinanceActorContext, input: DiscoverConfigUpdateInput) {
    assertAdminPermission(actor, "discover:manage");
    const parsed = discoverConfigUpdateSchema.parse(input);
    let normalizedWeights: Prisma.InputJsonValue | undefined;
    if (parsed.scoringWeights) {
      const weights = Object.entries(parsed.scoringWeights).filter((entry): entry is [string, number] => typeof entry[1] === "number");
      const total = weights.reduce((sum, [, value]) => sum + value, 0);
      if (total <= 0) throw new Error("Discover skor ağırlıklarının toplamı sıfır olamaz.");
      normalizedWeights = Object.fromEntries(weights.map(([key, value]) => [key, value / total]));
    }
    const data = Object.fromEntries(Object.entries(parsed).filter(([key, value]) => key !== "scoringWeights" && value !== undefined)) as Prisma.DiscoverConfigUpdateInput;
    const config = await prisma.discoverConfig.upsert({
      where: { organizationId: actor.organizationId },
      update: { ...data, ...(normalizedWeights ? { scoringWeights: normalizedWeights } : {}) },
      create: { organizationId: actor.organizationId, ...data, ...(normalizedWeights ? { scoringWeights: normalizedWeights } : {}) } as Prisma.DiscoverConfigUncheckedCreateInput,
    });
    await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "DISCOVER_CONFIG_UPDATED", entityType: "DiscoverConfig", entityId: config.id, metadata: { scoringWeightsNormalized: Boolean(normalizedWeights) } });
    return config;
  }
}

export const discoverConfigService = new DiscoverConfigService();
