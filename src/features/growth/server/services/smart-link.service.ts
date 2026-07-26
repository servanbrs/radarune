import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { entitlementService } from "@/features/billing/server/services/entitlement.service";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { createSmartLinkSchema, type CreateSmartLinkInput } from "@/features/growth/schemas/growth.schema";
import { growthRepository } from "@/features/growth/server/repositories/growth.repository";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { prisma } from "@/server/prisma/prisma";

export class SmartLinkService {
  async list(actor: FinanceActorContext) {
    return growthRepository.listSmartLinks(actor.organizationId);
  }

  async getById(actor: FinanceActorContext, id: string) {
    return growthRepository.findSmartLinkById(actor.organizationId, id);
  }

  async create(actor: FinanceActorContext, input: CreateSmartLinkInput) {
    const parsed = createSmartLinkSchema.parse(input);
    await entitlementService.assertFeatureEnabled({ organizationId: actor.organizationId }, "smart_links.enabled");
    await entitlementService.assertWithinLimit({ organizationId: actor.organizationId }, "smart_links.max");

    const artist = await growthRepository.findArtistAccess(actor.organizationId, actor.userId, parsed.artistId);
    if (!artist) {
      throw new Error("Bu sanatçı için Smart Link oluşturma yetkiniz yok.");
    }

    return prisma.$transaction(async (tx) => {
      try {
        const smartLink = await growthRepository.createSmartLink(actor.organizationId, actor.userId, parsed, tx);
        await auditLogService.create(
          {
            organizationId: actor.organizationId,
            actorUserId: actor.userId,
            action: "SMART_LINK_CREATED",
            entityType: "SmartLink",
            entityId: smartLink.id,
            metadata: { slug: smartLink.slug },
          },
          tx,
        );
        return smartLink;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw new Error("Bu Smart Link slug zaten kullanılıyor.");
        }
        throw error;
      }
    });
  }
}

export const smartLinkService = new SmartLinkService();
