import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { entitlementService } from "@/features/billing/server/services/entitlement.service";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { createSecureToken, hashPrivacyValue } from "@/features/growth/server/security.server";
import {
  createPreSaveCampaignSchema,
  preSaveEmailSubscribeSchema,
  type CreatePreSaveCampaignInput,
  type PreSaveEmailSubscribeInput,
} from "@/features/growth/schemas/growth.schema";
import { growthRepository } from "@/features/growth/server/repositories/growth.repository";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { prisma } from "@/server/prisma/prisma";

export class PreSaveService {
  async list(actor: FinanceActorContext) {
    return growthRepository.listPreSaves(actor.organizationId);
  }

  async getById(actor: FinanceActorContext, id: string) {
    return growthRepository.findPreSaveById(actor.organizationId, id);
  }

  async create(actor: FinanceActorContext, input: CreatePreSaveCampaignInput) {
    const parsed = createPreSaveCampaignSchema.parse(input);
    await entitlementService.assertFeatureEnabled({ organizationId: actor.organizationId }, "presave.enabled");
    await entitlementService.assertWithinLimit({ organizationId: actor.organizationId }, "presave.max");

    const artist = await growthRepository.findArtistAccess(actor.organizationId, actor.userId, parsed.artistId);
    if (!artist) {
      throw new Error("Bu sanatçı için Pre-save oluşturma yetkiniz yok.");
    }

    return prisma.$transaction(async (tx) => {
      try {
        const campaign = await growthRepository.createPreSaveCampaign(actor.organizationId, actor.userId, parsed, tx);
        await auditLogService.create(
          {
            organizationId: actor.organizationId,
            actorUserId: actor.userId,
            action: "PRESAVE_CAMPAIGN_CREATED",
            entityType: "PreSaveCampaign",
            entityId: campaign.id,
            metadata: { slug: campaign.slug },
          },
          tx,
        );
        return campaign;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw new Error("Bu Pre-save slug zaten kullanılıyor.");
        }
        throw error;
      }
    });
  }

  async subscribeByEmail(slug: string, input: PreSaveEmailSubscribeInput) {
    const parsed = preSaveEmailSubscribeSchema.parse(input);
    const campaign = await growthRepository.findPreSaveBySlug(slug);
    if (!campaign || !campaign.active || !campaign.emailCaptureEnabled) {
      throw new Error("Bu kampanya e-posta kaydı kabul etmiyor.");
    }

    const emailHash = hashPrivacyValue(parsed.email, campaign.id);
    try {
      return await growthRepository.createPreSaveSubscriber({
        organizationId: campaign.organizationId,
        campaignId: campaign.id,
        emailNormalized: parsed.email,
        emailHash,
        marketingConsent: parsed.marketingConsent,
        unsubscribeToken: createSecureToken(),
        ...(campaign.marketingConsentText ? { consentText: campaign.marketingConsentText } : {}),
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("Bu e-posta adresi kampanyaya daha önce kaydedilmiş.");
      }
      throw error;
    }
  }

  async unsubscribe(token: string) {
    return growthRepository.unsubscribe(token);
  }
}

export const preSaveService = new PreSaveService();
