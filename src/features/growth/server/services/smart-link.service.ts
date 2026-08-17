import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { entitlementService } from "@/features/billing/server/services/entitlement.service";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { createSmartLinkSchema, type CreateSmartLinkInput, updateSmartLinkSchema } from "@/features/growth/schemas/growth.schema";
import { growthRepository } from "@/features/growth/server/repositories/growth.repository";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { prisma } from "@/server/prisma/prisma";
import { canAccessAdmin } from "@/features/admin/server/admin-context";

export class SmartLinkService {
  async list(actor: FinanceActorContext) {
    return growthRepository.listSmartLinks(actor.organizationId, actor.userId, canAccessAdmin(actor));
  }

  async getById(actor: FinanceActorContext, id: string) {
    return growthRepository.findSmartLinkById(actor.organizationId, id, actor.userId, canAccessAdmin(actor));
  }

  async create(actor: FinanceActorContext, input: CreateSmartLinkInput) {
    const parsed = createSmartLinkSchema.parse(input);
    await entitlementService.assertSmartLinkCreationAvailable({ organizationId: actor.organizationId });

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

  async update(actor: FinanceActorContext, id: string, input: CreateSmartLinkInput) {
    const parsed = updateSmartLinkSchema.parse(input);
    const current = await growthRepository.findSmartLinkById(actor.organizationId, id, actor.userId, canAccessAdmin(actor));
    if (!current) throw new Error("Smart Link bulunamadı.");
    const artist = await growthRepository.findArtistAccess(actor.organizationId, actor.userId, parsed.artistId);
    if (!artist) throw new Error("Bu sanatçı için Smart Link düzenleme yetkiniz yok.");

    try {
      return await prisma.$transaction(async (tx) => {
        const updated = await growthRepository.updateSmartLink(actor.organizationId, id, parsed, tx);
        if (!updated) throw new Error("Smart Link bulunamadı.");
        await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "SMART_LINK_UPDATED", entityType: "SmartLink", entityId: id, metadata: { slug: updated.slug } }, tx);
        return updated;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new Error("Bu Smart Link slug zaten kullanılıyor.");
      throw error;
    }
  }

  async remove(actor: FinanceActorContext, id: string) {
    const current = await this.getById(actor, id);
    if (!current) throw new Error("Smart Link bulunamadı.");
    const result = await growthRepository.deleteSmartLink(actor.organizationId, id);
    if (result.count !== 1) throw new Error("Smart Link bulunamadı.");
    await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "SMART_LINK_DELETED", entityType: "SmartLink", entityId: id });
    return { success: true as const };
  }
}

export const smartLinkService = new SmartLinkService();
