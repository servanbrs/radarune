import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { createVoteSchema, type CreateVoteInput } from "@/features/platform/schemas/platform.schema";
import { hashIp } from "@/features/mobile/server/lib/mobile-security";

type VoteActor = { organizationId: string; userId: string; ip?: string | null };

export class VotingService {
  async findPublicCampaign(organizationId: string, slug: string) {
    return prisma.voteCampaign.findFirst({
      where: { organizationId, slug, active: true },
      select: { id: true, name: true, slug: true, description: true, startsAt: true, endsAt: true, entityType: true, voteType: true, countryCode: true, imageUrl: true, rules: true, resultsPublishedAt: true, sponsorName: true },
    });
  }

  async createVote(actor: VoteActor, input: CreateVoteInput) {
    const parsed = createVoteSchema.parse(input);
    return prisma.$transaction(async (tx) => {
      const campaign = await tx.voteCampaign.findFirst({ where: { id: parsed.campaignId, organizationId: actor.organizationId, active: true } });
      if (!campaign) throw new Error("Oylama kampanyası bulunamadı.");
      const now = new Date();
      if (now < campaign.startsAt || now >= campaign.endsAt) throw new Error("Oylama kampanyası şu anda aktif değil.");
      if (campaign.entityType !== parsed.entityType) throw new Error("Oylanan içerik türü kampanya ile eşleşmiyor.");

      const existing = await tx.vote.findUnique({ where: { campaignId_idempotencyKey: { campaignId: campaign.id, idempotencyKey: parsed.idempotencyKey } } });
      if (existing) throw new Error("Bu oy isteği daha önce işlendi.");
      if (campaign.totalVoteLimit !== null) {
        const total = await tx.vote.count({ where: { campaignId: campaign.id, status: { in: ["VALID", "PENDING_REVIEW"] } } });
        if (total >= campaign.totalVoteLimit) throw new Error("Oylama toplam oy limitine ulaştı.");
      }
      if (campaign.dailyVoteLimit !== null) {
        const dayStart = new Date(now);
        dayStart.setHours(0, 0, 0, 0);
        const daily = await tx.vote.count({ where: { campaignId: campaign.id, userId: actor.userId, createdAt: { gte: dayStart }, status: { in: ["VALID", "PENDING_REVIEW"] } } });
        if (daily >= campaign.dailyVoteLimit) throw new Error("Günlük oy limitinize ulaştınız.");
      }
      const vote = await tx.vote.create({
        data: {
          campaignId: campaign.id,
          organizationId: actor.organizationId,
          userId: actor.userId,
          entityId: parsed.entityId,
          entityType: parsed.entityType,
          idempotencyKey: parsed.idempotencyKey,
          deviceHash: parsed.deviceHash ?? null,
          ipHash: hashIp(actor.ip ?? null),
          status: "VALID",
        },
      });
      const recipients = await tx.user.findMany({ where: { accountStatus: "ACTIVE", systemRole: { in: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] } }, select: { id: true } });
      await tx.notification.createMany({ data: recipients.map((recipient) => ({ organizationId: actor.organizationId, userId: recipient.id, type: "VOTE_CREATED", title: "Yeni oy kullanıldı", message: `${campaign.name} kampanyasında yeni bir oy geldi.`, entityType: "Vote", entityId: vote.id })) });
      await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "VOTE_CREATED", entityType: "Vote", entityId: vote.id, metadata: { campaignId: campaign.id, entityType: campaign.entityType } }, tx);
      return vote;
    }).catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new Error("Bu oy isteği daha önce işlendi.");
      throw error;
    });
  }

  async listResults(organizationId: string, campaignId: string) {
    const campaign = await prisma.voteCampaign.findFirst({ where: { id: campaignId, organizationId }, select: { id: true, name: true, resultsPublishedAt: true, endsAt: true } });
    if (!campaign) throw new Error("Oylama kampanyası bulunamadı.");
    const results = await prisma.vote.groupBy({ by: ["entityId", "entityType"], where: { campaignId, organizationId, status: "VALID" }, _count: { _all: true }, orderBy: { _count: { entityId: "desc" } } });
    return { campaign, results };
  }
}

export const votingService = new VotingService();
